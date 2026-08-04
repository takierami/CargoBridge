from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import send_mail
from django.db import transaction
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from accounts.deactivation import deactivate_user, reactivate_user
from accounts.models import Organization, UserProfile

User = get_user_model()


class OrgAwareTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Reject login for suspended organizations with a clear message."""

    def validate(self, attrs):
        username = attrs.get(self.username_field)
        user = (
            User.objects.filter(**{self.username_field: username})
            .select_related('profile', 'profile__organization')
            .first()
        )
        if user is not None:
            profile = getattr(user, 'profile', None)
            org = getattr(profile, 'organization', None) if profile else None
            if org is not None and not org.is_active:
                raise AuthenticationFailed(
                    'This organization\'s access has been suspended. Contact support.',
                    code='organization_suspended',
                )
        return super().validate(attrs)


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ['id', 'name', 'name_fr']


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['id', 'role', 'office']


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    organization = OrganizationSerializer(source='profile.organization', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile', 'organization']


_LEGACY_ROLE_MAP = {
    'china_admin': (UserProfile.ROLE_ADMIN, UserProfile.OFFICE_CHINA),
    'algeria_admin': (UserProfile.ROLE_ADMIN, UserProfile.OFFICE_ALGERIA),
}


def _normalize_role_office(role: str | None, office: str | None):
    """Map legacy china_admin/algeria_admin to SaaS role + office."""
    if role in _LEGACY_ROLE_MAP:
        mapped_role, mapped_office = _LEGACY_ROLE_MAP[role]
        return mapped_role, office or mapped_office
    return role or UserProfile.ROLE_ADMIN, office or UserProfile.OFFICE_CHINA


class RegisterSerializer(serializers.Serializer):
    """
    Provisioning helper for CLI / invite flows.
    Public company signup must use CompanyRegisterSerializer (no org UUID join).
    """

    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    company_name = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    company_name_fr = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    role = serializers.CharField(max_length=32, default=UserProfile.ROLE_ADMIN)
    office = serializers.ChoiceField(
        choices=[c[0] for c in UserProfile.OFFICE_CHOICES],
        required=False,
        default=UserProfile.OFFICE_CHINA,
    )
    organization = serializers.PrimaryKeyRelatedField(
        queryset=Organization.objects.all(),
        required=False,
        allow_null=True,
    )

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Username already taken.')
        return value

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages))
        return value

    def validate_role(self, value):
        allowed = {c[0] for c in UserProfile.ROLE_CHOICES} | set(_LEGACY_ROLE_MAP)
        if value not in allowed:
            raise serializers.ValidationError(f'Invalid role. Allowed: {sorted(allowed)}')
        return value

    def validate(self, attrs):
        org = attrs.get('organization')
        company_name = (attrs.get('company_name') or '').strip()
        if not org and not company_name:
            raise serializers.ValidationError(
                {'company_name': 'Provide company_name to create an organization, or organization to join one.'}
            )
        role, office = _normalize_role_office(attrs.get('role'), attrs.get('office'))
        attrs['role'] = role
        attrs['office'] = office
        return attrs

    def create(self, validated_data):
        org = validated_data.get('organization')
        created_org = False
        if org is None:
            org = Organization.objects.create(
                name=validated_data['company_name'].strip(),
                name_fr=validated_data.get('company_name_fr', '') or '',
            )
            created_org = True

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
        )
        UserProfile.objects.create(
            user=user,
            organization=org,
            role=validated_data.get('role', UserProfile.ROLE_ADMIN),
            office=validated_data.get('office', UserProfile.OFFICE_CHINA),
        )
        if created_org:
            from api.management.commands.seed_demo import seed_system_defaults
            seed_system_defaults(org)
        return user


class CompanyRegisterSerializer(serializers.Serializer):
    """Public self-serve signup: always creates a new org + owner. No org UUID accepted."""

    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    company_name = serializers.CharField(max_length=255)
    company_name_fr = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    accept_terms = serializers.BooleanField()
    office = serializers.ChoiceField(
        choices=[c[0] for c in UserProfile.OFFICE_CHOICES],
        required=False,
        default=UserProfile.OFFICE_CHINA,
    )

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Username already taken.')
        return value

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('Email already registered.')
        return value

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages))
        return value

    def validate_company_name(self, value):
        name = (value or '').strip()
        if len(name) < 2:
            raise serializers.ValidationError('Company name is required.')
        return name

    def validate_accept_terms(self, value):
        if not value:
            raise serializers.ValidationError('You must accept the terms to register.')
        return value

    def create(self, validated_data):
        with transaction.atomic():
            org = Organization.objects.create(
                name=validated_data['company_name'],
                name_fr=(validated_data.get('company_name_fr') or '').strip(),
            )
            user = User.objects.create_user(
                username=validated_data['username'],
                email=validated_data['email'],
                password=validated_data['password'],
            )
            UserProfile.objects.create(
                user=user,
                organization=org,
                role=UserProfile.ROLE_OWNER,
                office=validated_data.get('office', UserProfile.OFFICE_CHINA),
            )
            from api.management.commands.seed_demo import seed_system_defaults
            seed_system_defaults(org)
            return user


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def save(self, **kwargs):
        email = self.validated_data['email'].strip()
        user = User.objects.filter(email__iexact=email).first()
        # Always succeed from client POV (no email enumeration)
        if not user:
            return
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        frontend = getattr(settings, 'FRONTEND_URL', '').rstrip('/') or 'http://127.0.0.1:3025'
        reset_url = f'{frontend}/reset-password?uid={uid}&token={token}'
        send_mail(
            subject='CargoBridge — Password reset',
            message=(
                f'Hello {user.username},\n\n'
                f'Use this link to reset your password (expires soon):\n{reset_url}\n\n'
                'If you did not request this, ignore this email.\n'
            ),
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@cargobridge.local'),
            recipient_list=[user.email],
            fail_silently=False,
        )


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages))
        return value

    def validate(self, attrs):
        try:
            uid = force_str(urlsafe_base64_decode(attrs['uid']))
            user = User.objects.get(pk=uid)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            raise serializers.ValidationError({'uid': 'Invalid reset link.'})
        if not default_token_generator.check_token(user, attrs['token']):
            raise serializers.ValidationError({'token': 'Invalid or expired reset token.'})
        attrs['user'] = user
        return attrs

    def save(self, **kwargs):
        user = self.validated_data['user']
        user.set_password(self.validated_data['new_password'])
        user.save(update_fields=['password'])
        return user


class MemberSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    is_active = serializers.BooleanField(source='user.is_active', read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            'id', 'user_id', 'username', 'email', 'first_name', 'last_name',
            'role', 'office', 'is_active', 'created_at',
        ]


class MemberInviteSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=[c[0] for c in UserProfile.ROLE_CHOICES])
    office = serializers.ChoiceField(
        choices=[c[0] for c in UserProfile.OFFICE_CHOICES],
        default=UserProfile.OFFICE_CHINA,
    )

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Username already taken.')
        return value

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('Email already registered.')
        return value

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages))
        return value

    def validate_role(self, value):
        request = self.context.get('request')
        actor_role = getattr(getattr(request.user, 'profile', None), 'role', None) if request else None
        if value == UserProfile.ROLE_OWNER and actor_role != UserProfile.ROLE_OWNER:
            raise serializers.ValidationError('Only an owner can invite another owner.')
        return value

    def create(self, validated_data):
        request = self.context['request']
        org = request.user.profile.organization
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
        )
        return UserProfile.objects.create(
            user=user,
            organization=org,
            role=validated_data['role'],
            office=validated_data['office'],
        )


class MemberUpdateSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=[c[0] for c in UserProfile.ROLE_CHOICES], required=False)
    office = serializers.ChoiceField(
        choices=[c[0] for c in UserProfile.OFFICE_CHOICES],
        required=False,
    )
    is_active = serializers.BooleanField(required=False)

    def validate(self, attrs):
        request = self.context.get('request')
        actor = getattr(request.user, 'profile', None) if request else None
        target: UserProfile = self.context['target']
        if 'role' in attrs:
            new_role = attrs['role']
            if new_role == UserProfile.ROLE_OWNER and actor.role != UserProfile.ROLE_OWNER:
                raise serializers.ValidationError({'role': 'Only an owner can assign owner.'})
            if target.role == UserProfile.ROLE_OWNER and actor.role != UserProfile.ROLE_OWNER:
                raise serializers.ValidationError({'role': 'Only an owner can change an owner.'})
            if target.role == UserProfile.ROLE_OWNER and new_role != UserProfile.ROLE_OWNER:
                owners = UserProfile.objects.filter(
                    organization=target.organization,
                    role=UserProfile.ROLE_OWNER,
                    user__is_active=True,
                ).count()
                if owners <= 1:
                    raise serializers.ValidationError({'role': 'Cannot demote the last owner.'})
        if 'is_active' in attrs:
            if attrs['is_active'] is True and not target.organization.is_active:
                raise serializers.ValidationError({
                    'is_active': 'Cannot reactivate a member while the organization is suspended.',
                })
            if attrs['is_active'] is False:
                if target.user_id == request.user.id:
                    raise serializers.ValidationError({
                        'is_active': 'You cannot deactivate yourself.',
                    })
                if target.role == UserProfile.ROLE_OWNER:
                    owners = UserProfile.objects.filter(
                        organization=target.organization,
                        role=UserProfile.ROLE_OWNER,
                        user__is_active=True,
                    ).count()
                    if owners <= 1:
                        raise serializers.ValidationError({
                            'is_active': 'Cannot deactivate the last owner.',
                        })
        return attrs

    def update(self, instance, validated_data):
        if 'role' in validated_data:
            instance.role = validated_data['role']
        if 'office' in validated_data:
            instance.office = validated_data['office']
        if 'role' in validated_data or 'office' in validated_data:
            instance.save()
        if 'is_active' in validated_data:
            if validated_data['is_active']:
                reactivate_user(instance.user)
            else:
                deactivate_user(instance.user)
            instance.user.refresh_from_db(fields=['is_active'])
        return instance

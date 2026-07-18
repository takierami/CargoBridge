from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import Organization, UserProfile


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ['id', 'name', 'name_fr']


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['id', 'role']


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    organization = OrganizationSerializer(source='profile.organization', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile', 'organization']


class RegisterSerializer(serializers.Serializer):
    """Internal provisioning helper — not exposed as a public HTTP endpoint."""

    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    company_name = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    company_name_fr = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    role = serializers.ChoiceField(choices=['china_admin', 'algeria_admin'], default='china_admin')
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

    def validate(self, attrs):
        org = attrs.get('organization')
        company_name = (attrs.get('company_name') or '').strip()
        if not org and not company_name:
            raise serializers.ValidationError(
                {'company_name': 'Provide company_name to create an organization, or organization to join one.'}
            )
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
            role=validated_data.get('role', 'china_admin'),
        )
        if created_org:
            from api.management.commands.seed_demo import seed_organization
            seed_organization(org)
        return user

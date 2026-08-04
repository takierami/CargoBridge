from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from api.permissions import ORG_ADMIN_ROLES, is_org_admin_role, user_role

from .serializers import (
    CompanyRegisterSerializer,
    MemberInviteSerializer,
    MemberSerializer,
    MemberUpdateSerializer,
    OrgAwareTokenObtainPairSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    UserSerializer,
)
from .models import UserProfile
from .deactivation import deactivate_user
from django.db import transaction


class MeView(APIView):
    def get(self, request):
        if not hasattr(request.user, 'profile'):
            return Response({'detail': 'User profile missing.'}, status=status.HTTP_403_FORBIDDEN)
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        if not hasattr(request.user, 'profile'):
            return Response({'detail': 'User profile missing.'}, status=status.HTTP_403_FORBIDDEN)
        profile = request.user.profile
        org = profile.organization
        if 'role' in request.data or 'office' in request.data:
            return Response(
                {'detail': 'Role/office changes require an organization administrator.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        if any(k in request.data for k in ('company_name', 'company_name_fr', 'companyName', 'companyNameFr')):
            if not is_org_admin_role(profile.role):
                return Response(
                    {'detail': 'Only owners and admins can update company settings.'},
                    status=status.HTTP_403_FORBIDDEN,
                )
        before = {'company_name': org.name, 'company_name_fr': org.name_fr}
        if 'company_name' in request.data:
            org.name = request.data['company_name']
        if 'companyName' in request.data:
            org.name = request.data['companyName']
        if 'company_name_fr' in request.data:
            org.name_fr = request.data['company_name_fr']
        if 'companyNameFr' in request.data:
            org.name_fr = request.data['companyNameFr']
        org.save()
        from api.activity import record_activity
        record_activity(
            organization=org,
            module='settings',
            action='update',
            user=request.user,
            entity_type='organization',
            entity_id=org.id,
            entity_label=org.name,
            summary='Updated company settings',
            summary_ar='تحديث إعدادات الشركة',
            summary_fr='Mise à jour des paramètres société',
            before=before,
            after={'company_name': org.name, 'company_name_fr': org.name_fr},
            use_on_commit=False,
        )
        return Response(UserSerializer(request.user).data)


class CompanyRegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'register'

    def post(self, request):
        serializer = CompanyRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                'user': UserSerializer(user).data,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )


class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'password_reset'

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            serializer.save()
        except Exception:
            # Do not leak mail backend failures as enumeration; log via Django
            import logging
            logging.getLogger(__name__).exception('password reset email failed')
        return Response({'detail': 'If an account exists for that email, a reset link was sent.'})


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'password_reset'

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'detail': 'Password has been reset.'})


class MembersListCreateView(APIView):
    """List org members; invite new member (owner/admin)."""

    def get(self, request):
        if not hasattr(request.user, 'profile'):
            return Response({'detail': 'User profile missing.'}, status=status.HTTP_403_FORBIDDEN)
        org = request.user.profile.organization
        qs = UserProfile.objects.filter(organization=org).select_related('user').order_by('created_at')
        return Response(MemberSerializer(qs, many=True).data)

    def post(self, request):
        if not hasattr(request.user, 'profile'):
            return Response({'detail': 'User profile missing.'}, status=status.HTTP_403_FORBIDDEN)
        if user_role(request.user) not in ORG_ADMIN_ROLES:
            return Response({'detail': 'Only owners and admins can invite members.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = MemberInviteSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()
        return Response(MemberSerializer(profile).data, status=status.HTTP_201_CREATED)


class MemberDetailView(APIView):
    def patch(self, request, profile_id):
        if not hasattr(request.user, 'profile'):
            return Response({'detail': 'User profile missing.'}, status=status.HTTP_403_FORBIDDEN)
        if user_role(request.user) not in ORG_ADMIN_ROLES:
            return Response({'detail': 'Only owners and admins can update members.'}, status=status.HTTP_403_FORBIDDEN)
        org = request.user.profile.organization
        try:
            target = UserProfile.objects.select_related('user').get(pk=profile_id, organization=org)
        except UserProfile.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = MemberUpdateSerializer(
            data=request.data,
            context={'request': request, 'target': target},
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.update(target, serializer.validated_data)
        target.refresh_from_db()
        target.user.refresh_from_db(fields=['is_active'])
        return Response(MemberSerializer(target).data)

    def delete(self, request, profile_id):
        if not hasattr(request.user, 'profile'):
            return Response({'detail': 'User profile missing.'}, status=status.HTTP_403_FORBIDDEN)
        if user_role(request.user) not in ORG_ADMIN_ROLES:
            return Response({'detail': 'Only owners and admins can deactivate members.'}, status=status.HTTP_403_FORBIDDEN)
        org = request.user.profile.organization
        with transaction.atomic():
            try:
                target = (
                    UserProfile.objects.select_related('user')
                    .select_for_update()
                    .get(pk=profile_id, organization=org)
                )
            except UserProfile.DoesNotExist:
                return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
            if target.user_id == request.user.id:
                return Response(
                    {'detail': 'You cannot deactivate yourself.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if target.role == UserProfile.ROLE_OWNER:
                owners = (
                    UserProfile.objects.select_for_update()
                    .filter(
                        organization=org,
                        role=UserProfile.ROLE_OWNER,
                        user__is_active=True,
                    )
                    .count()
                )
                if owners <= 1:
                    return Response(
                        {'detail': 'Cannot deactivate the last owner.'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            deactivate_user(target.user)
            target.user.refresh_from_db(fields=['is_active'])
        return Response(
            {
                'detail': 'Member deactivated.',
                'member': MemberSerializer(target).data,
            },
            status=status.HTTP_200_OK,
        )


class TokenObtainPairAllowView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'
    serializer_class = OrgAwareTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        try:
            from django.contrib.auth import get_user_model
            from api.activity import record_activity
            User = get_user_model()
            username = request.data.get('username') or request.data.get('email') or ''
            user = User.objects.filter(username=username).select_related('profile').first()
            if user and hasattr(user, 'profile'):
                ok = response.status_code == 200
                record_activity(
                    organization=user.profile.organization,
                    module='auth',
                    action='login',
                    user=user if ok else None,
                    entity_type='user',
                    entity_label=user.username,
                    summary=f'{"Login" if ok else "Failed login"}: {user.username}',
                    summary_ar=f'{"تسجيل الدخول" if ok else "فشل الدخول"}: {user.username}',
                    summary_fr=f'{"Connexion" if ok else "Échec connexion"}: {user.username}',
                    metadata={'success': ok},
                    use_on_commit=False,
                )
        except Exception:
            pass
        return response


class ThrottledTokenRefreshView(TokenRefreshView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'refresh'


class LogoutView(APIView):
    """Blacklist the refresh token so stolen sessions cannot be reused."""

    def post(self, request):
        refresh = request.data.get('refresh')
        if not refresh:
            return Response({'error': 'refresh required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh)
            token.blacklist()
        except Exception:
            return Response({'error': 'Invalid or expired refresh token.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            from api.activity import record_activity
            if request.user and request.user.is_authenticated and hasattr(request.user, 'profile'):
                record_activity(
                    organization=request.user.profile.organization,
                    module='auth',
                    action='logout',
                    user=request.user,
                    entity_label=request.user.username,
                    summary=f'Logout: {request.user.username}',
                    use_on_commit=False,
                )
        except Exception:
            pass
        return Response(status=status.HTTP_204_NO_CONTENT)

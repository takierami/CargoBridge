from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .serializers import UserSerializer


class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        profile = request.user.profile
        org = profile.organization
        if 'role' in request.data:
            return Response(
                {'role': 'Role changes require an administrator.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        if 'company_name' in request.data:
            org.name = request.data['company_name']
        if 'company_name_fr' in request.data:
            org.name_fr = request.data['company_name_fr']
        org.save()
        return Response(UserSerializer(request.user).data)


class TokenObtainPairAllowView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'


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
        return Response(status=status.HTTP_204_NO_CONTENT)

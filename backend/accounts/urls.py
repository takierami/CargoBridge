from django.urls import path

from .views import (
    CompanyRegisterView,
    LogoutView,
    MemberDetailView,
    MembersListCreateView,
    MeView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    ThrottledTokenRefreshView,
    TokenObtainPairAllowView,
)

urlpatterns = [
    path('token/', TokenObtainPairAllowView.as_view()),
    path('token/refresh/', ThrottledTokenRefreshView.as_view()),
    path('logout/', LogoutView.as_view()),
    path('me/', MeView.as_view()),
    path('register/', CompanyRegisterView.as_view()),
    path('password-reset/', PasswordResetRequestView.as_view()),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view()),
    path('members/', MembersListCreateView.as_view()),
    path('members/<uuid:profile_id>/', MemberDetailView.as_view()),
]

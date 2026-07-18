from django.urls import path

from .views import LogoutView, MeView, ThrottledTokenRefreshView, TokenObtainPairAllowView

urlpatterns = [
    path('token/', TokenObtainPairAllowView.as_view()),
    path('token/refresh/', ThrottledTokenRefreshView.as_view()),
    path('logout/', LogoutView.as_view()),
    path('me/', MeView.as_view()),
]

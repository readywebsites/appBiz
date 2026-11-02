from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    LoginView,
    MeView,
    ChangePasswordView,
    AccountDeletionRequestView,
    CustomerReferralView,
    StaffUserViewSet,
    PhoneSendOTPView,
    PhoneVerifyOTPView,
    EmailLoginView,
    EmailSendOTPView,
    EmailVerifyOTPView,
    LogoutView,
)

router = DefaultRouter()
router.register(r"manage", StaffUserViewSet, basename="user-management")

urlpatterns = [
    # Legacy & Direct Auth Endpoints
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("login/", LoginView.as_view(), name="auth-login"),
    path("refresh/", TokenRefreshView.as_view(), name="auth-token-refresh"),
    path("token/refresh/", TokenRefreshView.as_view(), name="auth-token-refresh-alias"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path("me/", MeView.as_view(), name="auth-me"),
    path("change-password/", ChangePasswordView.as_view(), name="auth-change-password"),
    path("delete-account/", AccountDeletionRequestView.as_view(), name="auth-delete-account"),
    path("referrals/", CustomerReferralView.as_view(), name="auth-referrals"),

    # Phone OTP Authentication
    path("phone/send-otp/", PhoneSendOTPView.as_view(), name="auth-phone-send-otp"),
    path("phone/verify-otp/", PhoneVerifyOTPView.as_view(), name="auth-phone-verify-otp"),

    # Email & Password + Email OTP Authentication
    path("email/login/", EmailLoginView.as_view(), name="auth-email-login"),
    path("email/send-otp/", EmailSendOTPView.as_view(), name="auth-email-send-otp"),
    path("email/verify-otp/", EmailVerifyOTPView.as_view(), name="auth-email-verify-otp"),

    path("", include(router.urls)),
]


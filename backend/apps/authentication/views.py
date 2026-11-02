from rest_framework import status, generics, viewsets, views
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema, OpenApiResponse
from django.contrib.auth import authenticate
from .models import User, CustomerProfile, RoleChoices, OTPTypeChoices, Referral
from .permissions import IsAdminUser, IsSuperAdminUser
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserSerializer,
    CustomerProfileSerializer,
    ChangePasswordSerializer,
    StaffUserSerializer,
    PhoneSendOTPSerializer,
    PhoneVerifyOTPSerializer,
    EmailSendOTPSerializer,
    EmailVerifyOTPSerializer,
    generate_referral_code,
)
from .services.otp import create_otp_challenge, verify_otp_challenge, OTPCooldownError
from .services.sms import SMSService
from .services.email import EmailAuthService
from .throttling import AuthSendRateThrottle, AuthVerifyRateThrottle

@extend_schema(tags=["Authentication"])
class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "message": "Account created successfully.",
                "user": UserSerializer(user).data,
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
            },
            status=status.HTTP_201_CREATED,
        )

@extend_schema(tags=["Authentication"])
class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "message": "Signed in successfully.",
                "user": UserSerializer(user).data,
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
            },
            status=status.HTTP_200_OK,
        )

@extend_schema(tags=["Authentication"])
class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        user_serializer = self.get_serializer(user, data=request.data, partial=True)
        user_serializer.is_valid(raise_exception=True)
        user_serializer.save()

        # Update profile if provided
        profile_data = request.data.get("customer_profile")
        if profile_data:
            has_profile = False
            try:
                has_profile = hasattr(user, "customer_profile") and user.customer_profile is not None
            except Exception:
                has_profile = False

            if has_profile:
                prof_serializer = CustomerProfileSerializer(user.customer_profile, data=profile_data, partial=True)
                prof_serializer.is_valid(raise_exception=True)
                prof_serializer.save()
            else:
                code = generate_referral_code()
                while CustomerProfile.objects.filter(referral_code=code).exists():
                    code = generate_referral_code()
                CustomerProfile.objects.create(
                    user=user,
                    business_name=profile_data.get("business_name", "").strip(),
                    gstin=profile_data.get("gstin", "").strip(),
                    whatsapp_updates=profile_data.get("whatsapp_updates", True),
                    referral_code=code,
                )

            # If user has no custom first_name and business_name was provided, align first_name
            biz_name = profile_data.get("business_name", "").strip()
            if biz_name and (not user.first_name or user.first_name.startswith("client_")):
                user.first_name = biz_name
                user.save(update_fields=["first_name"])

        user.refresh_from_db()
        return Response(UserSerializer(user).data)

@extend_schema(tags=["Authentication"])
class ChangePasswordView(generics.GenericAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        user.set_password(serializer.validated_data["new_password"])
        user.save()
        return Response({"message": "Password changed successfully."}, status=status.HTTP_200_OK)

@extend_schema(tags=["Authentication"], request=None, responses={200: OpenApiResponse(description="Account deactivated successfully.")})
class AccountDeletionRequestView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        # In a regulated platform, mark inactive and schedule purge rather than hard cascading immediately
        user.is_active = False
        user.save()
        return Response(
            {"message": "Your account deletion request has been processed. Your account is deactivated."},
            status=status.HTTP_200_OK,
        )

@extend_schema(tags=["Authentication"])
class CustomerReferralView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        profile = getattr(user, "customer_profile", None)
        referral_code = profile.referral_code if profile else ""

        referrals = Referral.objects.filter(referrer=user).select_related("referred_user")
        total_invited = referrals.count()
        successful_referrals = referrals.filter(status__in=["QUALIFIED", "REWARDED"]).count()
        earned_rewards = sum((r.reward_amount for r in referrals.filter(status="REWARDED")), 0)

        history = [
            {
                "id": str(r.id),
                "referred_user": r.referred_user.full_name if r.referred_user else "Invited Client",
                "referral_code": r.referral_code,
                "status": r.status,
                "reward_amount": str(r.reward_amount),
                "created_at": r.created_at.isoformat(),
            }
            for r in referrals
        ]

        return Response({
            "referral_code": referral_code,
            "referral_url": f"https://biz499.com/ref/{referral_code}" if referral_code else "",
            "total_invited": total_invited,
            "successful_referrals": successful_referrals,
            "earned_rewards": str(earned_rewards),
            "reward_per_referral": "500.00",
            "history": history,
        }, status=status.HTTP_200_OK)

@extend_schema(tags=["User Management (Staff/Admin)"])
class StaffUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("-date_joined")
    serializer_class = StaffUserSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        role = self.request.query_params.get("role")
        search = self.request.query_params.get("search")
        qs = super().get_queryset()
        if role:
            qs = qs.filter(role=role)
        if search:
            qs = qs.filter(email__icontains=search) | qs.filter(first_name__icontains=search) | qs.filter(phone__icontains=search)
        return qs

@extend_schema(tags=["Authentication - Phone OTP"])
class PhoneSendOTPView(generics.GenericAPIView):
    serializer_class = PhoneSendOTPSerializer
    permission_classes = [AllowAny]
    throttle_classes = [AuthSendRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone = serializer.validated_data["phone"]

        try:
            challenge, plain_otp, cooldown = create_otp_challenge(phone, OTPTypeChoices.PHONE, purpose="LOGIN")
        except OTPCooldownError as e:
            return Response({"error": str(e), "cooldown": e.remaining_seconds}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        dispatch_result = SMSService.send_otp(phone, plain_otp)

        return Response(
            {
                "message": "Verification code dispatched via SMS.",
                "phone": phone,
                "cooldown": cooldown,
                "dev_mode": dispatch_result.get("dev_mode", False),
                "note": dispatch_result.get("note", ""),
            },
            status=status.HTTP_200_OK,
        )

@extend_schema(tags=["Authentication - Phone OTP"])
class PhoneVerifyOTPView(generics.GenericAPIView):
    serializer_class = PhoneVerifyOTPSerializer
    permission_classes = [AllowAny]
    throttle_classes = [AuthVerifyRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone = serializer.validated_data["phone"]
        otp = serializer.validated_data["otp"]
        full_name = serializer.validated_data.get("full_name", "").strip()
        business_name = serializer.validated_data.get("business_name", "").strip()
        email = serializer.validated_data.get("email", "").strip().lower()

        success, message = verify_otp_challenge(phone, OTPTypeChoices.PHONE, otp)
        if not success:
            return Response({"error": message}, status=status.HTTP_400_BAD_REQUEST)

        # Find existing user by phone
        user = User.objects.filter(phone=phone).first()
        is_new_user = False

        if user:
            if not user.is_active:
                return Response({"error": "This account is currently deactivated."}, status=status.HTTP_403_FORBIDDEN)
            if not user.is_verified:
                user.is_verified = True
                user.save(update_fields=["is_verified"])
        else:
            # New user registration
            is_new_user = True
            # Assign or generate safe customer email
            if not email:
                safe_digits = phone.replace("+", "")
                email = f"client_{safe_digits}@biz499.internal"

            # If user with this email already exists, do not silently link
            existing_email_user = User.objects.filter(email=email).first()
            if existing_email_user:
                if existing_email_user.phone != phone:
                    return Response(
                        {"error": f"An account with email {email} already exists. Please sign in with email and link your phone in profile settings."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                user = existing_email_user
            else:
                name_parts = full_name.split(" ", 1) if full_name else ["", ""]
                first_name = name_parts[0]
                last_name = name_parts[1] if len(name_parts) > 1 else ""

                user = User.objects.create_user(
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    phone=phone,
                    role=RoleChoices.CUSTOMER,
                    is_verified=True,
                )
                code = generate_referral_code()
                while CustomerProfile.objects.filter(referral_code=code).exists():
                    code = generate_referral_code()

                CustomerProfile.objects.create(
                    user=user,
                    business_name=business_name,
                    referral_code=code,
                )

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "message": "Phone verified and signed in successfully.",
                "is_new_user": is_new_user,
                "user": UserSerializer(user).data,
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
            },
            status=status.HTTP_200_OK if not is_new_user else status.HTTP_201_CREATED,
        )

@extend_schema(tags=["Authentication - Email"])
class EmailLoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        # If user account is not verified, require Email OTP verification
        if not user.is_verified:
            try:
                challenge, plain_otp, cooldown = create_otp_challenge(user.email, OTPTypeChoices.EMAIL, purpose="VERIFY_EMAIL")
                dispatch = EmailAuthService.send_otp(user.email, plain_otp)
                return Response(
                    {
                        "requires_otp": True,
                        "message": "Account email requires verification. A 6-digit code has been sent to your email.",
                        "email": user.email,
                        "cooldown": cooldown,
                        "dev_mode": dispatch.get("dev_mode", False),
                    },
                    status=status.HTTP_200_OK,
                )
            except OTPCooldownError as e:
                return Response(
                    {"requires_otp": True, "error": str(e), "cooldown": e.remaining_seconds, "email": user.email},
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "requires_otp": False,
                "message": "Signed in successfully.",
                "user": UserSerializer(user).data,
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
            },
            status=status.HTTP_200_OK,
        )

@extend_schema(tags=["Authentication - Email"])
class EmailSendOTPView(generics.GenericAPIView):
    serializer_class = EmailSendOTPSerializer
    permission_classes = [AllowAny]
    throttle_classes = [AuthSendRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        try:
            challenge, plain_otp, cooldown = create_otp_challenge(email, OTPTypeChoices.EMAIL, purpose="LOGIN")
        except OTPCooldownError as e:
            return Response({"error": str(e), "cooldown": e.remaining_seconds}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        dispatch = EmailAuthService.send_otp(email, plain_otp)
        return Response(
            {
                "message": "Verification code dispatched via email.",
                "email": email,
                "cooldown": cooldown,
                "dev_mode": dispatch.get("dev_mode", False),
                "note": dispatch.get("note", ""),
            },
            status=status.HTTP_200_OK,
        )

@extend_schema(tags=["Authentication - Email"])
class EmailVerifyOTPView(generics.GenericAPIView):
    serializer_class = EmailVerifyOTPSerializer
    permission_classes = [AllowAny]
    throttle_classes = [AuthVerifyRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        otp = serializer.validated_data["otp"]

        success, message = verify_otp_challenge(email, OTPTypeChoices.EMAIL, otp)
        if not success:
            return Response({"error": message}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email=email).first()
        if not user:
            return Response({"error": "No account found matching this email address."}, status=status.HTTP_404_NOT_FOUND)

        if not user.is_active:
            return Response({"error": "This account is currently deactivated."}, status=status.HTTP_403_FORBIDDEN)

        user.is_verified = True
        user.save(update_fields=["is_verified"])

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "message": "Email verified and signed in successfully.",
                "user": UserSerializer(user).data,
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
            },
            status=status.HTTP_200_OK,
        )

@extend_schema(tags=["Authentication"], request=None, responses={200: OpenApiResponse(description="Logged out successfully.")})
class LogoutView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        refresh_token = request.data.get("refresh")
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass
        return Response({"message": "Successfully logged out."}, status=status.HTTP_200_OK)



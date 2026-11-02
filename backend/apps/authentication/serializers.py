import random
import string
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, CustomerProfile, RoleChoices

def generate_referral_code(prefix="BIZ"):
    random_str = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"{prefix}-{random_str}"

class CustomerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerProfile
        fields = [
            "id",
            "business_name",
            "industry",
            "website_url",
            "gstin",
            "address",
            "city",
            "state",
            "pincode",
            "country",
            "referral_code",
            "marketing_consent",
            "whatsapp_updates",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "referral_code", "created_at", "updated_at"]

class UserSerializer(serializers.ModelSerializer):
    customer_profile = CustomerProfileSerializer(read_only=True)
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "phone",
            "role",
            "is_verified",
            "is_active",
            "is_staff",
            "date_joined",
            "customer_profile",
        ]
        read_only_fields = ["id", "role", "is_verified", "is_active", "is_staff", "date_joined"]

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    business_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    referred_by = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ["email", "password", "first_name", "last_name", "phone", "business_name", "referred_by"]

    def create(self, validated_data):
        business_name = validated_data.pop("business_name", "")
        referred_by = validated_data.pop("referred_by", "")
        password = validated_data.pop("password")

        user = User.objects.create_user(
            email=validated_data["email"],
            password=password,
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            phone=validated_data.get("phone", ""),
            role=RoleChoices.CUSTOMER,
            is_verified=True,  # Default verified for smooth onboarding, email token service is ready
        )

        code = generate_referral_code()
        while CustomerProfile.objects.filter(referral_code=code).exists():
            code = generate_referral_code()

        CustomerProfile.objects.create(
            user=user,
            business_name=business_name,
            referral_code=code,
        )

        if referred_by:
            ref_owner = CustomerProfile.objects.filter(referral_code=referred_by.strip()).first()
            if ref_owner and ref_owner.user != user:
                from .models import Referral
                Referral.objects.create(
                    referrer=ref_owner.user,
                    referred_user=user,
                    referral_code=referred_by.strip(),
                    status="REGISTERED",
                )

        return user

import re

def normalize_phone_number(phone: str) -> str:
    cleaned = re.sub(r"[\s\-\(\)]", "", phone.strip())
    if not cleaned:
        raise serializers.ValidationError("Phone number cannot be empty.")
    if not cleaned.startswith("+"):
        # Default to India (+91) if 10-digit mobile number supplied
        if len(cleaned) == 10 and cleaned.isdigit():
            cleaned = f"+91{cleaned}"
        else:
            cleaned = f"+{cleaned}"
    if not re.match(r"^\+[1-9]\d{8,14}$", cleaned):
        raise serializers.ValidationError("Please enter a valid mobile number with country code (e.g. +91 98765 43210).")
    return cleaned

class PhoneSendOTPSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=25)

    def validate_phone(self, value):
        return normalize_phone_number(value)

class PhoneVerifyOTPSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=25)
    otp = serializers.CharField(max_length=10)
    full_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    business_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)

    def validate_phone(self, value):
        return normalize_phone_number(value)

    def validate_otp(self, value):
        cleaned = value.strip()
        if not cleaned.isdigit() or len(cleaned) != 6:
            raise serializers.ValidationError("Verification code must be exactly 6 digits.")
        return cleaned

class EmailSendOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        return value.strip().lower()

class EmailVerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=10)

    def validate_email(self, value):
        return value.strip().lower()

    def validate_otp(self, value):
        cleaned = value.strip()
        if not cleaned.isdigit() or len(cleaned) != 6:
            raise serializers.ValidationError("Verification code must be exactly 6 digits.")
        return cleaned




class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        if email and password:
            user = authenticate(email=email, password=password)
            if not user:
                raise serializers.ValidationError("Invalid email or password.")
            if not user.is_active:
                raise serializers.ValidationError("This account is currently deactivated.")
            attrs["user"] = user
            return attrs
        raise serializers.ValidationError("Must include both email and password.")

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password does not match.")
        return value

class StaffUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, validators=[validate_password])

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "password",
            "first_name",
            "last_name",
            "phone",
            "role",
            "is_active",
            "is_staff",
            "date_joined",
        ]
        read_only_fields = ["id", "date_joined"]

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        role = validated_data.get("role", RoleChoices.SALES_EXECUTIVE)
        is_staff = role != RoleChoices.CUSTOMER
        user = User.objects.create_user(
            email=validated_data["email"],
            password=password,
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            phone=validated_data.get("phone", ""),
            role=role,
            is_staff=is_staff,
            is_verified=True,
        )
        return user





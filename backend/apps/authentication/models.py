import uuid
from decimal import Decimal
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone

class RoleChoices(models.TextChoices):
    SUPER_ADMIN = "SUPER_ADMIN", "Super Administrator"
    ADMIN = "ADMIN", "Administrator"
    SALES_MANAGER = "SALES_MANAGER", "Sales Manager"
    SALES_EXECUTIVE = "SALES_EXECUTIVE", "Sales Executive"
    PROJECT_MANAGER = "PROJECT_MANAGER", "Project Manager"
    PROJECT_MEMBER = "PROJECT_MEMBER", "Project Member"
    FINANCE = "FINANCE", "Finance Staff"
    SUPPORT = "SUPPORT", "Support Staff"
    CUSTOMER = "CUSTOMER", "Customer"

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        role = extra_fields.get("role", RoleChoices.CUSTOMER)
        extra_fields["role"] = role
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", RoleChoices.SUPER_ADMIN)
        extra_fields.setdefault("is_verified", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, db_index=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    phone = models.CharField(max_length=20, blank=True, db_index=True)
    role = models.CharField(
        max_length=30,
        choices=RoleChoices.choices,
        default=RoleChoices.CUSTOMER,
        db_index=True,
    )
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering = ["-date_joined"]

    @property
    def full_name(self):
        name = f"{self.first_name} {self.last_name}".strip()
        return name if name else self.email

    @property
    def is_customer(self):
        return self.role == RoleChoices.CUSTOMER

    @property
    def is_sales(self):
        return self.role in (RoleChoices.SALES_MANAGER, RoleChoices.SALES_EXECUTIVE)

    @property
    def is_project_staff(self):
        return self.role in (RoleChoices.PROJECT_MANAGER, RoleChoices.PROJECT_MEMBER)

    @property
    def is_finance(self):
        return self.role == RoleChoices.FINANCE

    @property
    def is_admin_or_super(self):
        return self.role in (RoleChoices.ADMIN, RoleChoices.SUPER_ADMIN) or self.is_superuser

    def __str__(self):
        return f"{self.email} ({self.role})"

class CustomerProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="customer_profile")
    business_name = models.CharField(max_length=255, blank=True)
    industry = models.CharField(max_length=100, blank=True)
    website_url = models.URLField(max_length=500, blank=True)
    gstin = models.CharField(max_length=20, blank=True, help_text="Goods and Services Tax ID")
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=100, default="India")
    referral_code = models.CharField(max_length=50, blank=True, unique=True, null=True, db_index=True)
    marketing_consent = models.BooleanField(default=True)
    whatsapp_updates = models.BooleanField(default=True)
    notes = models.TextField(blank=True, help_text="Internal staff notes")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.business_name or self.user.full_name} ({self.user.email})"

class OTPTypeChoices(models.TextChoices):
    PHONE = "PHONE", "Phone SMS"
    EMAIL = "EMAIL", "Email"

class OTPVerification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    identifier = models.CharField(max_length=255, db_index=True, help_text="Phone number (E.164) or email address")
    otp_type = models.CharField(max_length=10, choices=OTPTypeChoices.choices, default=OTPTypeChoices.PHONE, db_index=True)
    otp_hash = models.CharField(max_length=255, help_text="Salted cryptographic hash of OTP")
    purpose = models.CharField(max_length=30, default="LOGIN")
    attempts = models.IntegerField(default=0)
    max_attempts = models.IntegerField(default=5)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    expires_at = models.DateTimeField(db_index=True)
    last_resend_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["identifier", "otp_type", "is_verified"]),
        ]

    def __str__(self):
        return f"{self.otp_type} OTP for {self.identifier} ({'Verified' if self.is_verified else 'Pending'})"

class Referral(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    referrer = models.ForeignKey(User, on_delete=models.CASCADE, related_name="referrals_made")
    referred_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="referred_by_entry", null=True, blank=True)
    referral_code = models.CharField(max_length=50, db_index=True)
    status = models.CharField(max_length=30, default="REGISTERED")  # REGISTERED, QUALIFIED, REWARDED
    reward_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("500.00"))
    created_at = models.DateTimeField(auto_now_add=True)
    rewarded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Referral {self.referral_code} by {self.referrer.email} ({self.status})"




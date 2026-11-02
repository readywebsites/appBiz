import os
from datetime import timedelta
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.getenv("SECRET_KEY", "biz499-dev-secret-key-default-not-for-production-123456789")
DEBUG = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")

ALLOWED_HOSTS = [h.strip() for h in os.getenv("ALLOWED_HOSTS", "*").split(",") if h.strip()]

# Application definition
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Third party
    "corsheaders",
    "rest_framework",
    "rest_framework_simplejwt",
    "drf_spectacular",

    # Biz499 Local Apps
    "apps.authentication.apps.AuthenticationConfig",
    "apps.services.apps.ServicesConfig",
    "apps.leads.apps.LeadsConfig",
    "apps.quotations.apps.QuotationsConfig",
    "apps.orders.apps.OrdersConfig",
    "apps.payments.apps.PaymentsConfig",
    "apps.invoices.apps.InvoicesConfig",
    "apps.projects.apps.ProjectsConfig",
    "apps.notifications.apps.NotificationsConfig",
    "apps.support.apps.SupportConfig",
    "apps.audit.apps.AuditConfig",
    "apps.analytics.apps.AnalyticsConfig",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

# Database Configuration
# Defaults to SQLite when DB_NAME is not set, otherwise PostgreSQL
DB_NAME = os.getenv("DB_NAME", "").strip()

if DB_NAME:
    DATABASES = {
        "default": {
            "ENGINE": os.getenv("DB_ENGINE", "django.db.backends.postgresql"),
            "NAME": DB_NAME,
            "USER": os.getenv("DB_USER", "postgres"),
            "PASSWORD": os.getenv("DB_PASSWORD", "postgres"),
            "HOST": os.getenv("DB_HOST", "localhost"),
            "PORT": os.getenv("DB_PORT", "5432"),
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

# Custom User Model
AUTH_USER_MODEL = "authentication.User"

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kolkata"
USE_I18N = True
USE_TZ = True

# Static & Media files
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# CORS
CORS_ALLOW_ALL_ORIGINS = os.getenv("CORS_ALLOW_ALL_ORIGINS", "True").lower() in ("true", "1")
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
    if origin.strip()
]
CORS_ALLOW_CREDENTIALS = True

# Django REST Framework
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "300/minute",
        "user": "600/minute",
        "auth": "30/minute",
        "auth_send": "15/minute",
        "auth_verify": "60/minute",
    },
}

# Simple JWT
ACCESS_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_LIFETIME_MINUTES", "60"))
REFRESH_DAYS = int(os.getenv("JWT_REFRESH_TOKEN_LIFETIME_DAYS", "14"))

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=ACCESS_MINUTES),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=REFRESH_DAYS),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": False,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
}

# DRF Spectacular (OpenAPI 3.0 / Swagger)
SPECTACULAR_SETTINGS = {
    "TITLE": "Biz499 API",
    "DESCRIPTION": (
        "Complete enterprise-grade API for Biz499 Digital Services: "
        "mobile customer marketplace, CRM lead generation, instant quotations, "
        "orders, Razorpay payments, automated invoicing, project delivery, and administration."
    ),
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
}

# Business & Payment Configuration
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_biz499sandboxkey")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "biz499sandboxsecretkey")
RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET", "biz499sandboxwebhooksecret")

COMPANY_NAME = os.getenv("COMPANY_NAME", "Biz499 Digital Services")
COMPANY_EMAIL = os.getenv("COMPANY_EMAIL", "support@biz499.com")
COMPANY_PHONE = os.getenv("COMPANY_PHONE", "+91 98765 43210")
COMPANY_GSTIN = os.getenv("COMPANY_GSTIN", "27ABCDE1234F1Z5")
COMPANY_ADDRESS = os.getenv("COMPANY_ADDRESS", "Biz499 Tech Park, High Street, Mumbai 400001")
TAX_PERCENTAGE = float(os.getenv("TAX_PERCENTAGE", "18.0"))
DEFAULT_CURRENCY = os.getenv("DEFAULT_CURRENCY", "INR")

# SMS & Verification Provider Settings
SMS_PROVIDER = os.getenv("SMS_PROVIDER", "DEV")  # "TWILIO" or "DEV"
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_VERIFY_SERVICE_SID = os.getenv("TWILIO_VERIFY_SERVICE_SID", "")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "")

# Email Delivery Configuration (SMTP with Google App Password support)
EMAIL_BACKEND = os.getenv(
    "EMAIL_BACKEND",
    "django.core.mail.backends.console.EmailBackend" if DEBUG else "django.core.mail.backends.smtp.EmailBackend",
)
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", "True").lower() in ("true", "1")
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "Biz499 Support <support@biz499.com>")

# OTP Challenge Security Settings
OTP_EXPIRY_MINUTES = int(os.getenv("OTP_EXPIRY_MINUTES", "5"))
OTP_RESEND_COOLDOWN_SECONDS = int(os.getenv("OTP_RESEND_COOLDOWN_SECONDS", "45"))
OTP_MAX_ATTEMPTS = int(os.getenv("OTP_MAX_ATTEMPTS", "5"))



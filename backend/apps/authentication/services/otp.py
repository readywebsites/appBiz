import secrets
import string
import logging
from datetime import timedelta
from django.utils import timezone
from django.conf import settings
from django.contrib.auth.hashers import make_password, check_password
from apps.authentication.models import OTPVerification, OTPTypeChoices

logger = logging.getLogger(__name__)

class OTPCooldownError(Exception):
    def __init__(self, remaining_seconds: int):
        self.remaining_seconds = remaining_seconds
        super().__init__(f"Please wait {remaining_seconds} seconds before requesting a new code.")

def generate_secure_otp(length: int = 6) -> str:
    """Generates a cryptographically strong numeric OTP."""
    digits = string.digits
    return "".join(secrets.choice(digits) for _ in range(length))

def create_otp_challenge(identifier: str, otp_type: str, purpose: str = "LOGIN") -> tuple[OTPVerification, str, int]:
    """
    Creates a new hashed OTP challenge.
    Enforces resend cooldowns and automatically invalidates prior pending challenges.
    Returns: (challenge, plain_otp, cooldown_seconds)
    NOTE: plain_otp must only be handed to provider dispatchers (SMS/Email), NEVER sent to client.
    """
    clean_identifier = identifier.strip().lower() if otp_type == OTPTypeChoices.EMAIL else identifier.strip().replace(" ", "")
    cooldown = getattr(settings, "OTP_RESEND_COOLDOWN_SECONDS", 45)
    expiry_minutes = getattr(settings, "OTP_EXPIRY_MINUTES", 5)
    max_attempts = getattr(settings, "OTP_MAX_ATTEMPTS", 5)

    now = timezone.now()

    # Check cooldown against recent challenges
    recent_active = OTPVerification.objects.filter(
        identifier=clean_identifier,
        otp_type=otp_type,
        is_verified=False,
        expires_at__gt=now,
    ).order_by("-created_at").first()

    if recent_active:
        elapsed = (now - recent_active.created_at).total_seconds()
        if elapsed < cooldown:
            remaining = int(cooldown - elapsed)
            raise OTPCooldownError(remaining_seconds=remaining)

    # Invalidate older active challenges for this identifier
    OTPVerification.objects.filter(
        identifier=clean_identifier,
        otp_type=otp_type,
        is_verified=False,
    ).update(is_verified=True)  # Invalidate to prevent replay/brute-force

    plain_otp = generate_secure_otp(6)
    hashed = make_password(plain_otp)
    expires_at = now + timedelta(minutes=expiry_minutes)

    challenge = OTPVerification.objects.create(
        identifier=clean_identifier,
        otp_type=otp_type,
        otp_hash=hashed,
        purpose=purpose,
        attempts=0,
        max_attempts=max_attempts,
        is_verified=False,
        expires_at=expires_at,
    )

    logger.info("Created %s OTP challenge for %s (id: %s)", otp_type, clean_identifier, challenge.id)
    return challenge, plain_otp, cooldown

def verify_otp_challenge(identifier: str, otp_type: str, otp: str) -> tuple[bool, str]:
    """
    Validates a submitted OTP against the active challenge.
    Increments attempt counters and enforces max limits.
    Returns: (success: bool, message: str)
    """
    clean_identifier = identifier.strip().lower() if otp_type == OTPTypeChoices.EMAIL else identifier.strip().replace(" ", "")
    clean_otp = otp.strip()
    now = timezone.now()

    challenge = OTPVerification.objects.filter(
        identifier=clean_identifier,
        otp_type=otp_type,
        is_verified=False,
    ).order_by("-created_at").first()

    if not challenge:
        return False, "No active verification code found. Please request a new code."

    if challenge.expires_at < now:
        return False, "Verification code has expired. Please request a new one."

    if challenge.attempts >= challenge.max_attempts:
        return False, "Maximum verification attempts exceeded. Please request a new code."

    # Increment attempts
    challenge.attempts += 1

    if check_password(clean_otp, challenge.otp_hash):
        challenge.is_verified = True
        challenge.save(update_fields=["attempts", "is_verified"])
        logger.info("Successfully verified %s OTP for %s", otp_type, clean_identifier)
        return True, "Code verified successfully."
    else:
        challenge.save(update_fields=["attempts"])
        remaining = max(0, challenge.max_attempts - challenge.attempts)
        if remaining == 0:
            return False, "Incorrect verification code. Maximum attempts reached. Please request a new code."
        return False, f"Incorrect verification code. {remaining} attempt{'s' if remaining > 1 else ''} remaining."


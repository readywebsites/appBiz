from rest_framework.throttling import AnonRateThrottle

class AuthSendRateThrottle(AnonRateThrottle):
    """
    Throttles OTP generation/dispatch to prevent SMS pumping or email flooding attacks.
    """
    scope = "auth_send"

class AuthVerifyRateThrottle(AnonRateThrottle):
    """
    Throttles OTP verification requests per IP to protect against automated brute-force attempts.
    Note: Individual OTP challenges also enforce an authoritative 5-attempt DB-level lockout.
    """
    scope = "auth_verify"


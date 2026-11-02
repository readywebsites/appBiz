from datetime import timedelta
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from apps.authentication.models import User, OTPVerification, OTPTypeChoices
from apps.authentication.services.otp import create_otp_challenge

class OTPAuthenticationSecurityTests(APITestCase):
    def setUp(self):
        self.phone = "+919876500001"
        self.email = "test.otp.client@example.com"
        self.password = "StrongPassword#2026"
        self.user = User.objects.create_user(
            email=self.email,
            password=self.password,
            first_name="OTP",
            last_name="Tester",
            phone=self.phone,
            is_verified=True,
        )

    def test_phone_send_otp_success_no_otp_leak(self):
        """Verify OTP can be requested and response does NOT leak the plain OTP."""
        response = self.client.post("/api/v1/auth/phone/send-otp/", {"phone": "+919876500002"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("message", response.data)
        self.assertIn("cooldown", response.data)
        self.assertNotIn("otp", response.data)
        self.assertNotIn("code", response.data)

        # Check DB challenge exists and is hashed
        challenge = OTPVerification.objects.filter(identifier="+919876500002").first()
        self.assertIsNotNone(challenge)
        self.assertTrue(challenge.otp_hash.startswith("pbkdf2_"))

    def test_phone_send_otp_invalid_phone_format(self):
        """Verify invalid phone numbers are rejected with 400 Bad Request."""
        invalid_phones = ["123", "abc", "+00000", "not-a-number"]
        for p in invalid_phones:
            res = self.client.post("/api/v1/auth/phone/send-otp/", {"phone": p})
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_phone_send_otp_cooldown_enforcement(self):
        """Verify rapid repeated OTP requests hit 429 Too Many Requests."""
        res1 = self.client.post("/api/v1/auth/phone/send-otp/", {"phone": "+919876500003"})
        self.assertEqual(res1.status_code, status.HTTP_200_OK)

        res2 = self.client.post("/api/v1/auth/phone/send-otp/", {"phone": "+919876500003"})
        self.assertEqual(res2.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertIn("cooldown", res2.data)

    def test_phone_verify_otp_incorrect_code_and_lockout(self):
        """Verify wrong code decrements remaining attempts and locks out at 5 attempts."""
        phone = "+919876500004"
        challenge, plain_otp, _ = create_otp_challenge(phone, OTPTypeChoices.PHONE)

        # Submit wrong OTP
        res = self.client.post("/api/v1/auth/phone/verify-otp/", {"phone": phone, "otp": "000000"})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("remaining", res.data["error"])

        # Exhaust attempts
        for _ in range(4):
            self.client.post("/api/v1/auth/phone/verify-otp/", {"phone": phone, "otp": "000000"})

        # 6th attempt should be locked out
        lockout_res = self.client.post("/api/v1/auth/phone/verify-otp/", {"phone": phone, "otp": plain_otp})
        self.assertEqual(lockout_res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Maximum", lockout_res.data["error"])

    def test_phone_verify_otp_expired_code(self):
        """Verify expired OTP challenges are rejected."""
        phone = "+919876500005"
        challenge, plain_otp, _ = create_otp_challenge(phone, OTPTypeChoices.PHONE)
        # Manually expire
        challenge.expires_at = timezone.now() - timedelta(minutes=1)
        challenge.save()

        res = self.client.post("/api/v1/auth/phone/verify-otp/", {"phone": phone, "otp": plain_otp})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("expired", res.data["error"].lower())

    def test_phone_verify_otp_success_existing_user(self):
        """Verify correct OTP logs in existing customer and returns JWT tokens."""
        challenge, plain_otp, _ = create_otp_challenge(self.phone, OTPTypeChoices.PHONE)
        res = self.client.post("/api/v1/auth/phone/verify-otp/", {"phone": self.phone, "otp": plain_otp})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("tokens", res.data)
        self.assertIn("access", res.data["tokens"])
        self.assertEqual(res.data["user"]["email"], self.email)

    def test_phone_verify_otp_success_new_user_registration(self):
        """Verify correct OTP for new phone creates account and profile."""
        new_phone = "+919876500006"
        challenge, plain_otp, _ = create_otp_challenge(new_phone, OTPTypeChoices.PHONE)
        res = self.client.post(
            "/api/v1/auth/phone/verify-otp/",
            {
                "phone": new_phone,
                "otp": plain_otp,
                "full_name": "Rohan Sharma",
                "business_name": "Sharma Exports",
            },
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res.data["is_new_user"])
        self.assertIn("tokens", res.data)

        # Verify user exists in DB
        created = User.objects.filter(phone=new_phone).first()
        self.assertIsNotNone(created)
        self.assertEqual(created.first_name, "Rohan")
        self.assertEqual(created.customer_profile.business_name, "Sharma Exports")

    def test_email_login_and_logout_flow(self):
        """Verify email/password login and logout."""
        # 1. Login with correct credentials
        res = self.client.post(
            "/api/v1/auth/email/login/",
            {"email": self.email, "password": self.password},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(res.data["requires_otp"])
        access_token = res.data["tokens"]["access"]
        refresh_token = res.data["tokens"]["refresh"]

        # 2. Access me endpoint
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        me_res = self.client.get("/api/v1/auth/me/")
        self.assertEqual(me_res.status_code, status.HTTP_200_OK)
        self.assertEqual(me_res.data["email"], self.email)

        # 3. Logout
        logout_res = self.client.post("/api/v1/auth/logout/", {"refresh": refresh_token})
        self.assertEqual(logout_res.status_code, status.HTTP_200_OK)


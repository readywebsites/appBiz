from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.authentication.models import User, RoleChoices

class AuthenticationTests(APITestCase):
    def setUp(self):
        self.register_url = reverse("auth-register")
        self.login_url = reverse("auth-login")
        self.me_url = reverse("auth-me")

    def test_customer_registration_success(self):
        payload = {
            "email": "newuser@test.com",
            "password": "SecurePassword123!",
            "first_name": "Test",
            "last_name": "Customer",
            "phone": "+919876500001",
            "business_name": "Test Ventures",
        }
        response = self.client.post(self.register_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("tokens", response.data)
        self.assertIn("access", response.data["tokens"])
        self.assertTrue(User.objects.filter(email="newuser@test.com").exists())
        user = User.objects.get(email="newuser@test.com")
        self.assertEqual(user.role, RoleChoices.CUSTOMER)
        self.assertTrue(hasattr(user, "customer_profile"))
        self.assertEqual(user.customer_profile.business_name, "Test Ventures")

    def test_login_success(self):
        User.objects.create_user(
            email="loginuser@test.com",
            password="CorrectPassword123!",
            role=RoleChoices.CUSTOMER,
            is_verified=True,
        )
        response = self.client.post(
            self.login_url,
            {"email": "loginuser@test.com", "password": "CorrectPassword123!"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("tokens", response.data)

    def test_login_invalid_password(self):
        User.objects.create_user(
            email="wrongpass@test.com",
            password="CorrectPassword123!",
        )
        response = self.client.post(
            self.login_url,
            {"email": "wrongpass@test.com", "password": "WrongPassword123!"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_me_endpoint_requires_auth(self):
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


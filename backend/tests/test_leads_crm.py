from decimal import Decimal
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.authentication.models import User, RoleChoices
from apps.leads.models import Lead, LeadStatusChoices, ConsultationRequest

class LeadsCRMTests(APITestCase):
    def setUp(self):
        self.sales_staff = User.objects.create_user(
            email="salesstaff@test.com",
            password="Password123!",
            role=RoleChoices.SALES_EXECUTIVE,
            is_staff=True,
        )
        self.submit_enquiry_url = reverse("lead-submit-enquiry")

    def test_public_enquiry_submission(self):
        payload = {
            "full_name": "Arun Kumar",
            "email": "arun@kumarconsulting.com",
            "phone": "+919988776655",
            "company_name": "Kumar Consulting",
            "requirements": "Need a multi-page business website with appointment booking",
            "estimated_budget": "15000.00",
            "campaign": "google_search_mumbai",
            "source": "Mobile App",
        }
        response = self.client.post(self.submit_enquiry_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("reference_id", response.data)
        self.assertTrue(Lead.objects.filter(email="arun@kumarconsulting.com").exists())

    def test_crm_staff_can_view_and_convert_lead(self):
        lead = Lead.objects.create(
            full_name="Pooja Batra",
            email="pooja@batrastyles.com",
            phone="+919877665544",
            company_name="Batra Styles",
            requirements="E-commerce boutique website",
            status=LeadStatusChoices.QUALIFIED,
        )

        self.client.force_authenticate(user=self.sales_staff)
        convert_url = reverse("leads-crm-convert-to-customer", kwargs={"pk": lead.id})
        response = self.client.post(convert_url, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        lead.refresh_from_db()
        self.assertEqual(lead.status, LeadStatusChoices.WON)
        self.assertIsNotNone(lead.converted_customer)
        self.assertEqual(lead.converted_customer.email, "pooja@batrastyles.com")


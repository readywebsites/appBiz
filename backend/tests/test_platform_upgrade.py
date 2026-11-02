from decimal import Decimal
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.authentication.models import User, RoleChoices, CustomerProfile, Referral
from apps.services.models import ServiceCategory, Service, ServicePackage
from apps.orders.models import Order, OrderStatusChoices, PaymentStatusChoices
from apps.projects.models import (
    Project,
    ProjectStatusChoices,
    ProjectRequirement,
    RequirementStatusChoices,
    RevisionRequest,
    ProjectDomainHosting,
    ProjectReview,
)
from apps.support.models import SupportTicket, TicketStatusChoices, TicketCategoryChoices, TicketPriorityChoices, SupportMessage

class PlatformUpgradeIntegrationTests(APITestCase):
    def setUp(self):
        # Create primary customer
        self.customer = User.objects.create_user(
            email="platform_client@biz499.com",
            password="SecurePassword123!",
            role=RoleChoices.CUSTOMER,
            first_name="Platform",
            last_name="Client",
        )
        self.profile, _ = CustomerProfile.objects.get_or_create(
            user=self.customer,
            defaults={"business_name": "Zenith Retail", "referral_code": "BIZ-ZENITH"},
        )
        self.profile.business_name = "Zenith Retail"
        self.profile.referral_code = "BIZ-ZENITH"
        self.profile.save()

        # Service catalog
        self.category = ServiceCategory.objects.create(name="E-Commerce", slug="e-commerce")
        self.service = Service.objects.create(
            category=self.category,
            title="E-Commerce Starter",
            slug="ecommerce-starter",
            starting_price=Decimal("499.00"),
        )
        self.package = ServicePackage.objects.create(
            service=self.service,
            name="Store Package",
            slug="store-pkg",
            price=Decimal("499.00"),
            delivery_days=3,
        )

        # Order & Project
        self.order = Order.objects.create(
            order_number="ORD-PLATFORM-99",
            customer=self.customer,
            status=OrderStatusChoices.IN_PROGRESS,
            payment_status=PaymentStatusChoices.PAID,
            subtotal=Decimal("499.00"),
            total_amount=Decimal("588.82"),
        )

        self.project = Project.objects.create(
            order=self.order,
            customer=self.customer,
            title="Zenith Retail Store",
            status=ProjectStatusChoices.AWAITING_REQUIREMENTS,
            staging_url="https://zenith-staging.biz499.site",
            progress_percentage=15,
        )

        # Authenticate client
        self.client.force_authenticate(user=self.customer)

    def test_project_requirements_flow(self):
        url = reverse("projects-requirements", kwargs={"pk": str(self.project.id)})

        # 1. GET requirements (creates blank if not existing)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], RequirementStatusChoices.PENDING)

        # 2. Save Draft
        draft_payload = {
            "business_name": "Zenith Retail LLC",
            "tagline": "Premium Quality at Affordable Prices",
            "about_business": "We sell quality handcrafted apparel.",
            "preferred_colors": "Deep Emerald, Gold, Charcoal",
            "action": "save",
        }
        draft_response = self.client.post(url, draft_payload, format="json")
        self.assertEqual(draft_response.status_code, status.HTTP_200_OK)
        self.assertEqual(draft_response.data["status"], RequirementStatusChoices.DRAFT)
        self.assertEqual(draft_response.data["business_name"], "Zenith Retail LLC")

        # 3. Final Submission
        submit_payload = {
            "business_name": "Zenith Retail LLC",
            "tagline": "Premium Quality at Affordable Prices",
            "about_business": "We sell quality handcrafted apparel.",
            "services_offered": "Online checkout, delivery, customer rewards",
            "target_audience": "Local customers and young professionals",
            "contact_email": "hello@zenithretail.com",
            "contact_phone": "+919876543210",
            "has_own_domain": False,
            "domain_name": "zenithretail.in",
            "action": "submit",
        }
        submit_response = self.client.post(url, submit_payload, format="json")
        self.assertEqual(submit_response.status_code, status.HTTP_200_OK)
        self.assertEqual(submit_response.data["status"], RequirementStatusChoices.SUBMITTED)

        # Project status should have transitioned to PLANNING
        self.project.refresh_from_db()
        self.assertEqual(self.project.status, ProjectStatusChoices.PLANNING)

    def test_revision_request_and_project_approval(self):
        # 1. Request Revision
        rev_url = reverse("projects-request-revision", kwargs={"pk": str(self.project.id)})
        rev_payload = {
            "title": "Update Header Font",
            "description": "Please make the header font bold and add the phone icon in navigation.",
        }
        rev_response = self.client.post(rev_url, rev_payload, format="json")
        self.assertEqual(rev_response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(RevisionRequest.objects.filter(project=self.project, title="Update Header Font").exists())

        self.project.refresh_from_db()
        self.assertEqual(self.project.status, ProjectStatusChoices.REVISIONS)

        # 2. Approve Project Final Sign-off
        approve_url = reverse("projects-approve", kwargs={"pk": str(self.project.id)})
        app_payload = {
            "comments": "The website looks spectacular! Ready for launch.",
        }
        app_response = self.client.post(approve_url, app_payload, format="json")
        self.assertEqual(app_response.status_code, status.HTTP_201_CREATED)

        self.project.refresh_from_db()
        self.assertEqual(self.project.status, ProjectStatusChoices.COMPLETED)
        self.assertEqual(self.project.progress_percentage, 100)
        self.assertIsNotNone(self.project.actual_delivery_date)

    def test_domain_hosting_management_and_renewal(self):
        url = reverse("projects-domain-hosting", kwargs={"pk": str(self.project.id)})

        # 1. GET domain hosting details (auto-initializes if not present)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("domain_name", response.data)
        self.assertEqual(response.data["ssl_status"], "ACTIVE")

        # 2. Request Renewal
        renew_response = self.client.post(url, {"action": "request_renewal"}, format="json")
        self.assertEqual(renew_response.status_code, status.HTTP_200_OK)
        self.assertIn("message", renew_response.data)

        # Verification in DB
        domain_hosting = ProjectDomainHosting.objects.get(project=self.project)
        self.assertEqual(domain_hosting.renewal_status, "RENEWAL_REQUESTED")

    def test_project_review_submission(self):
        url = reverse("projects-review", kwargs={"pk": str(self.project.id)})

        review_payload = {
            "rating": 5,
            "headline": "Outstanding Quality and Speed!",
            "feedback": "Biz499 delivered our complete store in 3 days. Highly recommend to all small businesses.",
            "testimonial_permission": True,
        }

        # 1. Eligibility Check: Reject review if project is still in early stage
        self.project.status = ProjectStatusChoices.AWAITING_REQUIREMENTS
        self.project.save()
        ineligible_res = self.client.post(url, review_payload, format="json")
        self.assertEqual(ineligible_res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("not eligible", ineligible_res.data["error"])

        # 2. Eligible stage: Project completed
        self.project.status = ProjectStatusChoices.COMPLETED
        self.project.save()
        response = self.client.post(url, review_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["rating"], 5)
        self.assertEqual(response.data["testimonial_permission"], True)

        # 3. Duplicate Prevention: Secondary submission without update flag is rejected
        dup_res = self.client.post(url, review_payload, format="json")
        self.assertEqual(dup_res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Duplicate reviews are not permitted", dup_res.data["error"])

        # 4. GET review verifies database persistence
        get_response = self.client.get(url)
        self.assertEqual(get_response.status_code, status.HTTP_200_OK)
        self.assertEqual(get_response.data["rating"], 5)
        self.assertTrue(ProjectReview.objects.filter(project=self.project, rating=5).exists())

        # 5. Ownership Verification: Other users cannot access or review this project
        other_user = User.objects.create_user(email="intruder@test.com", password="Password123!")
        self.client.force_authenticate(user=other_user)
        unauth_res = self.client.post(url, review_payload, format="json")
        self.assertEqual(unauth_res.status_code, status.HTTP_404_NOT_FOUND)

    def test_customer_referral_flow(self):
        # 1. Customer checks referrals
        ref_url = reverse("auth-referrals")
        response = self.client.get(ref_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["referral_code"], "BIZ-ZENITH")
        self.assertEqual(response.data["total_invited"], 0)

        # 2. Friend signs up using customer's code
        self.client.logout()
        reg_url = reverse("auth-register")
        friend_payload = {
            "email": "friend@biz499.com",
            "password": "SecurePassword123!",
            "first_name": "Friend",
            "last_name": "Referred",
            "phone": "+919876599999",
            "business_name": "Friend Enterprises",
            "referred_by": "BIZ-ZENITH",
        }
        reg_response = self.client.post(reg_url, friend_payload, format="json")
        self.assertEqual(reg_response.status_code, status.HTTP_201_CREATED)

        # 3. Check customer referrals stats updated - Registered but not yet rewarded (eligibility verification)
        self.client.force_authenticate(user=self.customer)
        response_after = self.client.get(ref_url)
        self.assertEqual(response_after.status_code, status.HTTP_200_OK)
        self.assertEqual(response_after.data["total_invited"], 1)
        self.assertEqual(response_after.data["successful_referrals"], 0)
        self.assertEqual(response_after.data["earned_rewards"], "0")
        self.assertEqual(len(response_after.data["history"]), 1)
        self.assertEqual(response_after.data["history"][0]["referred_user"], "Friend Referred")
        self.assertEqual(response_after.data["history"][0]["status"], "REGISTERED")

        # 4. Qualifying Action: Referred friend places a paid order >= ₹499
        from apps.payments.models import Payment, PaymentStatusChoices as PayStatus
        from apps.payments.services import PaymentGatewayService
        friend_user = User.objects.get(email="friend@biz499.com")
        friend_order = Order.objects.create(
            order_number="ORD-FRIEND-499",
            customer=friend_user,
            status=OrderStatusChoices.PENDING_PAYMENT,
            payment_status=PaymentStatusChoices.UNPAID,
            subtotal=Decimal("499.00"),
            total_amount=Decimal("588.82"),
            balance_due=Decimal("588.82"),
        )
        payment = Payment.objects.create(
            transaction_id="TXN-REF-001",
            order=friend_order,
            customer=friend_user,
            amount=Decimal("588.82"),
            status=PayStatus.INITIATED,
            gateway_order_id="order_test_ref_001",
        )
        PaymentGatewayService.reconcile_successful_payment(
            payment=payment,
            gateway_payment_id="pay_test_ref_001",
            gateway_signature="sig_test_ref_001",
        )

        # 5. Check customer referrals stats - Now rewarded with ₹500
        ref_entry = Referral.objects.get(referred_user=friend_user)
        self.assertEqual(ref_entry.status, "REWARDED")
        self.assertIsNotNone(ref_entry.rewarded_at)

        response_rewarded = self.client.get(ref_url)
        self.assertEqual(response_rewarded.status_code, status.HTTP_200_OK)
        self.assertEqual(response_rewarded.data["successful_referrals"], 1)
        self.assertEqual(response_rewarded.data["earned_rewards"], "500.00")

    def test_my_services_endpoint(self):
        url = reverse("my-services")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "Zenith Retail Store")

    def test_support_ticket_close_and_reopen(self):
        # Create ticket
        ticket = SupportTicket.objects.create(
            customer=self.customer,
            ticket_number="TCK-99001",
            category=TicketCategoryChoices.TECHNICAL,
            priority=TicketPriorityChoices.HIGH,
            subject="SSL Certificate Renewal Inquiry",
            status=TicketStatusChoices.OPEN,
        )
        SupportMessage.objects.create(
            ticket=ticket,
            sender=self.customer,
            message="Is SSL automatically renewed on my store package?",
        )

        close_url = reverse("support-tickets-close", kwargs={"pk": str(ticket.id)})
        reopen_url = reverse("support-tickets-reopen", kwargs={"pk": str(ticket.id)})

        # Close ticket
        close_res = self.client.post(close_url)
        self.assertEqual(close_res.status_code, status.HTTP_200_OK)
        ticket.refresh_from_db()
        self.assertEqual(ticket.status, TicketStatusChoices.CLOSED)

        # Reopen ticket
        reopen_res = self.client.post(reopen_url)
        self.assertEqual(reopen_res.status_code, status.HTTP_200_OK)
        ticket.refresh_from_db()
        self.assertEqual(ticket.status, TicketStatusChoices.IN_PROGRESS)

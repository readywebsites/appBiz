from decimal import Decimal
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.authentication.models import User, RoleChoices
from apps.services.models import ServiceCategory, Service, ServicePackage
from apps.orders.models import Order, Coupon, DiscountTypeChoices, OrderStatusChoices, PaymentStatusChoices
from apps.payments.models import Payment, PaymentStatusChoices as PayStatus
from apps.invoices.models import Invoice
from apps.projects.models import Project

class OrderAndPaymentTests(APITestCase):
    def setUp(self):
        self.customer = User.objects.create_user(
            email="cust@test.com",
            password="Password123!",
            role=RoleChoices.CUSTOMER,
            first_name="Customer",
            last_name="One",
        )
        self.category = ServiceCategory.objects.create(name="Web Dev", slug="web-dev")
        self.service = Service.objects.create(
            category=self.category,
            title="Business Website",
            slug="business-website",
            short_description="Quality website",
            starting_price=Decimal("499.00"),
        )
        self.package = ServicePackage.objects.create(
            service=self.service,
            name="Starter",
            slug="starter",
            price=Decimal("499.00"),
            delivery_days=3,
        )
        self.coupon = Coupon.objects.create(
            code="SAVE100",
            discount_type=DiscountTypeChoices.FIXED,
            discount_value=Decimal("100.00"),
            min_order_value=Decimal("400.00"),
            max_uses=10,
        )
        self.client.force_authenticate(user=self.customer)

    def test_direct_checkout_authoritative_calculation(self):
        url = reverse("orders-checkout")
        payload = {
            "package_id": str(self.package.id),
            "coupon_code": "SAVE100",
            "notes": "Fast delivery requested",
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        order_id = response.data["id"]
        order = Order.objects.get(id=order_id)
        self.assertEqual(order.subtotal, Decimal("499.00"))
        self.assertEqual(order.discount_amount, Decimal("100.00"))
        # Taxable: 399.00 * 18% = 71.82 -> Total: 470.82
        self.assertEqual(order.tax_amount, Decimal("71.82"))
        self.assertEqual(order.total_amount, Decimal("470.82"))
        self.assertEqual(order.balance_due, Decimal("470.82"))

    def test_payment_initiation_and_verification(self):
        # Create an order
        order = Order.objects.create(
            order_number="ORD-TEST-01",
            customer=self.customer,
            status=OrderStatusChoices.PENDING_PAYMENT,
            payment_status=PaymentStatusChoices.UNPAID,
            subtotal=Decimal("499.00"),
            tax_amount=Decimal("89.82"),
            total_amount=Decimal("588.82"),
            balance_due=Decimal("588.82"),
        )

        initiate_url = reverse("payments-initiate")
        response = self.client.post(initiate_url, {"order_id": str(order.id), "is_advance": False}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        gateway_order_id = response.data["gateway_order_id"]

        # Verify payment with server-side signature check
        verify_url = reverse("payments-verify")
        verify_payload = {
            "gateway_order_id": gateway_order_id,
            "gateway_payment_id": "pay_test_001",
            "gateway_signature": "test_signature",
        }
        verify_resp = self.client.post(verify_url, verify_payload, format="json")
        self.assertEqual(verify_resp.status_code, status.HTTP_200_OK)

        order.refresh_from_db()
        self.assertEqual(order.status, OrderStatusChoices.CONFIRMED)
        self.assertEqual(order.payment_status, PaymentStatusChoices.PAID)
        self.assertEqual(order.amount_paid, Decimal("588.82"))

        # Check invoice and project were auto-generated
        self.assertTrue(Invoice.objects.filter(order=order).exists())
        self.assertTrue(Project.objects.filter(order=order).exists())


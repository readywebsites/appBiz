from decimal import Decimal
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.authentication.models import User, RoleChoices
from apps.orders.models import Order
from apps.invoices.models import Invoice, InvoiceItem

class InvoicesAndPDFTests(APITestCase):
    def setUp(self):
        self.customer = User.objects.create_user(
            email="invoiceuser@test.com",
            password="Password123!",
            role=RoleChoices.CUSTOMER,
            first_name="Anita",
            last_name="Roy",
        )
        self.other_customer = User.objects.create_user(
            email="otheruser@test.com",
            password="Password123!",
            role=RoleChoices.CUSTOMER,
        )
        self.order = Order.objects.create(
            order_number="ORD-INV-001",
            customer=self.customer,
            subtotal=Decimal("499.00"),
            tax_amount=Decimal("89.82"),
            total_amount=Decimal("588.82"),
        )
        self.invoice = Invoice.objects.create(
            invoice_number=Invoice.generate_next_number(),
            order=self.order,
            customer=self.customer,
            subtotal=Decimal("499.00"),
            tax_amount=Decimal("89.82"),
            total_amount=Decimal("588.82"),
            recipient_name=self.customer.full_name,
            recipient_email=self.customer.email,
        )
        InvoiceItem.objects.create(
            invoice=self.invoice,
            description="Starter Website Development",
            quantity=1,
            unit_price=Decimal("499.00"),
            total_price=Decimal("499.00"),
        )

    def test_invoice_pdf_download(self):
        self.client.force_authenticate(user=self.customer)
        url = reverse("invoices-pdf", kwargs={"pk": self.invoice.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertGreater(len(response.content), 500)

    def test_customer_cannot_access_others_invoice(self):
        self.client.force_authenticate(user=self.other_customer)
        url = reverse("invoices-detail", kwargs={"pk": self.invoice.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


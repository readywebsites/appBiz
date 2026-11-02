import uuid
from decimal import Decimal
from django.db import models, transaction
from django.conf import settings
from django.utils import timezone
from apps.orders.models import Order
from apps.payments.models import Payment

class InvoiceStatusChoices(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    ISSUED = "ISSUED", "Issued"
    PARTIALLY_PAID = "PARTIALLY_PAID", "Partially Paid"
    PAID = "PAID", "Paid"
    CANCELLED = "CANCELLED", "Cancelled"

class Invoice(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice_number = models.CharField(max_length=50, unique=True, db_index=True)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="invoices")
    payment = models.ForeignKey(Payment, on_delete=models.SET_NULL, null=True, blank=True, related_name="invoices")
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="invoices")

    status = models.CharField(
        max_length=20,
        choices=InvoiceStatusChoices.choices,
        default=InvoiceStatusChoices.ISSUED,
        db_index=True,
    )
    issue_date = models.DateField(default=timezone.now)
    due_date = models.DateField(null=True, blank=True)

    currency = models.CharField(max_length=10, default="INR")
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    tax_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("18.00"))
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    balance_due = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))

    # Recipient billing details snapshot
    recipient_name = models.CharField(max_length=150)
    recipient_email = models.EmailField()
    recipient_phone = models.CharField(max_length=20, blank=True)
    business_name = models.CharField(max_length=150, blank=True)
    billing_address = models.TextField(blank=True)
    gstin = models.CharField(max_length=25, blank=True)

    pdf_file = models.FileField(upload_to="invoices/%Y/%m/", null=True, blank=True)
    notes = models.TextField(blank=True)
    terms = models.TextField(blank=True, default="Thank you for choosing Biz499 Digital Services.")

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-issue_date", "-created_at"]

    @classmethod
    def generate_next_number(cls):
        """Generates a collision-safe sequential invoice number e.g. INV-2026-0001"""
        with transaction.atomic():
            year = timezone.now().year
            prefix = f"INV-{year}-"
            last_inv = cls.objects.filter(invoice_number__startswith=prefix).order_by("-invoice_number").first()
            if last_inv:
                try:
                    num_part = int(last_inv.invoice_number.split("-")[-1])
                    next_num = num_part + 1
                except (ValueError, IndexError):
                    next_num = 1
            else:
                next_num = 1
            return f"{prefix}{next_num:04d}"

    def __str__(self):
        return f"{self.invoice_number} - {self.recipient_name} ({self.status}) INR {self.total_amount}"

class InvoiceItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="items")
    description = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)

    def save(self, *args, **kwargs):
        self.total_price = self.unit_price * self.quantity
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.description} ({self.quantity} x {self.unit_price})"

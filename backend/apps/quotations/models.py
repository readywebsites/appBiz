import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.utils import timezone
from apps.leads.models import Lead

class QuoteStatusChoices(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    SENT = "SENT", "Sent to Customer"
    ACCEPTED = "ACCEPTED", "Accepted by Customer"
    REJECTED = "REJECTED", "Rejected by Customer"
    EXPIRED = "EXPIRED", "Expired"
    CONVERTED = "CONVERTED", "Converted to Order"

class Quote(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    quote_number = models.CharField(max_length=30, unique=True, db_index=True)
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="quotes",
    )
    lead = models.ForeignKey(
        Lead,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="quotes",
    )
    recipient_name = models.CharField(max_length=150)
    recipient_email = models.EmailField(db_index=True)
    recipient_phone = models.CharField(max_length=20, blank=True)
    company_name = models.CharField(max_length=150, blank=True)

    status = models.CharField(
        max_length=20,
        choices=QuoteStatusChoices.choices,
        default=QuoteStatusChoices.DRAFT,
        db_index=True,
    )

    currency = models.CharField(max_length=10, default="INR")
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    tax_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("18.00"))
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))

    valid_until = models.DateField(null=True, blank=True)
    terms = models.TextField(blank=True, default="1. 50% advance to initiate work.\n2. Delivery as per milestone timeline.\n3. Quote valid for 15 days.")
    notes = models.TextField(blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="authored_quotes",
    )

    accepted_at = models.DateTimeField(null=True, blank=True)
    rejected_at = models.DateTimeField(null=True, blank=True)
    converted_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def recalculate(self):
        """Authoritative calculation of subtotal, tax, and total from items"""
        items = self.items.all()
        sub = sum((item.unit_price * item.quantity for item in items), Decimal("0.00"))
        self.subtotal = sub
        taxable = max(sub - self.discount_amount, Decimal("0.00"))
        self.tax_amount = round((taxable * self.tax_percentage) / Decimal("100.00"), 2)
        self.total_amount = taxable + self.tax_amount
        self.save()

    def __str__(self):
        return f"{self.quote_number} - {self.recipient_name} ({self.status}) INR {self.total_amount}"

class QuoteItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    quote = models.ForeignKey(Quote, on_delete=models.CASCADE, related_name="items")
    description = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)

    def save(self, *args, **kwargs):
        self.total_price = self.unit_price * self.quantity
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.description} ({self.quantity} x {self.unit_price})"

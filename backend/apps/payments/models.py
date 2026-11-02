import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from apps.orders.models import Order

class GatewayChoices(models.TextChoices):
    RAZORPAY = "RAZORPAY", "Razorpay"
    STRIPE = "STRIPE", "Stripe"
    BANK_TRANSFER = "BANK_TRANSFER", "Direct Bank Transfer"
    MANUAL = "MANUAL", "Manual Receipt"

class PaymentStatusChoices(models.TextChoices):
    INITIATED = "INITIATED", "Initiated"
    CAPTURED = "CAPTURED", "Captured (Success)"
    FAILED = "FAILED", "Failed"
    REFUNDED = "REFUNDED", "Refunded"

class Payment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction_id = models.CharField(max_length=50, unique=True, db_index=True)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="payments")
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="payments")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=10, default="INR")
    status = models.CharField(
        max_length=20,
        choices=PaymentStatusChoices.choices,
        default=PaymentStatusChoices.INITIATED,
        db_index=True,
    )
    gateway = models.CharField(max_length=30, choices=GatewayChoices.choices, default=GatewayChoices.RAZORPAY)
    gateway_order_id = models.CharField(max_length=100, blank=True, db_index=True)
    gateway_payment_id = models.CharField(max_length=100, blank=True, db_index=True)
    gateway_signature = models.CharField(max_length=255, blank=True)
    is_advance = models.BooleanField(default=False)
    error_message = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.transaction_id} - {self.order.order_number}: INR {self.amount} ({self.status})"

class PaymentEvent(models.Model):
    """Stores incoming webhook events for idempotency and audit logs"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event_id = models.CharField(max_length=150, unique=True, db_index=True)
    gateway = models.CharField(max_length=30, default="RAZORPAY")
    event_type = models.CharField(max_length=100, db_index=True)
    payload = models.JSONField(default=dict)
    processed = models.BooleanField(default=False)
    error_log = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.event_id} ({self.event_type}) - {'Processed' if self.processed else 'Pending'}"

class RefundStatusChoices(models.TextChoices):
    PENDING = "PENDING", "Pending"
    PROCESSED = "PROCESSED", "Processed"
    FAILED = "FAILED", "Failed"

class Refund(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    refund_reference = models.CharField(max_length=50, unique=True, db_index=True)
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name="refunds")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    reason = models.TextField()
    gateway_refund_id = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=RefundStatusChoices.choices, default=RefundStatusChoices.PENDING)
    processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="processed_refunds",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Refund {self.refund_reference} for {self.payment.transaction_id} (INR {self.amount})"

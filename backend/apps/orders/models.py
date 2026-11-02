import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from apps.services.models import ServicePackage
from apps.quotations.models import Quote

class OrderStatusChoices(models.TextChoices):
    PENDING_PAYMENT = "PENDING_PAYMENT", "Pending Payment"
    CONFIRMED = "CONFIRMED", "Confirmed"
    IN_PROGRESS = "IN_PROGRESS", "In Progress"
    COMPLETED = "COMPLETED", "Completed"
    CANCELLED = "CANCELLED", "Cancelled"
    REFUNDED = "REFUNDED", "Refunded"

class PaymentStatusChoices(models.TextChoices):
    UNPAID = "UNPAID", "Unpaid"
    PARTIAL = "PARTIAL", "Partially Paid (Advance)"
    PAID = "PAID", "Fully Paid"
    REFUNDED = "REFUNDED", "Refunded"

class DiscountTypeChoices(models.TextChoices):
    PERCENTAGE = "PERCENTAGE", "Percentage Discount"
    FIXED = "FIXED", "Fixed Amount"

class Coupon(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=30, unique=True, db_index=True)
    description = models.CharField(max_length=200, blank=True)
    discount_type = models.CharField(max_length=20, choices=DiscountTypeChoices.choices, default=DiscountTypeChoices.PERCENTAGE)
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)
    min_order_value = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    max_discount_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    valid_from = models.DateTimeField(null=True, blank=True)
    valid_to = models.DateTimeField(null=True, blank=True)
    max_uses = models.PositiveIntegerField(default=100)
    current_uses = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def calculate_discount(self, subtotal: Decimal) -> Decimal:
        if not self.is_active or subtotal < self.min_order_value:
            return Decimal("0.00")
        if self.discount_type == DiscountTypeChoices.PERCENTAGE:
            disc = (subtotal * self.discount_value) / Decimal("100.00")
        else:
            disc = self.discount_value
        if self.max_discount_amount and disc > self.max_discount_amount:
            disc = self.max_discount_amount
        return min(round(disc, 2), subtotal)

    def __str__(self):
        return f"{self.code} ({self.discount_value}{'%' if self.discount_type == DiscountTypeChoices.PERCENTAGE else ' INR'})"

class Order(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_number = models.CharField(max_length=30, unique=True, db_index=True)
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="orders",
        db_index=True,
    )
    quote = models.OneToOneField(
        Quote,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="generated_order",
    )
    status = models.CharField(
        max_length=30,
        choices=OrderStatusChoices.choices,
        default=OrderStatusChoices.PENDING_PAYMENT,
        db_index=True,
    )
    payment_status = models.CharField(
        max_length=30,
        choices=PaymentStatusChoices.choices,
        default=PaymentStatusChoices.UNPAID,
        db_index=True,
    )

    currency = models.CharField(max_length=10, default="INR")
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    coupon = models.ForeignKey(Coupon, on_delete=models.SET_NULL, null=True, blank=True, related_name="orders")
    tax_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("18.00"))
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    balance_due = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))

    advance_required_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("50.00"))
    notes = models.TextField(blank=True)
    cancellation_reason = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def recalculate(self):
        items = self.items.all()
        sub = sum((item.unit_price * item.quantity for item in items), Decimal("0.00"))
        self.subtotal = sub
        taxable = max(sub - self.discount_amount, Decimal("0.00"))
        self.tax_amount = round((taxable * self.tax_percentage) / Decimal("100.00"), 2)
        self.total_amount = taxable + self.tax_amount
        self.balance_due = max(self.total_amount - self.amount_paid, Decimal("0.00"))
        self.save()

    @property
    def minimum_advance_amount(self) -> Decimal:
        return round((self.total_amount * self.advance_required_percentage) / Decimal("100.00"), 2)

    def __str__(self):
        return f"{self.order_number} - {self.customer.full_name} ({self.status}) INR {self.total_amount}"

class OrderItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    package = models.ForeignKey(ServicePackage, on_delete=models.SET_NULL, null=True, blank=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)

    def save(self, *args, **kwargs):
        self.total_price = self.unit_price * self.quantity
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} ({self.quantity} x INR {self.unit_price})"

class CouponRedemption(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    coupon = models.ForeignKey(Coupon, on_delete=models.CASCADE, related_name="redemptions")
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="coupon_redemptions")
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    discount_applied = models.DecimalField(max_digits=12, decimal_places=2)
    redeemed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.coupon.code} applied to {self.order.order_number} by {self.customer.email}"

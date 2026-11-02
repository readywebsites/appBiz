import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from apps.services.models import Service, ServicePackage

class LeadStatusChoices(models.TextChoices):
    NEW = "NEW", "New"
    CONTACTED = "CONTACTED", "Contacted"
    QUALIFIED = "QUALIFIED", "Qualified"
    QUOTE_SENT = "QUOTE_SENT", "Quotation Sent"
    NEGOTIATION = "NEGOTIATION", "Negotiation"
    WON = "WON", "Won (Converted)"
    LOST = "LOST", "Lost"

class LeadPriorityChoices(models.TextChoices):
    LOW = "LOW", "Low"
    MEDIUM = "MEDIUM", "Medium"
    HIGH = "HIGH", "High"
    URGENT = "URGENT", "Urgent"

class Lead(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reference_id = models.CharField(max_length=30, unique=True, editable=False, db_index=True)
    full_name = models.CharField(max_length=150)
    email = models.EmailField(db_index=True)
    phone = models.CharField(max_length=20, db_index=True)
    company_name = models.CharField(max_length=150, blank=True)
    requirements = models.TextField()
    estimated_budget = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=10, default="INR")
    service_interest = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True, blank=True, related_name="leads")
    package_interest = models.ForeignKey(ServicePackage, on_delete=models.SET_NULL, null=True, blank=True, related_name="leads")

    status = models.CharField(max_length=30, choices=LeadStatusChoices.choices, default=LeadStatusChoices.NEW, db_index=True)
    priority = models.CharField(max_length=20, choices=LeadPriorityChoices.choices, default=LeadPriorityChoices.MEDIUM, db_index=True)

    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_leads",
    )

    # Attribution & Tracking
    campaign = models.CharField(max_length=100, blank=True)
    source = models.CharField(max_length=100, default="Mobile App", db_index=True)
    medium = models.CharField(max_length=100, blank=True)
    referral_code = models.CharField(max_length=50, blank=True)

    next_follow_up_date = models.DateTimeField(null=True, blank=True, db_index=True)
    notes = models.TextField(blank=True)
    lost_reason = models.CharField(max_length=255, blank=True)

    # Customer conversion linkage
    converted_customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="origin_leads",
    )
    converted_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Lead"
        verbose_name_plural = "Leads"
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.reference_id:
            import random
            import string
            rand = "".join(random.choices(string.digits, k=5))
            self.reference_id = f"LD-{rand}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.reference_id} - {self.full_name} ({self.status})"

class ActivityTypeChoices(models.TextChoices):
    CALL = "CALL", "Phone Call"
    WHATSAPP = "WHATSAPP", "WhatsApp Message"
    EMAIL = "EMAIL", "Email Sent"
    MEETING = "MEETING", "Meeting/Demo"
    NOTE = "NOTE", "Internal Note"
    STATUS_CHANGE = "STATUS_CHANGE", "Status Update"

class LeadActivity(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name="activities")
    activity_type = models.CharField(max_length=30, choices=ActivityTypeChoices.choices, default=ActivityTypeChoices.NOTE)
    summary = models.CharField(max_length=255)
    details = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.lead.reference_id} - {self.activity_type}: {self.summary}"

class ConsultationStatusChoices(models.TextChoices):
    PENDING = "PENDING", "Pending"
    CONFIRMED = "CONFIRMED", "Confirmed"
    COMPLETED = "COMPLETED", "Completed"
    CANCELLED = "CANCELLED", "Cancelled"

class ConsultationRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    company_name = models.CharField(max_length=150, blank=True)
    preferred_date = models.DateField()
    preferred_time_slot = models.CharField(max_length=50, default="11:00 AM - 12:00 PM")
    topic = models.CharField(max_length=200, default="Website Strategy & Package Consultation")
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=30, choices=ConsultationStatusChoices.choices, default=ConsultationStatusChoices.PENDING)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="consultations",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-preferred_date", "-created_at"]

    def __str__(self):
        return f"Consultation: {self.name} on {self.preferred_date} ({self.status})"


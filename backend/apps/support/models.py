import uuid
from django.db import models
from django.conf import settings
from apps.orders.models import Order
from apps.projects.models import Project

class TicketCategoryChoices(models.TextChoices):
    BILLING = "BILLING", "Billing & Payments"
    PROJECT = "PROJECT", "Project Delivery & Scope"
    TECHNICAL = "TECHNICAL", "Technical Issue & Bug"
    SALES = "SALES", "Sales & Upgrade"
    GENERAL = "GENERAL", "General Enquiry"

class TicketPriorityChoices(models.TextChoices):
    LOW = "LOW", "Low"
    MEDIUM = "MEDIUM", "Medium"
    HIGH = "HIGH", "High"
    URGENT = "URGENT", "Urgent"

class TicketStatusChoices(models.TextChoices):
    OPEN = "OPEN", "Open"
    IN_PROGRESS = "IN_PROGRESS", "In Progress"
    WAITING_CUSTOMER = "WAITING_CUSTOMER", "Waiting on Customer"
    RESOLVED = "RESOLVED", "Resolved"
    CLOSED = "CLOSED", "Closed"

class SupportTicket(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket_number = models.CharField(max_length=30, unique=True, editable=False, db_index=True)
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="support_tickets")
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True, blank=True, related_name="support_tickets")
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True, related_name="support_tickets")

    subject = models.CharField(max_length=200)
    category = models.CharField(max_length=30, choices=TicketCategoryChoices.choices, default=TicketCategoryChoices.GENERAL)
    priority = models.CharField(max_length=20, choices=TicketPriorityChoices.choices, default=TicketPriorityChoices.MEDIUM)
    status = models.CharField(max_length=30, choices=TicketStatusChoices.choices, default=TicketStatusChoices.OPEN, db_index=True)

    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_tickets",
    )

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.ticket_number:
            import random
            import string
            rand = "".join(random.choices(string.digits, k=5))
            self.ticket_number = f"TCK-{rand}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.ticket_number} - {self.subject} ({self.status})"

class SupportMessage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    message = models.TextField()
    is_staff_reply = models.BooleanField(default=False)
    attachment_url = models.URLField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Message by {self.sender.email} on {self.ticket.ticket_number}"


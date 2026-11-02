import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone

class NotificationTypeChoices(models.TextChoices):
    ORDER = "ORDER", "Order Update"
    PAYMENT = "PAYMENT", "Payment Confirmation"
    PROJECT = "PROJECT", "Project Progress"
    QUOTE = "QUOTE", "Quotation Alert"
    SUPPORT = "SUPPORT", "Support Response"
    PROMOTION = "PROMOTION", "Special Offer"
    SYSTEM = "SYSTEM", "System Notice"

class Notification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    title = models.CharField(max_length=200)
    body = models.TextField()
    notification_type = models.CharField(
        max_length=20,
        choices=NotificationTypeChoices.choices,
        default=NotificationTypeChoices.SYSTEM,
        db_index=True,
    )
    data = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False, db_index=True)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]

    def mark_as_read(self):
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=["is_read", "read_at"])

    def __str__(self):
        return f"{self.user.email} - {self.title} ({'Read' if self.is_read else 'Unread'})"

class PlatformChoices(models.TextChoices):
    ANDROID = "ANDROID", "Android"
    IOS = "IOS", "iOS"
    WEB = "WEB", "Web"

class DeviceRegistration(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="devices")
    push_token = models.CharField(max_length=255, unique=True)
    platform = models.CharField(max_length=20, choices=PlatformChoices.choices, default=PlatformChoices.ANDROID)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email} - {self.platform} ({self.push_token[:15]}...)"


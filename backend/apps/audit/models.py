import uuid
from django.db import models
from django.conf import settings

class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    action = models.CharField(max_length=80, db_index=True)
    target_model = models.CharField(max_length=60, db_index=True)
    target_id = models.CharField(max_length=60, db_index=True)
    change_summary = models.TextField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=255, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        actor_email = self.actor.email if self.actor else "System"
        return f"{self.timestamp} - {actor_email}: {self.action} on {self.target_model}:{self.target_id}"


from rest_framework import serializers
from .models import AuditLog

class AuditLogSerializer(serializers.ModelSerializer):
    actor_email = serializers.CharField(source="actor.email", read_only=True, default="System")
    actor_role = serializers.CharField(source="actor.role", read_only=True, default="N/A")

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "actor",
            "actor_email",
            "actor_role",
            "action",
            "target_model",
            "target_id",
            "change_summary",
            "ip_address",
            "user_agent",
            "timestamp",
        ]
        read_only_fields = fields


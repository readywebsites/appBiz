from rest_framework import serializers
from .models import Notification, DeviceRegistration

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "title", "body", "notification_type", "data", "is_read", "read_at", "created_at"]
        read_only_fields = ["id", "created_at"]

class DeviceRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceRegistration
        fields = ["id", "push_token", "platform", "is_active", "created_at"]
        read_only_fields = ["id", "created_at"]


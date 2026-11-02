from rest_framework import serializers
from .models import SupportTicket, SupportMessage

class SupportMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.full_name", read_only=True)

    class Meta:
        model = SupportMessage
        fields = ["id", "ticket", "sender", "sender_name", "message", "is_staff_reply", "attachment_url", "created_at"]
        read_only_fields = ["id", "ticket", "sender", "sender_name", "is_staff_reply", "created_at"]

class SupportTicketSerializer(serializers.ModelSerializer):
    messages = SupportMessageSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source="customer.full_name", read_only=True)
    assigned_to_name = serializers.CharField(source="assigned_to.full_name", read_only=True)

    class Meta:
        model = SupportTicket
        fields = [
            "id",
            "ticket_number",
            "customer",
            "customer_name",
            "project",
            "order",
            "subject",
            "category",
            "priority",
            "status",
            "assigned_to",
            "assigned_to_name",
            "created_at",
            "updated_at",
            "messages",
        ]
        read_only_fields = ["id", "ticket_number", "customer", "customer_name", "created_at", "updated_at"]

class SupportTicketCreateSerializer(serializers.ModelSerializer):
    initial_message = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = SupportTicket
        fields = ["project", "order", "subject", "category", "priority", "initial_message"]

    def create(self, validated_data):
        initial_message = validated_data.pop("initial_message")
        ticket = SupportTicket.objects.create(
            customer=self.context["request"].user,
            **validated_data
        )
        SupportMessage.objects.create(
            ticket=ticket,
            sender=self.context["request"].user,
            message=initial_message,
            is_staff_reply=False,
        )
        return ticket


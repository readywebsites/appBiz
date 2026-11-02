from decimal import Decimal
from rest_framework import serializers
from .models import Payment, Refund, PaymentStatusChoices
from apps.orders.models import Order

class PaymentSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source="order.order_number", read_only=True)
    customer_name = serializers.CharField(source="customer.full_name", read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id",
            "transaction_id",
            "order",
            "order_number",
            "customer",
            "customer_name",
            "amount",
            "currency",
            "status",
            "gateway",
            "gateway_order_id",
            "gateway_payment_id",
            "is_advance",
            "error_message",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

class InitiatePaymentInputSerializer(serializers.Serializer):
    order_id = serializers.PrimaryKeyRelatedField(queryset=Order.objects.all())
    is_advance = serializers.BooleanField(default=False)
    custom_amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, min_value=Decimal("1.00"))

class VerifyPaymentInputSerializer(serializers.Serializer):
    gateway_order_id = serializers.CharField(max_length=100)
    gateway_payment_id = serializers.CharField(max_length=100)
    gateway_signature = serializers.CharField(max_length=255)

class RefundSerializer(serializers.ModelSerializer):
    class Meta:
        model = Refund
        fields = [
            "id",
            "refund_reference",
            "payment",
            "amount",
            "reason",
            "gateway_refund_id",
            "status",
            "created_at",
        ]
        read_only_fields = ["id", "refund_reference", "status", "created_at"]


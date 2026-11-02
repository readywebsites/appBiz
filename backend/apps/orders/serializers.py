from decimal import Decimal
from rest_framework import serializers
from .models import Order, OrderItem, Coupon, CouponRedemption, OrderStatusChoices, PaymentStatusChoices
from apps.services.models import ServicePackage, PackageAddOn

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ["id", "title", "description", "quantity", "unit_price", "total_price"]

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source="customer.full_name", read_only=True)
    customer_email = serializers.CharField(source="customer.email", read_only=True)
    quote_number = serializers.CharField(source="quote.quote_number", read_only=True, default=None)
    has_project = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "customer",
            "customer_name",
            "customer_email",
            "quote",
            "quote_number",
            "status",
            "payment_status",
            "currency",
            "subtotal",
            "discount_amount",
            "coupon",
            "tax_percentage",
            "tax_amount",
            "total_amount",
            "amount_paid",
            "balance_due",
            "advance_required_percentage",
            "notes",
            "cancellation_reason",
            "has_project",
            "created_at",
            "updated_at",
            "items",
        ]
        read_only_fields = [
            "id",
            "order_number",
            "status",
            "payment_status",
            "subtotal",
            "discount_amount",
            "tax_amount",
            "total_amount",
            "amount_paid",
            "balance_due",
            "created_at",
            "updated_at",
        ]

    def get_has_project(self, obj):
        return hasattr(obj, "project")

class DirectCheckoutSerializer(serializers.Serializer):
    """Direct checkout payload from mobile app for website development packages"""
    package_id = serializers.PrimaryKeyRelatedField(queryset=ServicePackage.objects.filter(is_active=True))
    addon_ids = serializers.PrimaryKeyRelatedField(queryset=PackageAddOn.objects.filter(is_active=True), many=True, required=False)
    coupon_code = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)

class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = [
            "id",
            "code",
            "description",
            "discount_type",
            "discount_value",
            "min_order_value",
            "max_discount_amount",
            "valid_from",
            "valid_to",
            "max_uses",
            "current_uses",
            "is_active",
            "created_at",
        ]


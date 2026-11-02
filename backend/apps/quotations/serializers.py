from decimal import Decimal
from rest_framework import serializers
from .models import Quote, QuoteItem, QuoteStatusChoices
from apps.services.models import ServicePackage, PackageAddOn

class QuoteItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuoteItem
        fields = ["id", "description", "quantity", "unit_price", "total_price"]
        read_only_fields = ["id", "total_price"]

class QuoteSerializer(serializers.ModelSerializer):
    items = QuoteItemSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source="created_by.full_name", read_only=True)

    class Meta:
        model = Quote
        fields = [
            "id",
            "quote_number",
            "customer",
            "lead",
            "recipient_name",
            "recipient_email",
            "recipient_phone",
            "company_name",
            "status",
            "currency",
            "subtotal",
            "discount_amount",
            "tax_percentage",
            "tax_amount",
            "total_amount",
            "valid_until",
            "terms",
            "notes",
            "created_by_name",
            "accepted_at",
            "created_at",
            "updated_at",
            "items",
        ]
        read_only_fields = [
            "id",
            "quote_number",
            "subtotal",
            "tax_amount",
            "total_amount",
            "accepted_at",
            "created_at",
            "updated_at",
        ]

class QuoteCreateItemInputSerializer(serializers.Serializer):
    description = serializers.CharField(max_length=255)
    quantity = serializers.IntegerField(default=1, min_value=1)
    unit_price = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal("0.00"))

class QuoteCreateSerializer(serializers.ModelSerializer):
    items = QuoteCreateItemInputSerializer(many=True, required=True)

    class Meta:
        model = Quote
        fields = [
            "customer",
            "lead",
            "recipient_name",
            "recipient_email",
            "recipient_phone",
            "company_name",
            "discount_amount",
            "tax_percentage",
            "valid_until",
            "terms",
            "notes",
            "items",
        ]

    def create(self, validated_data):
        items_data = validated_data.pop("items")
        import random
        import string
        rand = "".join(random.choices(string.digits, k=5))
        quote_number = f"QT-{rand}"

        quote = Quote.objects.create(
            quote_number=quote_number,
            created_by=self.context["request"].user,
            **validated_data
        )

        for item_data in items_data:
            QuoteItem.objects.create(quote=quote, **item_data)

        quote.recalculate()
        return quote

class InstantQuoteEstimateSerializer(serializers.Serializer):
    """Calculates instantaneous authoritative price for mobile customer package customization"""
    package_id = serializers.PrimaryKeyRelatedField(queryset=ServicePackage.objects.filter(is_active=True))
    addon_ids = serializers.PrimaryKeyRelatedField(queryset=PackageAddOn.objects.filter(is_active=True), many=True, required=False)
    coupon_code = serializers.CharField(required=False, allow_blank=True)


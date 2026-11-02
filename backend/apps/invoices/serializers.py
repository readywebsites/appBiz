from rest_framework import serializers
from .models import Invoice, InvoiceItem

class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = ["id", "description", "quantity", "unit_price", "total_price"]

class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True, read_only=True)
    order_number = serializers.CharField(source="order.order_number", read_only=True)

    class Meta:
        model = Invoice
        fields = [
            "id",
            "invoice_number",
            "order",
            "order_number",
            "customer",
            "status",
            "issue_date",
            "due_date",
            "currency",
            "subtotal",
            "tax_percentage",
            "tax_amount",
            "total_amount",
            "amount_paid",
            "balance_due",
            "recipient_name",
            "recipient_email",
            "recipient_phone",
            "business_name",
            "billing_address",
            "gstin",
            "notes",
            "terms",
            "created_at",
            "items",
        ]
        read_only_fields = fields


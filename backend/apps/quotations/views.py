from decimal import Decimal
from django.db import transaction
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from apps.authentication.permissions import IsStaffOrAdmin, IsSalesStaff
from apps.authentication.models import RoleChoices
from apps.orders.models import Order, OrderItem, OrderStatusChoices, PaymentStatusChoices, Coupon
from .models import Quote, QuoteItem, QuoteStatusChoices
from .serializers import (
    QuoteSerializer,
    QuoteCreateSerializer,
    InstantQuoteEstimateSerializer,
)
from .pdf_generator import generate_quote_pdf_bytes

@extend_schema(tags=["Quotations & Pricing"])
class QuoteViewSet(viewsets.ModelViewSet):
    queryset = Quote.objects.all().prefetch_related("items").select_related("customer", "lead").order_by("-created_at")
    filter_backends = [filters.SearchFilter]
    search_fields = ["quote_number", "recipient_name", "recipient_email", "company_name"]

    def get_permissions(self):
        if self.action in ["estimate", "accept", "pdf"]:
            return [permissions.IsAuthenticated()]
        return [IsStaffOrAdmin()]

    def get_serializer_class(self):
        if self.action == "create":
            return QuoteCreateSerializer
        return QuoteSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if not user.is_authenticated:
            return Quote.objects.none()
        if user.role == RoleChoices.CUSTOMER and not user.is_staff:
            return qs.filter(customer=user)
        return qs

    @action(detail=False, methods=["post"], url_path="estimate")
    def estimate(self, request):
        serializer = InstantQuoteEstimateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        package = serializer.validated_data["package_id"]
        addons = serializer.validated_data.get("addon_ids", [])
        coupon_code = serializer.validated_data.get("coupon_code", "").strip()

        subtotal = package.price + sum((addon.price for addon in addons), Decimal("0.00"))
        discount = Decimal("0.00")

        coupon_applied = None
        if coupon_code:
            coupon = Coupon.objects.filter(code__iexact=coupon_code, is_active=True).first()
            if coupon:
                discount = coupon.calculate_discount(subtotal)
                coupon_applied = coupon.code

        tax_percentage = Decimal("18.00")
        taxable = max(subtotal - discount, Decimal("0.00"))
        tax = round((taxable * tax_percentage) / Decimal("100.00"), 2)
        total = taxable + tax
        advance = round((total * Decimal("50.00")) / Decimal("100.00"), 2)

        return Response({
            "package": {
                "id": str(package.id),
                "name": package.name,
                "price": str(package.price),
                "delivery_days": package.delivery_days,
            },
            "subtotal": str(subtotal),
            "discount": str(discount),
            "coupon_code": coupon_applied,
            "tax_percentage": str(tax_percentage),
            "tax": str(tax),
            "total": str(total),
            "advance_required": str(advance),
            "currency": "INR",
        })

    @action(detail=True, methods=["post"], url_path="accept")
    def accept(self, request, pk=None):
        quote = self.get_object()
        user = request.user

        if quote.status == QuoteStatusChoices.ACCEPTED or hasattr(quote, "generated_order"):
            return Response({"error": "This quote has already been accepted and converted."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            import random
            import string
            rand = "".join(random.choices(string.digits, k=5))
            order_number = f"ORD-{rand}"

            order = Order.objects.create(
                order_number=order_number,
                customer=user,
                quote=quote,
                status=OrderStatusChoices.PENDING_PAYMENT,
                payment_status=PaymentStatusChoices.UNPAID,
                subtotal=quote.subtotal,
                discount_amount=quote.discount_amount,
                tax_percentage=quote.tax_percentage,
                tax_amount=quote.tax_amount,
                total_amount=quote.total_amount,
                balance_due=quote.total_amount,
                currency=quote.currency,
                notes=f"Converted from quotation {quote.quote_number}",
            )

            for item in quote.items.all():
                OrderItem.objects.create(
                    order=order,
                    title=item.description,
                    quantity=item.quantity,
                    unit_price=item.unit_price,
                    total_price=item.total_price,
                )

            quote.status = QuoteStatusChoices.ACCEPTED
            quote.customer = user
            quote.accepted_at = timezone.now()
            quote.converted_at = timezone.now()
            quote.save()

        return Response({
            "message": "Quotation accepted successfully. Order has been generated.",
            "order_id": str(order.id),
            "order_number": order.order_number,
            "total_amount": str(order.total_amount),
            "minimum_advance": str(order.minimum_advance_amount),
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"], url_path="pdf")
    def pdf(self, request, pk=None):
        quote = self.get_object()
        pdf_bytes = generate_quote_pdf_bytes(quote)
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{quote.quote_number}.pdf"'
        return response


import random
import string
from decimal import Decimal
from django.db import transaction
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from apps.authentication.permissions import IsStaffOrAdmin, IsOwnerOrStaff
from apps.authentication.models import RoleChoices
from .models import Order, OrderItem, Coupon, CouponRedemption, OrderStatusChoices, PaymentStatusChoices
from .serializers import (
    OrderSerializer,
    DirectCheckoutSerializer,
    CouponSerializer,
)

@extend_schema(tags=["Orders & Checkout"])
class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().prefetch_related("items").select_related("customer", "quote", "coupon").order_by("-created_at")
    serializer_class = OrderSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["order_number", "customer__email", "customer__first_name", "customer__last_name"]

    def get_permissions(self):
        if self.action in ["list", "retrieve", "checkout", "cancel"]:
            return [permissions.IsAuthenticated()]
        return [IsStaffOrAdmin()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Order.objects.none()
        qs = super().get_queryset()
        if user.role == RoleChoices.CUSTOMER and not user.is_staff:
            return qs.filter(customer=user)
        return qs

    @action(detail=False, methods=["post"], url_path="checkout")
    def checkout(self, request):
        serializer = DirectCheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        package = serializer.validated_data["package_id"]
        addons = serializer.validated_data.get("addon_ids", [])
        coupon_code = serializer.validated_data.get("coupon_code", "").strip()
        notes = serializer.validated_data.get("notes", "")

        user = request.user

        with transaction.atomic():
            subtotal = package.price + sum((addon.price for addon in addons), Decimal("0.00"))
            discount = Decimal("0.00")
            coupon_obj = None

            if coupon_code:
                coupon = Coupon.objects.filter(code__iexact=coupon_code, is_active=True).first()
                if coupon and coupon.current_uses < coupon.max_uses:
                    discount = coupon.calculate_discount(subtotal)
                    if discount > 0:
                        coupon_obj = coupon
                        coupon.current_uses += 1
                        coupon.save()

            tax_percentage = Decimal("18.00")
            taxable = max(subtotal - discount, Decimal("0.00"))
            tax = round((taxable * tax_percentage) / Decimal("100.00"), 2)
            total = taxable + tax

            rand = "".join(random.choices(string.digits, k=5))
            order_number = f"ORD-{rand}"

            order = Order.objects.create(
                order_number=order_number,
                customer=user,
                status=OrderStatusChoices.PENDING_PAYMENT,
                payment_status=PaymentStatusChoices.UNPAID,
                subtotal=subtotal,
                discount_amount=discount,
                coupon=coupon_obj,
                tax_percentage=tax_percentage,
                tax_amount=tax,
                total_amount=total,
                balance_due=total,
                notes=notes,
            )

            # Create order item for package
            OrderItem.objects.create(
                order=order,
                package=package,
                title=f"{package.service.title} - {package.name}",
                description=f"Turnaround: ~{package.delivery_days} days. Includes package features.",
                quantity=1,
                unit_price=package.price,
                total_price=package.price,
            )

            # Create order items for addons
            for addon in addons:
                OrderItem.objects.create(
                    order=order,
                    title=addon.name,
                    description=addon.description,
                    quantity=1,
                    unit_price=addon.price,
                    total_price=addon.price,
                )

            if coupon_obj and discount > 0:
                CouponRedemption.objects.create(
                    coupon=coupon_obj,
                    order=order,
                    customer=user,
                    discount_applied=discount,
                )

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel(self, request, pk=None):
        order = self.get_object()
        if order.payment_status in [PaymentStatusChoices.PAID, PaymentStatusChoices.PARTIAL]:
            return Response({"error": "Cannot cancel an order with completed payments. Request a refund instead."}, status=status.HTTP_400_BAD_REQUEST)

        order.status = OrderStatusChoices.CANCELLED
        order.cancellation_reason = request.data.get("reason", "Cancelled by customer")
        order.save()
        return Response({"message": "Order cancelled successfully.", "status": order.status})

@extend_schema(tags=["Coupons & Discounts"])
class CouponViewSet(viewsets.ModelViewSet):
    queryset = Coupon.objects.all().order_by("-created_at")
    serializer_class = CouponSerializer
    permission_classes = [IsStaffOrAdmin]

    @action(detail=False, methods=["get"], url_path="validate", permission_classes=[permissions.AllowAny])
    def validate_code(self, request):
        code = request.query_params.get("code", "").strip()
        subtotal_str = request.query_params.get("subtotal", "0.00")
        try:
            subtotal = Decimal(subtotal_str)
        except Exception:
            subtotal = Decimal("0.00")

        coupon = Coupon.objects.filter(code__iexact=code, is_active=True).first()
        if not coupon:
            return Response({"valid": False, "message": "Invalid or expired coupon code."}, status=status.HTTP_400_BAD_REQUEST)

        if coupon.current_uses >= coupon.max_uses:
            return Response({"valid": False, "message": "Coupon usage limit reached."}, status=status.HTTP_400_BAD_REQUEST)

        if subtotal < coupon.min_order_value:
            return Response({
                "valid": False,
                "message": f"Minimum order amount of ₹{coupon.min_order_value} required for this coupon.",
            }, status=status.HTTP_400_BAD_REQUEST)

        discount = coupon.calculate_discount(subtotal)
        return Response({
            "valid": True,
            "code": coupon.code,
            "discount_amount": str(discount),
            "discount_type": coupon.discount_type,
            "discount_value": str(coupon.discount_value),
        })


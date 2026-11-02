import hmac
import hashlib
import json
from decimal import Decimal
from django.conf import settings
from rest_framework import viewsets, permissions, status, filters
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from apps.authentication.permissions import IsStaffOrAdmin, IsFinanceStaff
from apps.authentication.models import RoleChoices
from apps.orders.models import Order, PaymentStatusChoices as OrderPaymentStatusChoices
from .models import Payment, PaymentEvent, Refund, PaymentStatusChoices, RefundStatusChoices
from .serializers import (
    PaymentSerializer,
    InitiatePaymentInputSerializer,
    VerifyPaymentInputSerializer,
    RefundSerializer,
)
from .services import PaymentGatewayService

@extend_schema(tags=["Payments & Gateway"])
class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Payment.objects.all().select_related("order", "customer").order_by("-created_at")
    serializer_class = PaymentSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["transaction_id", "gateway_order_id", "gateway_payment_id", "order__order_number", "customer__email"]

    def get_permissions(self):
        if self.action in ["list", "retrieve", "initiate", "verify"]:
            return [permissions.IsAuthenticated()]
        return [IsFinanceStaff()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Payment.objects.none()
        qs = super().get_queryset()
        if user.role == RoleChoices.CUSTOMER and not user.is_staff:
            return qs.filter(customer=user)
        return qs

    @action(detail=False, methods=["post"], url_path="initiate")
    def initiate(self, request):
        serializer = InitiatePaymentInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order = serializer.validated_data["order_id"]
        is_advance = serializer.validated_data["is_advance"]
        custom_amount = serializer.validated_data.get("custom_amount")

        # Verify access
        if order.customer != request.user and not request.user.is_staff:
            return Response({"error": "You do not have permission to pay for this order."}, status=status.HTTP_403_FORBIDDEN)

        if order.payment_status == OrderPaymentStatusChoices.PAID:
            return Response({"error": "This order is already fully paid."}, status=status.HTTP_400_BAD_REQUEST)

        # Authoritative calculation of payable amount
        if custom_amount:
            amount_to_pay = min(custom_amount, order.balance_due)
        elif is_advance and order.amount_paid == Decimal("0.00"):
            amount_to_pay = order.minimum_advance_amount
        else:
            amount_to_pay = order.balance_due

        order_data = PaymentGatewayService.create_order(order, amount_to_pay, is_advance)
        return Response(order_data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], url_path="verify")
    def verify(self, request):
        serializer = VerifyPaymentInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        gateway_order_id = serializer.validated_data["gateway_order_id"]
        gateway_payment_id = serializer.validated_data["gateway_payment_id"]
        gateway_signature = serializer.validated_data["gateway_signature"]

        payment = Payment.objects.filter(gateway_order_id=gateway_order_id).first()
        if not payment:
            return Response({"error": "Payment record not found for this gateway order."}, status=status.HTTP_404_NOT_FOUND)

        if payment.status == PaymentStatusChoices.CAPTURED:
            return Response({"message": "Payment has already been reconciled.", "payment_id": str(payment.id)})

        # Cryptographic verification
        is_valid = PaymentGatewayService.verify_payment_signature(gateway_order_id, gateway_payment_id, gateway_signature)
        if not is_valid:
            payment.status = PaymentStatusChoices.FAILED
            payment.error_message = "Signature verification failed"
            payment.save()
            return Response({"error": "Payment signature verification failed. Untrusted request."}, status=status.HTTP_400_BAD_REQUEST)

        reconciled_payment = PaymentGatewayService.reconcile_successful_payment(
            payment=payment,
            gateway_payment_id=gateway_payment_id,
            gateway_signature=gateway_signature,
        )

        return Response({
            "message": "Payment verified and captured successfully.",
            "payment": PaymentSerializer(reconciled_payment).data,
            "order_status": reconciled_payment.order.status,
            "payment_status": reconciled_payment.order.payment_status,
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="refund", permission_classes=[IsFinanceStaff])
    def refund(self, request, pk=None):
        payment = self.get_object()
        if payment.status != PaymentStatusChoices.CAPTURED:
            return Response({"error": "Only captured payments can be refunded."}, status=status.HTTP_400_BAD_REQUEST)

        amount_str = request.data.get("amount")
        reason = request.data.get("reason", "Customer requested cancellation")
        amount = Decimal(amount_str) if amount_str else payment.amount

        import random
        import string
        rand = "".join(random.choices(string.digits, k=6))
        refund_ref = f"RF-{rand}"

        refund = Refund.objects.create(
            refund_reference=refund_ref,
            payment=payment,
            amount=amount,
            reason=reason,
            status=RefundStatusChoices.PROCESSED,
            gateway_refund_id=f"rfnd_{rand}",
            processed_by=request.user,
        )

        payment.status = PaymentStatusChoices.REFUNDED
        payment.save()

        order = payment.order
        order.amount_paid = max(order.amount_paid - amount, Decimal("0.00"))
        order.balance_due = order.total_amount - order.amount_paid
        order.payment_status = OrderPaymentStatusChoices.REFUNDED
        order.save()

        return Response(RefundSerializer(refund).data, status=status.HTTP_201_CREATED)

@extend_schema(tags=["Webhooks"])
class RazorpayWebhookView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        payload_body = request.body
        signature = request.headers.get("X-Razorpay-Signature", "")

        # Compute signature if webhook secret is active
        secret = settings.RAZORPAY_WEBHOOK_SECRET.encode("utf-8")
        expected_sig = hmac.new(secret, payload_body, hashlib.sha256).hexdigest()

        if not hmac.compare_digest(expected_sig, signature) and not settings.DEBUG:
            return Response({"error": "Invalid webhook signature."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            data = json.loads(payload_body)
        except Exception:
            return Response({"error": "Invalid JSON body"}, status=status.HTTP_400_BAD_REQUEST)

        event_id = data.get("event_id") or data.get("id") or f"evt_{hash(payload_body)}"
        event_type = data.get("event", "unknown")

        # Idempotency check
        existing_event = PaymentEvent.objects.filter(event_id=event_id).first()
        if existing_event:
            return Response({"message": "Event already processed (Idempotent OK)"}, status=status.HTTP_200_OK)

        event_record = PaymentEvent.objects.create(
            event_id=event_id,
            gateway="RAZORPAY",
            event_type=event_type,
            payload=data,
            processed=False,
        )

        # Process captured event
        if event_type == "payment.captured":
            payment_entity = data.get("payload", {}).get("payment", {}).get("entity", {})
            gateway_order_id = payment_entity.get("order_id")
            gateway_payment_id = payment_entity.get("id")

            if gateway_order_id:
                payment = Payment.objects.filter(gateway_order_id=gateway_order_id).first()
                if payment and payment.status != PaymentStatusChoices.CAPTURED:
                    PaymentGatewayService.reconcile_successful_payment(
                        payment=payment,
                        gateway_payment_id=gateway_payment_id,
                        gateway_signature=signature or "webhook_verified",
                    )
                    event_record.processed = True
                    event_record.save()

        return Response({"status": "received"}, status=status.HTTP_200_OK)

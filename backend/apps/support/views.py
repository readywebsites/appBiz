from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from apps.authentication.models import RoleChoices
from apps.authentication.permissions import IsSupportStaff, IsStaffOrAdmin
from .models import SupportTicket, SupportMessage, TicketStatusChoices
from .serializers import (
    SupportTicketSerializer,
    SupportTicketCreateSerializer,
    SupportMessageSerializer,
)

@extend_schema(tags=["Customer Support & Helpdesk"])
class SupportTicketViewSet(viewsets.ModelViewSet):
    queryset = SupportTicket.objects.all().prefetch_related("messages__sender").select_related("customer", "project", "order", "assigned_to").order_by("-created_at")
    filter_backends = [filters.SearchFilter]
    search_fields = ["ticket_number", "subject", "customer__email", "customer__first_name"]

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == "create":
            return SupportTicketCreateSerializer
        return SupportTicketSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return SupportTicket.objects.none()
        qs = super().get_queryset()
        if user.role == RoleChoices.CUSTOMER and not user.is_staff:
            return qs.filter(customer=user)
        return qs

    @action(detail=True, methods=["post"], url_path="reply")
    def reply(self, request, pk=None):
        ticket = self.get_object()
        message_text = request.data.get("message", "").strip()
        attachment_url = request.data.get("attachment_url", "")

        if not message_text:
            return Response({"error": "Message content cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        is_staff = request.user.role != RoleChoices.CUSTOMER or request.user.is_staff

        message = SupportMessage.objects.create(
            ticket=ticket,
            sender=request.user,
            message=message_text,
            is_staff_reply=is_staff,
            attachment_url=attachment_url,
        )

        if is_staff:
            ticket.status = TicketStatusChoices.WAITING_CUSTOMER
        else:
            ticket.status = TicketStatusChoices.IN_PROGRESS
        ticket.save()

        return Response(SupportMessageSerializer(message).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="close")
    def close(self, request, pk=None):
        ticket = self.get_object()
        ticket.status = TicketStatusChoices.CLOSED
        ticket.save()
        return Response(SupportTicketSerializer(ticket).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="reopen")
    def reopen(self, request, pk=None):
        ticket = self.get_object()
        ticket.status = TicketStatusChoices.IN_PROGRESS
        ticket.save()
        return Response(SupportTicketSerializer(ticket).data, status=status.HTTP_200_OK)



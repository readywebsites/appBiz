from django.http import HttpResponse
from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from drf_spectacular.utils import extend_schema
from apps.authentication.permissions import IsStaffOrAdmin, IsFinanceStaff
from apps.authentication.models import RoleChoices
from .models import Invoice
from .serializers import InvoiceSerializer
from .pdf_generator import generate_invoice_pdf_bytes

@extend_schema(tags=["Invoices & Finance"])
class InvoiceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Invoice.objects.all().prefetch_related("items").select_related("order", "customer").order_by("-issue_date", "-created_at")
    serializer_class = InvoiceSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["invoice_number", "order__order_number", "recipient_name", "recipient_email", "business_name"]

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Invoice.objects.none()
        qs = super().get_queryset()
        if user.role == RoleChoices.CUSTOMER and not user.is_staff:
            return qs.filter(customer=user)
        return qs

    @action(detail=True, methods=["get"], url_path="pdf")
    def pdf(self, request, pk=None):
        invoice = self.get_object()
        pdf_bytes = generate_invoice_pdf_bytes(invoice)
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{invoice.invoice_number}.pdf"'
        return response


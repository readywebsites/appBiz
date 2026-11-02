from django.utils import timezone
from rest_framework import viewsets, generics, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from apps.authentication.permissions import IsStaffOrAdmin, IsSalesStaff
from apps.authentication.models import User, RoleChoices, CustomerProfile
from .models import (
    Lead,
    LeadActivity,
    ConsultationRequest,
    LeadStatusChoices,
    ActivityTypeChoices,
)
from .serializers import (
    LeadPublicCreateSerializer,
    LeadListSerializer,
    LeadDetailSerializer,
    LeadActivitySerializer,
    ConsultationRequestSerializer,
)

@extend_schema(tags=["Customer Acquisition (Leads)"])
class LeadPublicCreateView(generics.CreateAPIView):
    serializer_class = LeadPublicCreateSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lead = serializer.save()

        # Log creation activity
        LeadActivity.objects.create(
            lead=lead,
            activity_type=ActivityTypeChoices.NOTE,
            summary="New enquiry received via app / web portal",
            details=f"Requirements: {lead.requirements[:200]}",
        )

        return Response(
            {
                "message": "Enquiry submitted successfully. Our team will contact you shortly.",
                "reference_id": lead.reference_id,
            },
            status=status.HTTP_201_CREATED,
        )

@extend_schema(tags=["CRM & Lead Management"])
class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.all().select_related("service_interest", "package_interest", "assigned_to").order_by("-created_at")
    permission_classes = [IsStaffOrAdmin]
    filter_backends = [filters.SearchFilter]
    search_fields = ["reference_id", "full_name", "email", "phone", "company_name", "campaign"]

    def get_serializer_class(self):
        if self.action in ["retrieve", "update", "partial_update"]:
            return LeadDetailSerializer
        return LeadListSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get("status")
        priority = self.request.query_params.get("priority")
        assigned_me = self.request.query_params.get("assigned_me")

        if status_param:
            qs = qs.filter(status=status_param)
        if priority:
            qs = qs.filter(priority=priority)
        if assigned_me and self.request.user.is_authenticated:
            qs = qs.filter(assigned_to=self.request.user)

        return qs

    def perform_update(self, serializer):
        old_status = self.get_object().status
        lead = serializer.save()
        if old_status != lead.status:
            LeadActivity.objects.create(
                lead=lead,
                activity_type=ActivityTypeChoices.STATUS_CHANGE,
                summary=f"Status changed from {old_status} to {lead.status}",
                created_by=self.request.user,
            )

    @action(detail=True, methods=["post"], url_path="add-activity")
    def add_activity(self, request, pk=None):
        lead = self.get_object()
        serializer = LeadActivitySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        activity = serializer.save(lead=lead, created_by=request.user)
        return Response(LeadActivitySerializer(activity).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="convert")
    def convert_to_customer(self, request, pk=None):
        lead = self.get_object()
        if lead.converted_customer:
            return Response({"error": "This lead has already been converted."}, status=status.HTTP_400_BAD_REQUEST)

        # Find or create User
        user = User.objects.filter(email=lead.email).first()
        if not user:
            import secrets
            temp_password = secrets.token_urlsafe(10)
            user = User.objects.create_user(
                email=lead.email,
                password=temp_password,
                first_name=lead.full_name.split()[0] if lead.full_name else "",
                last_name=" ".join(lead.full_name.split()[1:]) if " " in lead.full_name else "",
                phone=lead.phone,
                role=RoleChoices.CUSTOMER,
                is_verified=True,
            )
            CustomerProfile.objects.create(
                user=user,
                business_name=lead.company_name,
            )

        lead.status = LeadStatusChoices.WON
        lead.converted_customer = user
        lead.converted_at = timezone.now()
        lead.save()

        LeadActivity.objects.create(
            lead=lead,
            activity_type=ActivityTypeChoices.STATUS_CHANGE,
            summary="Lead successfully converted into Customer Account",
            created_by=request.user,
        )

        return Response(
            {
                "message": "Lead converted successfully.",
                "customer_id": str(user.id),
                "customer_email": user.email,
            },
            status=status.HTTP_200_OK,
        )

@extend_schema(tags=["Consultation Bookings"])
class ConsultationViewSet(viewsets.ModelViewSet):
    queryset = ConsultationRequest.objects.all().select_related("assigned_to").order_by("-preferred_date")
    serializer_class = ConsultationRequestSerializer

    def get_permissions(self):
        if self.action == "create":
            return [permissions.AllowAny()]
        return [IsStaffOrAdmin()]


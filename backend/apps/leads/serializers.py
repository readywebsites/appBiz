from rest_framework import serializers
from .models import (
    Lead,
    LeadActivity,
    ConsultationRequest,
    LeadStatusChoices,
)
from apps.services.models import Service, ServicePackage

class LeadActivitySerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.full_name", read_only=True)

    class Meta:
        model = LeadActivity
        fields = ["id", "activity_type", "summary", "details", "created_by_name", "created_at"]
        read_only_fields = ["id", "created_at"]

class LeadPublicCreateSerializer(serializers.ModelSerializer):
    """Used by mobile app and landing page visitors to request enquiry / website quotation"""
    service_id = serializers.PrimaryKeyRelatedField(queryset=Service.objects.all(), source="service_interest", required=False, allow_null=True)
    package_id = serializers.PrimaryKeyRelatedField(queryset=ServicePackage.objects.all(), source="package_interest", required=False, allow_null=True)

    class Meta:
        model = Lead
        fields = [
            "reference_id",
            "full_name",
            "email",
            "phone",
            "company_name",
            "requirements",
            "estimated_budget",
            "service_id",
            "package_id",
            "campaign",
            "source",
            "medium",
            "referral_code",
            "created_at",
        ]
        read_only_fields = ["reference_id", "created_at"]

class LeadListSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source="service_interest.title", read_only=True)
    package_name = serializers.CharField(source="package_interest.name", read_only=True)
    assigned_to_name = serializers.CharField(source="assigned_to.full_name", read_only=True)

    class Meta:
        model = Lead
        fields = [
            "id",
            "reference_id",
            "full_name",
            "email",
            "phone",
            "company_name",
            "requirements",
            "status",
            "priority",
            "estimated_budget",
            "service_name",
            "package_name",
            "assigned_to",
            "assigned_to_name",
            "source",
            "next_follow_up_date",
            "created_at",
        ]

class LeadDetailSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source="service_interest.title", read_only=True)
    package_name = serializers.CharField(source="package_interest.name", read_only=True)
    assigned_to_name = serializers.CharField(source="assigned_to.full_name", read_only=True)
    activities = LeadActivitySerializer(many=True, read_only=True)

    class Meta:
        model = Lead
        fields = [
            "id",
            "reference_id",
            "full_name",
            "email",
            "phone",
            "company_name",
            "requirements",
            "estimated_budget",
            "currency",
            "service_interest",
            "service_name",
            "package_interest",
            "package_name",
            "status",
            "priority",
            "assigned_to",
            "assigned_to_name",
            "campaign",
            "source",
            "medium",
            "referral_code",
            "next_follow_up_date",
            "notes",
            "lost_reason",
            "converted_customer",
            "converted_at",
            "activities",
            "created_at",
            "updated_at",
        ]

class ConsultationRequestSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source="assigned_to.full_name", read_only=True)

    class Meta:
        model = ConsultationRequest
        fields = [
            "id",
            "name",
            "email",
            "phone",
            "company_name",
            "preferred_date",
            "preferred_time_slot",
            "topic",
            "notes",
            "status",
            "assigned_to",
            "assigned_to_name",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


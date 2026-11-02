from rest_framework import serializers
from .models import (
    Project,
    ProjectMilestone,
    Task,
    ProjectFile,
    RevisionRequest,
    CustomerApproval,
    ProjectStatusChoices,
    ProjectRequirement,
    ProjectDomainHosting,
    ProjectReview,
)

class ProjectMilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectMilestone
        fields = ["id", "title", "description", "due_date", "status", "display_order", "completed_at"]

class TaskSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source="assigned_to.full_name", read_only=True)

    class Meta:
        model = Task
        fields = [
            "id",
            "project",
            "milestone",
            "title",
            "description",
            "assigned_to",
            "assigned_to_name",
            "priority",
            "status",
            "due_date",
            "completed_at",
            "created_at",
        ]

class ProjectFileSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source="uploaded_by.full_name", read_only=True)

    class Meta:
        model = ProjectFile
        fields = [
            "id",
            "project",
            "title",
            "file_url",
            "file",
            "file_type",
            "is_client_visible",
            "uploaded_by_name",
            "created_at",
        ]
        read_only_fields = ["id", "uploaded_by_name", "created_at"]

class RevisionRequestSerializer(serializers.ModelSerializer):
    requested_by_name = serializers.CharField(source="requested_by.full_name", read_only=True)

    class Meta:
        model = RevisionRequest
        fields = [
            "id",
            "project",
            "requested_by",
            "requested_by_name",
            "title",
            "description",
            "status",
            "staff_response",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "requested_by", "requested_by_name", "created_at", "updated_at"]

class CustomerApprovalSerializer(serializers.ModelSerializer):
    approved_by_name = serializers.CharField(source="approved_by.full_name", read_only=True)

    class Meta:
        model = CustomerApproval
        fields = [
            "id",
            "project",
            "approved_by",
            "approved_by_name",
            "milestone",
            "approval_type",
            "comments",
            "approved_at",
        ]
        read_only_fields = ["id", "approved_by", "approved_by_name", "approved_at"]

class ProjectRequirementSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectRequirement
        fields = [
            "id",
            "project",
            "status",
            "business_name",
            "tagline",
            "about_business",
            "services_offered",
            "target_audience",
            "preferred_colors",
            "design_references",
            "domain_name",
            "has_own_domain",
            "contact_email",
            "contact_phone",
            "contact_address",
            "whatsapp_number",
            "social_facebook",
            "social_instagram",
            "social_linkedin",
            "social_twitter",
            "logo_url",
            "logo_file",
            "special_instructions",
            "submitted_at",
            "reviewed_at",
            "staff_feedback",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "project", "submitted_at", "reviewed_at", "staff_feedback", "created_at", "updated_at"]

class ProjectDomainHostingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectDomainHosting
        fields = [
            "id",
            "project",
            "domain_name",
            "domain_registrar",
            "domain_registered_at",
            "domain_expires_at",
            "hosting_provider",
            "hosting_plan",
            "hosting_started_at",
            "hosting_expires_at",
            "ssl_status",
            "ssl_expires_at",
            "renewal_status",
            "annual_renewal_price",
            "last_renewed_at",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "project", "created_at", "updated_at"]

class ProjectReviewSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.full_name", read_only=True)

    class Meta:
        model = ProjectReview
        fields = [
            "id",
            "project",
            "customer",
            "customer_name",
            "rating",
            "headline",
            "feedback",
            "testimonial_permission",
            "is_approved",
            "created_at",
        ]
        read_only_fields = ["id", "customer", "customer_name", "is_approved", "created_at"]

class ProjectListSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source="order.order_number", read_only=True)
    customer_name = serializers.CharField(source="customer.full_name", read_only=True)
    manager_name = serializers.CharField(source="project_manager.full_name", read_only=True)

    class Meta:
        model = Project
        fields = [
            "id",
            "order",
            "order_number",
            "customer",
            "customer_name",
            "title",
            "status",
            "progress_percentage",
            "project_manager",
            "manager_name",
            "target_delivery_date",
            "staging_url",
            "live_url",
            "created_at",
        ]

class ProjectDetailSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source="order.order_number", read_only=True)
    customer_name = serializers.CharField(source="customer.full_name", read_only=True)
    manager_name = serializers.CharField(source="project_manager.full_name", read_only=True)
    milestones = ProjectMilestoneSerializer(many=True, read_only=True)
    tasks = TaskSerializer(many=True, read_only=True)
    files = serializers.SerializerMethodField()
    revisions = RevisionRequestSerializer(many=True, read_only=True)
    approvals = CustomerApprovalSerializer(many=True, read_only=True)
    requirements = serializers.SerializerMethodField()
    domain_hosting = serializers.SerializerMethodField()
    review = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id",
            "order",
            "order_number",
            "customer",
            "customer_name",
            "title",
            "description",
            "status",
            "progress_percentage",
            "project_manager",
            "manager_name",
            "target_delivery_date",
            "actual_delivery_date",
            "staging_url",
            "live_url",
            "repo_url",
            "client_notes",
            "internal_notes",
            "milestones",
            "tasks",
            "files",
            "revisions",
            "approvals",
            "requirements",
            "domain_hosting",
            "review",
            "created_at",
            "updated_at",
        ]

    def get_files(self, obj):
        user = self.context["request"].user
        qs = obj.files.all()
        if user.role == "CUSTOMER":
            qs = qs.filter(is_client_visible=True)
        return ProjectFileSerializer(qs, many=True, context=self.context).data

    def get_requirements(self, obj):
        try:
            if hasattr(obj, "requirements") and obj.requirements:
                return ProjectRequirementSerializer(obj.requirements, context=self.context).data
        except Exception:
            pass
        return None

    def get_domain_hosting(self, obj):
        try:
            if hasattr(obj, "domain_hosting") and obj.domain_hosting:
                return ProjectDomainHostingSerializer(obj.domain_hosting, context=self.context).data
        except Exception:
            pass
        return None

    def get_review(self, obj):
        try:
            if hasattr(obj, "review") and obj.review:
                return ProjectReviewSerializer(obj.review, context=self.context).data
        except Exception:
            pass
        return None


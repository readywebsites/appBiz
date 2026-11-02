from django.utils import timezone
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from apps.authentication.permissions import IsStaffOrAdmin, IsProjectStaff
from apps.authentication.models import RoleChoices
from .models import (
    Project,
    ProjectMilestone,
    Task,
    ProjectFile,
    RevisionRequest,
    CustomerApproval,
    ProjectStatusChoices,
    MilestoneStatusChoices,
    ProjectRequirement,
    ProjectDomainHosting,
    ProjectReview,
    RequirementStatusChoices,
)
from .serializers import (
    ProjectListSerializer,
    ProjectDetailSerializer,
    ProjectMilestoneSerializer,
    TaskSerializer,
    ProjectFileSerializer,
    RevisionRequestSerializer,
    CustomerApprovalSerializer,
    ProjectRequirementSerializer,
    ProjectDomainHostingSerializer,
    ProjectReviewSerializer,
)

@extend_schema(tags=["Project Management & Client Portal"])
class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().prefetch_related("milestones", "tasks", "files", "revisions", "approvals").select_related("order", "customer", "project_manager").order_by("-created_at")
    filter_backends = [filters.SearchFilter]
    search_fields = ["title", "order__order_number", "customer__email", "customer__first_name"]

    def get_permissions(self):
        if self.action in [
            "list",
            "retrieve",
            "request_revision",
            "approve_deliverable",
            "requirements",
            "upload_asset",
            "review",
            "domain_hosting",
        ]:
            return [permissions.IsAuthenticated()]
        return [IsProjectStaff()]

    def get_serializer_class(self):
        if self.action in ["retrieve", "update", "partial_update"]:
            return ProjectDetailSerializer
        return ProjectListSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Project.objects.none()
        qs = super().get_queryset()
        if user.role == RoleChoices.CUSTOMER and not user.is_staff:
            return qs.filter(customer=user)
        return qs

    @action(detail=True, methods=["post"], url_path="request-revision")
    def request_revision(self, request, pk=None):
        project = self.get_object()
        title = request.data.get("title")
        description = request.data.get("description")

        if not title or not description:
            return Response({"error": "Title and description are required for a revision request."}, status=status.HTTP_400_BAD_REQUEST)

        rev = RevisionRequest.objects.create(
            project=project,
            requested_by=request.user,
            title=title,
            description=description,
        )

        project.status = ProjectStatusChoices.REVISIONS
        project.save()

        return Response(RevisionRequestSerializer(rev).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="approve", url_name="approve")
    def approve_deliverable(self, request, pk=None):
        project = self.get_object()
        approval_type = request.data.get("approval_type", "FINAL_DELIVERY_SIGN_OFF")
        comments = request.data.get("comments", "Approved without changes")

        approval = CustomerApproval.objects.create(
            project=project,
            approved_by=request.user,
            approval_type=approval_type,
            comments=comments,
        )

        if approval_type == "FINAL_DELIVERY_SIGN_OFF":
            project.status = ProjectStatusChoices.COMPLETED
            project.progress_percentage = 100
            project.actual_delivery_date = timezone.now().date()
            project.save()

        return Response(CustomerApprovalSerializer(approval).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get", "post", "patch"], url_path="requirements")
    def requirements(self, request, pk=None):
        project = self.get_object()
        req, _ = ProjectRequirement.objects.get_or_create(project=project)

        if request.method == "GET":
            return Response(ProjectRequirementSerializer(req, context={"request": request}).data)

        action_type = request.data.get("action", "save")
        serializer = ProjectRequirementSerializer(req, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        updated_req = serializer.save()

        if action_type == "submit":
            updated_req.status = RequirementStatusChoices.SUBMITTED
            updated_req.submitted_at = timezone.now()
            updated_req.save()
            if project.status == ProjectStatusChoices.AWAITING_REQUIREMENTS:
                project.status = ProjectStatusChoices.PLANNING
                project.progress_percentage = max(project.progress_percentage, 15)
                project.save(update_fields=["status", "progress_percentage"])
        elif updated_req.status == RequirementStatusChoices.PENDING:
            updated_req.status = RequirementStatusChoices.DRAFT
            updated_req.save()

        return Response(ProjectRequirementSerializer(updated_req, context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="upload-asset")
    def upload_asset(self, request, pk=None):
        project = self.get_object()
        file_obj = request.FILES.get("file")
        title = request.data.get("title", "Project Asset")
        file_type = request.data.get("file_type", "DESIGN")

        if not file_obj:
            return Response({"error": "No file uploaded."}, status=status.HTTP_400_BAD_REQUEST)

        if file_obj.size > 10 * 1024 * 1024:
            return Response({"error": "File size exceeds 10MB limit."}, status=status.HTTP_400_BAD_REQUEST)

        proj_file = ProjectFile.objects.create(
            project=project,
            title=title,
            file=file_obj,
            file_type=file_type,
            is_client_visible=True,
            uploaded_by=request.user,
        )
        file_url = request.build_absolute_uri(proj_file.file.url) if proj_file.file else ""
        proj_file.file_url = file_url
        proj_file.save(update_fields=["file_url"])

        return Response(ProjectFileSerializer(proj_file, context={"request": request}).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get", "post"], url_path="review")
    def review(self, request, pk=None):
        project = self.get_object()

        if request.method == "GET":
            try:
                review_obj = project.review
                return Response(ProjectReviewSerializer(review_obj, context={"request": request}).data)
            except ProjectReview.DoesNotExist:
                return Response({"detail": "No review submitted yet."}, status=status.HTTP_404_NOT_FOUND)

        # Eligibility check: Project must have reached review, revision, or completion stage
        eligible_statuses = [
            ProjectStatusChoices.REVIEW,
            ProjectStatusChoices.READY_FOR_DELIVERY,
            ProjectStatusChoices.COMPLETED,
            ProjectStatusChoices.DEVELOPMENT,
            ProjectStatusChoices.REVISIONS,
        ]
        if project.status not in eligible_statuses:
            return Response(
                {"error": "This project is currently awaiting requirements and is not eligible for client review yet."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Duplicate prevention check
        existing_review = getattr(project, "review", None)
        if not existing_review:
            existing_review = ProjectReview.objects.filter(project=project).first()

        if existing_review and not request.data.get("update", False):
            return Response(
                {
                    "error": "You have already submitted a review for this project. Duplicate reviews are not permitted.",
                    "review": ProjectReviewSerializer(existing_review, context={"request": request}).data,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        rating = request.data.get("rating", 5)
        try:
            rating = int(rating)
            if rating < 1 or rating > 5:
                rating = 5
        except (ValueError, TypeError):
            rating = 5

        feedback = request.data.get("feedback", "").strip()
        if not feedback:
            return Response({"error": "Feedback message cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        headline = request.data.get("headline", "")
        testimonial_permission = request.data.get("testimonial_permission", True)

        review_obj, _ = ProjectReview.objects.update_or_create(
            project=project,
            defaults={
                "customer": request.user,
                "rating": rating,
                "headline": headline,
                "feedback": feedback,
                "testimonial_permission": testimonial_permission,
            },
        )
        return Response(ProjectReviewSerializer(review_obj, context={"request": request}).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get", "post"], url_path="domain-hosting")
    def domain_hosting(self, request, pk=None):
        project = self.get_object()

        domain_name = project.live_url.replace("https://", "").replace("http://", "").split("/")[0] if project.live_url else f"{project.order.order_number.lower()}.biz499.site"
        hosting, _ = ProjectDomainHosting.objects.get_or_create(
            project=project,
            defaults={
                "domain_name": domain_name,
                "domain_registered_at": project.created_at.date(),
                "domain_expires_at": project.created_at.date() + timezone.timedelta(days=365),
                "hosting_started_at": project.created_at.date(),
                "hosting_expires_at": project.created_at.date() + timezone.timedelta(days=365),
                "ssl_status": "ACTIVE",
                "ssl_expires_at": project.created_at.date() + timezone.timedelta(days=90),
                "renewal_status": "ACTIVE",
            }
        )

        if request.method == "POST":
            action_type = request.data.get("action", "request_renewal")
            if action_type == "request_renewal":
                hosting.renewal_status = "RENEWAL_REQUESTED"
                notes = request.data.get("notes", "Renewal requested by client via mobile app.")
                hosting.notes = f"{hosting.notes}\n[{timezone.now().strftime('%Y-%m-%d %H:%M')}] {notes}".strip()
                hosting.save()
                return Response({
                    "message": "Renewal request submitted successfully. Our billing team will reach out with the renewal invoice.",
                    "domain_hosting": ProjectDomainHostingSerializer(hosting, context={"request": request}).data,
                }, status=status.HTTP_200_OK)

        return Response(ProjectDomainHostingSerializer(hosting, context={"request": request}).data)


@extend_schema(tags=["Tasks"])
class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all().select_related("project", "assigned_to", "milestone").order_by("-priority", "due_date")
    serializer_class = TaskSerializer
    permission_classes = [IsProjectStaff]

    def get_queryset(self):
        qs = super().get_queryset()
        project_id = self.request.query_params.get("project_id")
        if project_id:
            qs = qs.filter(project_id=project_id)
        return qs

@extend_schema(tags=["Project Files"])
class ProjectFileViewSet(viewsets.ModelViewSet):
    queryset = ProjectFile.objects.all().select_related("project", "uploaded_by").order_by("-created_at")
    serializer_class = ProjectFileSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.IsAuthenticated()]
        return [IsProjectStaff()]

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)


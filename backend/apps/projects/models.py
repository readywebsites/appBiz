import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from apps.orders.models import Order

class ProjectStatusChoices(models.TextChoices):
    AWAITING_REQUIREMENTS = "AWAITING_REQUIREMENTS", "Awaiting Requirements"
    PLANNING = "PLANNING", "Planning & Wireframing"
    DESIGN = "DESIGN", "UI/UX Design"
    DEVELOPMENT = "DEVELOPMENT", "Development"
    REVIEW = "REVIEW", "Client Review"
    REVISIONS = "REVISIONS", "Revisions"
    READY_FOR_DELIVERY = "READY_FOR_DELIVERY", "Ready for Delivery"
    COMPLETED = "COMPLETED", "Completed"
    ON_HOLD = "ON_HOLD", "On Hold"
    CANCELLED = "CANCELLED", "Cancelled"

class MilestoneStatusChoices(models.TextChoices):
    PENDING = "PENDING", "Pending"
    IN_PROGRESS = "IN_PROGRESS", "In Progress"
    COMPLETED = "COMPLETED", "Completed"

class TaskPriorityChoices(models.TextChoices):
    LOW = "LOW", "Low"
    MEDIUM = "MEDIUM", "Medium"
    HIGH = "HIGH", "High"
    URGENT = "URGENT", "Urgent"

class TaskStatusChoices(models.TextChoices):
    TODO = "TODO", "To Do"
    IN_PROGRESS = "IN_PROGRESS", "In Progress"
    REVIEW = "REVIEW", "Review"
    DONE = "DONE", "Done"

class Project(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name="project")
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="projects")
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=40,
        choices=ProjectStatusChoices.choices,
        default=ProjectStatusChoices.AWAITING_REQUIREMENTS,
        db_index=True,
    )
    progress_percentage = models.PositiveSmallIntegerField(default=0, help_text="0 to 100")
    project_manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="managed_projects",
    )
    target_delivery_date = models.DateField(null=True, blank=True)
    actual_delivery_date = models.DateField(null=True, blank=True)

    staging_url = models.URLField(max_length=500, blank=True)
    live_url = models.URLField(max_length=500, blank=True)
    repo_url = models.URLField(max_length=500, blank=True)

    internal_notes = models.TextField(blank=True, help_text="Internal staff notes, hidden from customer")
    client_notes = models.TextField(blank=True, help_text="Visible to customer in their portal")

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} - {self.customer.full_name} ({self.status})"

class ProjectMilestone(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="milestones")
    title = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    due_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=MilestoneStatusChoices.choices, default=MilestoneStatusChoices.PENDING)
    display_order = models.PositiveIntegerField(default=0)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["display_order", "due_date"]

    def __str__(self):
        return f"{self.project.title} - {self.title} ({self.status})"

class Task(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="tasks")
    milestone = models.ForeignKey(ProjectMilestone, on_delete=models.SET_NULL, null=True, blank=True, related_name="tasks")
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_tasks",
    )
    priority = models.CharField(max_length=20, choices=TaskPriorityChoices.choices, default=TaskPriorityChoices.MEDIUM)
    status = models.CharField(max_length=20, choices=TaskStatusChoices.choices, default=TaskStatusChoices.TODO)
    due_date = models.DateField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-priority", "due_date"]

    def __str__(self):
        return f"{self.title} ({self.status})"

class FileTypeChoices(models.TextChoices):
    DOCUMENT = "DOCUMENT", "Document"
    DESIGN = "DESIGN", "Design Asset"
    CODE = "CODE", "Source Code / Archive"
    DELIVERABLE = "DELIVERABLE", "Final Deliverable"

class ProjectFile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="files")
    title = models.CharField(max_length=200)
    file_url = models.URLField(max_length=500, blank=True)
    file = models.FileField(upload_to="projects/files/%Y/%m/", null=True, blank=True)
    file_type = models.CharField(max_length=30, choices=FileTypeChoices.choices, default=FileTypeChoices.DOCUMENT)
    is_client_visible = models.BooleanField(default=True)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.project.title})"

class RevisionStatusChoices(models.TextChoices):
    SUBMITTED = "SUBMITTED", "Submitted"
    UNDER_REVIEW = "UNDER_REVIEW", "Under Review"
    ACCEPTED = "ACCEPTED", "Accepted & Scheduled"
    IMPLEMENTED = "IMPLEMENTED", "Implemented"
    REJECTED = "REJECTED", "Rejected"

class RevisionRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="revisions")
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField()
    status = models.CharField(max_length=30, choices=RevisionStatusChoices.choices, default=RevisionStatusChoices.SUBMITTED)
    staff_response = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Revision #{self.title} ({self.status})"

class ApprovalTypeChoices(models.TextChoices):
    DESIGN_SIGN_OFF = "DESIGN_SIGN_OFF", "Design Sign-off"
    MILESTONE_SIGN_OFF = "MILESTONE_SIGN_OFF", "Milestone Sign-off"
    FINAL_DELIVERY_SIGN_OFF = "FINAL_DELIVERY_SIGN_OFF", "Final Delivery Sign-off"

class CustomerApproval(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="approvals")
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    milestone = models.ForeignKey(ProjectMilestone, on_delete=models.SET_NULL, null=True, blank=True)
    approval_type = models.CharField(max_length=40, choices=ApprovalTypeChoices.choices, default=ApprovalTypeChoices.FINAL_DELIVERY_SIGN_OFF)
    comments = models.TextField(blank=True)
    approved_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Approved {self.approval_type} by {self.approved_by.email} on {self.approved_at}"

class RequirementStatusChoices(models.TextChoices):
    PENDING = "PENDING", "Requirements Pending"
    DRAFT = "DRAFT", "Draft Saved"
    SUBMITTED = "SUBMITTED", "Submitted"
    UNDER_REVIEW = "UNDER_REVIEW", "Under Review"
    CLARIFICATION_REQUIRED = "CLARIFICATION_REQUIRED", "Clarification Required"
    APPROVED = "APPROVED", "Approved"

class ProjectRequirement(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name="requirements")
    status = models.CharField(
        max_length=30,
        choices=RequirementStatusChoices.choices,
        default=RequirementStatusChoices.PENDING,
        db_index=True,
    )
    business_name = models.CharField(max_length=200, blank=True)
    tagline = models.CharField(max_length=255, blank=True)
    about_business = models.TextField(blank=True)
    services_offered = models.TextField(blank=True)
    target_audience = models.TextField(blank=True)
    preferred_colors = models.CharField(max_length=150, blank=True)
    design_references = models.TextField(blank=True, help_text="Links to reference / competitor sites")
    domain_name = models.CharField(max_length=200, blank=True)
    has_own_domain = models.BooleanField(default=False)
    contact_email = models.CharField(max_length=150, blank=True)
    contact_phone = models.CharField(max_length=30, blank=True)
    contact_address = models.TextField(blank=True)
    whatsapp_number = models.CharField(max_length=30, blank=True)
    social_facebook = models.CharField(max_length=255, blank=True)
    social_instagram = models.CharField(max_length=255, blank=True)
    social_linkedin = models.CharField(max_length=255, blank=True)
    social_twitter = models.CharField(max_length=255, blank=True)
    logo_url = models.URLField(max_length=500, blank=True)
    logo_file = models.FileField(upload_to="projects/requirements/%Y/%m/", null=True, blank=True)
    special_instructions = models.TextField(blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    staff_feedback = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Requirements for {self.project.title} ({self.status})"

class ProjectDomainHosting(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name="domain_hosting")
    domain_name = models.CharField(max_length=255, blank=True)
    domain_registrar = models.CharField(max_length=100, blank=True, default="Biz499 Managed DNS")
    domain_registered_at = models.DateField(null=True, blank=True)
    domain_expires_at = models.DateField(null=True, blank=True)
    hosting_provider = models.CharField(max_length=100, blank=True, default="Biz499 High-Speed Cloud")
    hosting_plan = models.CharField(max_length=100, blank=True, default="Pro Business Cloud SSD")
    hosting_started_at = models.DateField(null=True, blank=True)
    hosting_expires_at = models.DateField(null=True, blank=True)
    ssl_status = models.CharField(max_length=30, default="ACTIVE")
    ssl_expires_at = models.DateField(null=True, blank=True)
    renewal_status = models.CharField(max_length=30, default="ACTIVE")
    annual_renewal_price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("1499.00"))
    last_renewed_at = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Hosting for {self.project.title} - {self.domain_name}"

class ProjectReview(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name="review")
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="project_reviews")
    rating = models.PositiveSmallIntegerField(default=5)
    headline = models.CharField(max_length=200, blank=True)
    feedback = models.TextField()
    testimonial_permission = models.BooleanField(default=True)
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.rating}★ Review by {self.customer.email} for {self.project.title}"



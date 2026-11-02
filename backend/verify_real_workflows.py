import os
import sys
import django
from decimal import Decimal

# Ensure utf-8 output in Windows terminal
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Setup Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from apps.authentication.models import User, RoleChoices, CustomerProfile, Referral
from apps.services.models import ServiceCategory, Service, ServicePackage
from apps.orders.models import Order, OrderStatusChoices, PaymentStatusChoices
from apps.payments.models import Payment, PaymentStatusChoices as PayStatus
from apps.payments.services import PaymentGatewayService
from apps.projects.models import (
    Project,
    ProjectStatusChoices,
    ProjectRequirement,
    RequirementStatusChoices,
    RevisionRequest,
    CustomerApproval,
    ProjectDomainHosting,
    ProjectReview,
    ProjectFile,
)
from apps.support.models import SupportTicket, TicketStatusChoices, TicketCategoryChoices, TicketPriorityChoices, SupportMessage

def run_real_verification():
    print("=" * 70)
    print("BIZ499 REAL-WORLD END-TO-END WORKFLOW VERIFICATION")
    print("=" * 70)

    client = APIClient()

    # Setup Test Primary Customer
    user_email = f"realtest_{int(timezone.now().timestamp())}@biz499.com"
    customer = User.objects.create_user(
        email=user_email,
        password="RealPassword123!",
        first_name="Rajesh",
        last_name="Sharma",
        phone="+919876511111",
        role=RoleChoices.CUSTOMER,
        is_verified=True,
    )
    profile, _ = CustomerProfile.objects.get_or_create(
        user=customer,
        defaults={"business_name": "Sharma Textiles", "referral_code": f"REF-{int(timezone.now().timestamp())}"},
    )
    profile.business_name = "Sharma Textiles"
    profile.save()
    client.force_authenticate(user=customer)

    # -------------------------------------------------------------
    # 1. Project Requirements: Save Draft, upload logo, submit
    # -------------------------------------------------------------
    print("\n--- 1. Testing Project Requirements Portal ---")
    order = Order.objects.create(
        order_number=f"ORD-RT-{int(timezone.now().timestamp())}",
        customer=customer,
        status=OrderStatusChoices.IN_PROGRESS,
        payment_status=PaymentStatusChoices.PAID,
        subtotal=Decimal("499.00"),
        total_amount=Decimal("588.82"),
    )
    project = Project.objects.create(
        order=order,
        customer=customer,
        title="Sharma Textiles Online Store",
        status=ProjectStatusChoices.AWAITING_REQUIREMENTS,
        staging_url="https://sharmatextiles-staging.biz499.site",
        progress_percentage=10,
    )

    # 1a. Save Draft
    draft_res = client.post(
        f"/api/v1/projects/{project.id}/requirements/",
        {
            "action": "save",
            "business_name": "Sharma Textiles Mumbai",
            "tagline": "Pure Cotton & Silk Fabrics",
            "about_business": "Wholesale and retail textile merchants in Kalbadevi since 1985.",
            "preferred_colors": "Emerald Green, Royal Navy, Gold",
        },
        format="json",
    )
    assert draft_res.status_code == 200, f"Draft failed: {draft_res.data}"
    req_db = ProjectRequirement.objects.get(project=project)
    assert req_db.status == RequirementStatusChoices.DRAFT
    assert req_db.business_name == "Sharma Textiles Mumbai"
    print("  [PASS] Save Draft: Stored with status DRAFT in ProjectRequirement.")

    # 1b. Upload Logo Asset
    dummy_image = SimpleUploadedFile("logo.png", b"fake_png_data_content_for_biz499", content_type="image/png")
    upload_res = client.post(
        f"/api/v1/projects/{project.id}/upload-asset/",
        {"file": dummy_image, "title": "Brand Primary Logo", "file_type": "DESIGN"},
        format="multipart",
    )
    assert upload_res.status_code == 201, f"Upload failed: {upload_res.data}"
    file_db = ProjectFile.objects.filter(project=project, title="Brand Primary Logo").first()
    assert file_db is not None
    assert file_db.is_client_visible is True
    print(f"  [PASS] Upload Logo: ProjectFile persisted (ID: {file_db.id}) with client visibility.")

    # 1c. Submit Requirements
    submit_res = client.post(
        f"/api/v1/projects/{project.id}/requirements/",
        {
            "action": "submit",
            "business_name": "Sharma Textiles Mumbai",
            "tagline": "Pure Cotton & Silk Fabrics",
            "about_business": "Wholesale and retail textile merchants in Kalbadevi since 1985.",
            "services_offered": "Fabric supply, custom stitching, pan-India courier delivery",
            "target_audience": "Boutique designers, wedding planners, retail consumers",
            "has_own_domain": True,
            "domain_name": "sharmatextiles.in",
            "contact_email": "contact@sharmatextiles.in",
            "contact_phone": "+919876511111",
            "whatsapp_number": "+919876511111",
        },
        format="json",
    )
    assert submit_res.status_code == 200, f"Submit failed: {submit_res.data}"
    req_db.refresh_from_db()
    project.refresh_from_db()
    assert req_db.status == RequirementStatusChoices.SUBMITTED
    assert req_db.submitted_at is not None
    assert project.status == ProjectStatusChoices.PLANNING
    print("  [PASS] Submit Requirements: Status SUBMITTED, project transitioned to PLANNING.")

    # -------------------------------------------------------------
    # 2. Website Preview: Staging URL, Revisions, Final Approval
    # -------------------------------------------------------------
    print("\n--- 2. Testing Website Preview & Approval Workflow ---")
    assert project.staging_url == "https://sharmatextiles-staging.biz499.site"
    print(f"  [PASS] Staging URL verified: {project.staging_url}")

    # 2a. Request Revision
    rev_res = client.post(
        f"/api/v1/projects/{project.id}/request-revision/",
        {
            "title": "Header Color Adjustment",
            "description": "Please adjust the top navigation background to executive dark emerald #082D23.",
        },
        format="json",
    )
    assert rev_res.status_code == 201, f"Revision request failed: {rev_res.data}"
    rev_db = RevisionRequest.objects.get(project=project, title="Header Color Adjustment")
    project.refresh_from_db()
    assert project.status == ProjectStatusChoices.REVISIONS
    print(f"  [PASS] Request Revision: Revision #{rev_db.id} created, project set to REVISIONS.")

    # 2b. Final Approval Sign-Off
    approve_res = client.post(
        f"/api/v1/projects/{project.id}/approve/",
        {"approval_type": "FINAL_DELIVERY_SIGN_OFF", "comments": "Approved for production launch."},
        format="json",
    )
    assert approve_res.status_code == 201, f"Approval failed: {approve_res.data}"
    app_db = CustomerApproval.objects.get(project=project)
    project.refresh_from_db()
    assert project.status == ProjectStatusChoices.COMPLETED
    assert project.progress_percentage == 100
    assert project.actual_delivery_date is not None
    print("  [PASS] Final Approval: CustomerApproval recorded, project marked COMPLETED (100%).")

    # -------------------------------------------------------------
    # 3. Support Center: Close and Reopen Ticket
    # -------------------------------------------------------------
    print("\n--- 3. Testing Customer Support Center ---")
    ticket = SupportTicket.objects.create(
        customer=customer,
        project=project,
        order=order,
        subject="DNS Mapping Query for sharmatextiles.in",
        category=TicketCategoryChoices.TECHNICAL,
        priority=TicketPriorityChoices.HIGH,
        status=TicketStatusChoices.OPEN,
    )
    SupportMessage.objects.create(
        ticket=ticket,
        sender=customer,
        message="Please provide the A record IP address to point our domain registrar DNS.",
    )
    print(f"  [PASS] Ticket {ticket.ticket_number} created with status OPEN.")

    # 3a. Close Ticket
    close_res = client.post(f"/api/v1/support/{ticket.id}/close/")
    assert close_res.status_code == 200
    ticket.refresh_from_db()
    assert ticket.status == TicketStatusChoices.CLOSED
    print("  [PASS] Ticket Closure: Successfully closed via /close/ action.")

    # 3b. Reopen Ticket
    reopen_res = client.post(f"/api/v1/support/{ticket.id}/reopen/")
    assert reopen_res.status_code == 200
    ticket.refresh_from_db()
    assert ticket.status == TicketStatusChoices.IN_PROGRESS
    print("  [PASS] Ticket Reopen: Successfully reopened to IN_PROGRESS.")

    # -------------------------------------------------------------
    # 4. Domain & Hosting: Fetch & Request Renewal
    # -------------------------------------------------------------
    print("\n--- 4. Testing Domain & Hosting Management ---")
    hosting_get = client.get(f"/api/v1/projects/{project.id}/domain-hosting/")
    assert hosting_get.status_code == 200
    hosting_data = hosting_get.data
    assert hosting_data["ssl_status"] == "ACTIVE"
    assert hosting_data["hosting_plan"] == "Pro Business Cloud SSD"
    print(f"  [PASS] Domain Hosting: SSL {hosting_data['ssl_status']}, Plan: {hosting_data['hosting_plan']}.")

    renewal_res = client.post(
        f"/api/v1/projects/{project.id}/domain-hosting/",
        {"action": "request_renewal", "notes": "Customer requested 1-year annual extension."},
        format="json",
    )
    assert renewal_res.status_code == 200
    hosting_db = ProjectDomainHosting.objects.get(project=project)
    assert hosting_db.renewal_status == "RENEWAL_REQUESTED"
    print("  [PASS] Renewal Request: Status RENEWAL_REQUESTED persisted in database.")

    # -------------------------------------------------------------
    # 5. Referrals & Rewards System
    # -------------------------------------------------------------
    print("\n--- 5. Testing Referrals & Rewards System ---")
    ref_code = profile.referral_code
    ref_dash_before = client.get("/api/v1/auth/referrals/")
    assert ref_dash_before.status_code == 200
    assert ref_dash_before.data["referral_code"] == ref_code
    assert ref_dash_before.data["total_invited"] == 0
    print(f"  [PASS] Customer Referral Code verified: {ref_code} (0 invited).")

    # 5a. Friend registers with code
    client.logout()
    friend_email = f"friend_{int(timezone.now().timestamp())}@biz499.com"
    friend_reg = client.post(
        "/api/v1/auth/register/",
        {
            "email": friend_email,
            "password": "FriendPassword123!",
            "first_name": "Amit",
            "last_name": "Patel",
            "phone": "+919876522222",
            "business_name": "Patel Trading Co",
            "referred_by": ref_code,
        },
        format="json",
    )
    assert friend_reg.status_code == 201, f"Registration failed: {friend_reg.data}"
    friend_user = User.objects.get(email=friend_email)
    ref_entry = Referral.objects.get(referred_user=friend_user)
    assert ref_entry.referrer == customer
    assert ref_entry.status == "REGISTERED"
    print("  [PASS] Referral Tracking: Referral record created linking referrer and referee (Status: REGISTERED).")

    # 5b. Eligibility Check: Reward NOT granted yet because friend hasn't placed paid order
    client.force_authenticate(user=customer)
    dash_unpaid = client.get("/api/v1/auth/referrals/")
    assert dash_unpaid.data["total_invited"] == 1
    assert dash_unpaid.data["successful_referrals"] == 0
    assert dash_unpaid.data["earned_rewards"] == "0"
    print("  [PASS] Eligibility Verification: ₹500 reward withheld prior to paid order completion.")

    # 5c. Friend completes paid order (qualifying action)
    friend_order = Order.objects.create(
        order_number=f"ORD-FR-{int(timezone.now().timestamp())}",
        customer=friend_user,
        status=OrderStatusChoices.PENDING_PAYMENT,
        payment_status=PaymentStatusChoices.UNPAID,
        subtotal=Decimal("499.00"),
        total_amount=Decimal("588.82"),
        balance_due=Decimal("588.82"),
    )
    payment = Payment.objects.create(
        transaction_id=f"TXN-FR-{int(timezone.now().timestamp())}",
        order=friend_order,
        customer=friend_user,
        amount=Decimal("588.82"),
        status=PayStatus.INITIATED,
        gateway_order_id=f"order_gw_{int(timezone.now().timestamp())}",
    )
    PaymentGatewayService.reconcile_successful_payment(
        payment=payment,
        gateway_payment_id="pay_gw_friend_01",
        gateway_signature="sig_gw_friend_01",
    )

    # 5d. Verification: Reward now granted!
    ref_entry.refresh_from_db()
    assert ref_entry.status == "REWARDED"
    assert ref_entry.rewarded_at is not None
    dash_rewarded = client.get("/api/v1/auth/referrals/")
    assert dash_rewarded.data["successful_referrals"] == 1
    assert dash_rewarded.data["earned_rewards"] == "500.00"
    print("  [PASS] Reward Granted: Status REWARDED, ₹500 credit verified in customer referral dashboard.")

    # -------------------------------------------------------------
    # 6. My Services & Renewals
    # -------------------------------------------------------------
    print("\n--- 6. Testing My Services & Renewals ---")
    services_res = client.get("/api/v1/services/my-services/")
    assert services_res.status_code == 200
    services_list = services_res.data
    assert len(services_list) >= 1
    srv = next(s for s in services_list if s["order_number"] == order.order_number)
    assert srv["title"] == "Sharma Textiles Online Store"
    assert srv["status"] == "ACTIVE"
    assert srv["renewal_date"] is not None
    print(f"  [PASS] My Services: Found {len(services_list)} active service(s). Status: {srv['status']}, Renewal: {srv['renewal_date']}.")

    # -------------------------------------------------------------
    # 7. Reviews: Ownership, Eligibility, Duplicate Prevention
    # -------------------------------------------------------------
    print("\n--- 7. Testing Reviews & Customer Feedback ---")
    rev_url = f"/api/v1/projects/{project.id}/review/"

    # 7a. Ownership check: Unrelated user cannot review Rajesh's project
    client.logout()
    stranger = User.objects.create_user(email="stranger@biz499.com", password="Password123!")
    client.force_authenticate(user=stranger)
    unauth_review = client.post(rev_url, {"rating": 5, "feedback": "Great work!"}, format="json")
    assert unauth_review.status_code == 404, f"Expected 404 for stranger, got {unauth_review.status_code}"
    print("  [PASS] Review Ownership: Strangers receive 404 Not Found.")

    # 7b. Eligibility check on early stage project
    client.force_authenticate(user=customer)
    early_order = Order.objects.create(
        order_number=f"ORD-EARLY-{int(timezone.now().timestamp())}",
        customer=customer,
        status=OrderStatusChoices.IN_PROGRESS,
        payment_status=PaymentStatusChoices.PAID,
        subtotal=Decimal("499.00"),
        total_amount=Decimal("588.82"),
    )
    early_project = Project.objects.create(
        order=early_order,
        customer=customer,
        title="Early Phase Project",
        status=ProjectStatusChoices.AWAITING_REQUIREMENTS,
    )
    early_res = client.post(f"/api/v1/projects/{early_project.id}/review/", {"rating": 5, "feedback": "Nice!"}, format="json")
    assert early_res.status_code == 400
    assert "not eligible" in early_res.data["error"]
    print("  [PASS] Review Eligibility: Premature reviews blocked on awaiting requirements project.")

    # 7c. Submit valid review on completed project
    review_payload = {
        "rating": 5,
        "headline": "Superb Craftsmanship & Speed!",
        "feedback": "Biz499 built our wholesale fabric catalog in record time. Our clients love the clean design.",
        "testimonial_permission": True,
    }
    review_res = client.post(rev_url, review_payload, format="json")
    assert review_res.status_code == 200, f"Review failed: {review_res.data}"
    review_db = ProjectReview.objects.get(project=project)
    assert review_db.rating == 5
    assert review_db.testimonial_permission is True
    print(f"  [PASS] Review Submission: 5-star review saved in ProjectReview (ID: {review_db.id}).")

    # 7d. Duplicate Prevention: Attempt duplicate submission without update flag
    dup_review = client.post(rev_url, review_payload, format="json")
    assert dup_review.status_code == 400
    assert "Duplicate reviews are not permitted" in dup_review.data["error"]
    print("  [PASS] Duplicate Prevention: Second review rejected with 400 Bad Request.")

    print("\n" + "=" * 70)
    print("ALL 7 DIGITAL SERVICES WORKFLOWS FULLY VERIFIED AND PASSING!")
    print("=" * 70)

if __name__ == "__main__":
    run_real_verification()

from decimal import Decimal
from django.db.models import Sum, Count, Q
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from apps.authentication.permissions import IsStaffOrAdmin
from apps.authentication.models import User, RoleChoices
from apps.leads.models import Lead, LeadStatusChoices
from apps.orders.models import Order, OrderStatusChoices, PaymentStatusChoices
from apps.payments.models import Payment, PaymentStatusChoices as PayStatus
from apps.projects.models import Project, ProjectStatusChoices, Task, TaskStatusChoices
from apps.quotations.models import Quote, QuoteStatusChoices
from apps.invoices.models import Invoice

@extend_schema(tags=["Executive Analytics & Reporting"])
class AdminDashboardMetricsView(APIView):
    permission_classes = [IsStaffOrAdmin]

    def get(self, request):
        now = timezone.now()

        # Lead funnel metrics
        total_leads = Lead.objects.count()
        new_leads = Lead.objects.filter(status=LeadStatusChoices.NEW).count()
        qualified_leads = Lead.objects.filter(status=LeadStatusChoices.QUALIFIED).count()
        won_leads = Lead.objects.filter(status=LeadStatusChoices.WON).count()
        lost_leads = Lead.objects.filter(status=LeadStatusChoices.LOST).count()

        conversion_rate = round((won_leads / total_leads * 100), 1) if total_leads > 0 else 0.0

        # Customer & User metrics
        active_customers = User.objects.filter(role=RoleChoices.CUSTOMER, is_active=True).count()

        # Order & Revenue metrics
        total_orders = Order.objects.count()
        open_orders = Order.objects.filter(status__in=[OrderStatusChoices.PENDING_PAYMENT, OrderStatusChoices.CONFIRMED, OrderStatusChoices.IN_PROGRESS]).count()

        bookings_sum = Order.objects.exclude(status=OrderStatusChoices.CANCELLED).aggregate(total=Sum("total_amount"))["total"] or Decimal("0.00")
        collected_sum = Payment.objects.filter(status=PayStatus.CAPTURED).aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
        invoiced_sum = Invoice.objects.aggregate(total=Sum("total_amount"))["total"] or Decimal("0.00")
        outstanding_sum = Order.objects.exclude(status=OrderStatusChoices.CANCELLED).aggregate(total=Sum("balance_due"))["total"] or Decimal("0.00")

        # Project health metrics
        active_projects = Project.objects.exclude(status__in=[ProjectStatusChoices.COMPLETED, ProjectStatusChoices.CANCELLED]).count()
        completed_projects = Project.objects.filter(status=ProjectStatusChoices.COMPLETED).count()
        overdue_tasks = Task.objects.filter(due_date__lt=now.date()).exclude(status=TaskStatusChoices.DONE).count()

        # Quotations & Invoices metrics
        pending_quotes = Quote.objects.filter(status__in=[QuoteStatusChoices.DRAFT, QuoteStatusChoices.SENT]).count()

        # Recent activities / sales list
        recent_orders = [
            {
                "id": str(o.id),
                "order_number": o.order_number,
                "customer": o.customer.full_name,
                "amount": str(o.total_amount),
                "status": o.status,
                "payment_status": o.payment_status,
                "date": o.created_at.strftime("%Y-%m-%d %H:%M"),
            }
            for o in Order.objects.select_related("customer").order_by("-created_at")[:5]
        ]

        recent_leads = [
            {
                "id": str(l.id),
                "reference_id": l.reference_id,
                "name": l.full_name,
                "phone": l.phone,
                "company": l.company_name,
                "status": l.status,
                "created_at": l.created_at.strftime("%Y-%m-%d"),
            }
            for l in Lead.objects.order_by("-created_at")[:5]
        ]

        return Response({
            "overview": {
                "total_leads": total_leads,
                "new_leads": new_leads,
                "qualified_leads": qualified_leads,
                "won_leads": won_leads,
                "conversion_rate_percent": conversion_rate,
                "active_customers": active_customers,
                "total_orders": total_orders,
                "open_orders": open_orders,
                "active_projects": active_projects,
                "completed_projects": completed_projects,
                "overdue_tasks": overdue_tasks,
                "pending_quotes": pending_quotes,
            },
            "financials": {
                "currency": "INR",
                "total_bookings": str(bookings_sum),
                "payments_collected": str(collected_sum),
                "invoiced_amount": str(invoiced_sum),
                "outstanding_balance": str(outstanding_sum),
            },
            "recent_orders": recent_orders,
            "recent_leads": recent_leads,
        })


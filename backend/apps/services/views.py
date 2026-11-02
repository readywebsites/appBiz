from rest_framework import viewsets, permissions, filters, views
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from apps.authentication.permissions import IsAdminUser
from .models import (
    ServiceCategory,
    Service,
    ServicePackage,
    PackageAddOn,
    PortfolioItem,
    Testimonial,
    PromotionalBanner,
)
from .serializers import (
    ServiceCategorySerializer,
    ServiceListSerializer,
    ServiceDetailSerializer,
    ServicePackageSerializer,
    PackageAddOnSerializer,
    PortfolioItemSerializer,
    TestimonialSerializer,
    PromotionalBannerSerializer,
)

class ReadOnlyOrAdminPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return IsAdminUser().has_permission(request, view)

@extend_schema(tags=["Service Catalog"])
class ServiceCategoryViewSet(viewsets.ModelViewSet):
    queryset = ServiceCategory.objects.filter(is_active=True).order_by("display_order")
    serializer_class = ServiceCategorySerializer
    permission_classes = [ReadOnlyOrAdminPermission]
    lookup_field = "slug"

    def get_queryset(self):
        if self.request.user and self.request.user.is_authenticated and self.request.user.is_staff:
            return ServiceCategory.objects.all().order_by("display_order")
        return super().get_queryset()

@extend_schema(tags=["Service Catalog"])
class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.filter(is_active=True).select_related("category").prefetch_related("packages__features", "add_ons").order_by("display_order")
    permission_classes = [ReadOnlyOrAdminPermission]
    lookup_field = "slug"
    filter_backends = [filters.SearchFilter]
    search_fields = ["title", "short_description", "full_description", "category__name"]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ServiceDetailSerializer
        return ServiceListSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        category_slug = self.request.query_params.get("category")
        is_featured = self.request.query_params.get("featured")

        if category_slug:
            qs = qs.filter(category__slug=category_slug)
        if is_featured:
            qs = qs.filter(is_featured=is_featured.lower() in ("true", "1"))
        return qs

@extend_schema(tags=["Service Packages"])
class ServicePackageViewSet(viewsets.ModelViewSet):
    queryset = ServicePackage.objects.filter(is_active=True).prefetch_related("features").order_by("display_order")
    serializer_class = ServicePackageSerializer
    permission_classes = [ReadOnlyOrAdminPermission]

    def get_queryset(self):
        qs = super().get_queryset()
        service_id = self.request.query_params.get("service_id")
        if service_id:
            qs = qs.filter(service_id=service_id)
        return qs

@extend_schema(tags=["Service Catalog"])
class PackageAddOnViewSet(viewsets.ModelViewSet):
    queryset = PackageAddOn.objects.filter(is_active=True).order_by("display_order")
    serializer_class = PackageAddOnSerializer
    permission_classes = [ReadOnlyOrAdminPermission]

    def get_queryset(self):
        qs = super().get_queryset()
        service_id = self.request.query_params.get("service_id")
        if service_id:
            qs = qs.filter(service_id=service_id)
        return qs

@extend_schema(tags=["Portfolio & Showcase"])
class PortfolioItemViewSet(viewsets.ModelViewSet):
    queryset = PortfolioItem.objects.all().order_by("display_order", "-created_at")
    serializer_class = PortfolioItemSerializer
    permission_classes = [ReadOnlyOrAdminPermission]

    def get_queryset(self):
        qs = super().get_queryset()
        category = self.request.query_params.get("category")
        featured = self.request.query_params.get("featured")
        if category:
            qs = qs.filter(category__slug=category)
        if featured:
            qs = qs.filter(is_featured=featured.lower() in ("true", "1"))
        return qs

@extend_schema(tags=["Social Proof & Testimonials"])
class TestimonialViewSet(viewsets.ModelViewSet):
    queryset = Testimonial.objects.filter(is_verified=True).order_by("-is_featured", "-created_at")
    serializer_class = TestimonialSerializer
    permission_classes = [ReadOnlyOrAdminPermission]

@extend_schema(tags=["Promotions"])
class PromotionalBannerViewSet(viewsets.ModelViewSet):
    queryset = PromotionalBanner.objects.filter(is_active=True).order_by("display_order")
    serializer_class = PromotionalBannerSerializer
    permission_classes = [ReadOnlyOrAdminPermission]

@extend_schema(tags=["Service Catalog"])
class MyServicesView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        from apps.orders.models import Order
        from django.utils import timezone

        orders = Order.objects.filter(customer=user).prefetch_related(
            "items__package__service__category",
            "project__domain_hosting"
        ).order_by("-created_at")

        services_list = []
        for o in orders:
            proj = getattr(o, "project", None)
            dh = getattr(proj, "domain_hosting", None) if proj else None

            first_item = o.items.first()
            package = first_item.package if first_item else None
            service_obj = package.service if package else None

            title = first_item.title if first_item else (proj.title if proj else "Website Development Service")
            category_name = service_obj.category.name if (service_obj and service_obj.category) else "Digital Solutions"

            if o.status == "COMPLETED" or (proj and proj.status == "COMPLETED"):
                status_code = "ACTIVE"
            elif o.status == "CANCELLED":
                status_code = "CANCELLED"
            elif o.payment_status == "UNPAID":
                status_code = "PENDING_PAYMENT"
            else:
                status_code = "IN_PROGRESS"

            renewal_date = dh.domain_expires_at if (dh and dh.domain_expires_at) else (o.created_at.date() + timezone.timedelta(days=365))
            days_to_renewal = (renewal_date - timezone.now().date()).days if renewal_date else 365
            if status_code == "ACTIVE" and days_to_renewal <= 30:
                status_code = "RENEWAL_DUE"

            services_list.append({
                "id": str(o.id),
                "order_number": o.order_number,
                "project_id": str(proj.id) if proj else None,
                "title": title,
                "category": category_name,
                "package_name": package.name if package else "Custom Tier",
                "billing_type": package.billing_type if package else "ONE_TIME",
                "status": status_code,
                "payment_status": o.payment_status,
                "amount_paid": str(o.amount_paid),
                "total_amount": str(o.total_amount),
                "purchased_at": o.created_at.date().isoformat(),
                "renewal_date": renewal_date.isoformat() if renewal_date else None,
                "days_to_renewal": days_to_renewal,
                "renewal_price": str(dh.annual_renewal_price) if dh else "1499.00",
                "domain_name": dh.domain_name if dh else (proj.live_url if proj else None),
                "ssl_status": dh.ssl_status if dh else "ACTIVE",
                "hosting_plan": dh.hosting_plan if dh else "Pro Business Cloud SSD",
                "live_url": proj.live_url if proj else None,
                "staging_url": proj.staging_url if proj else None,
                "progress_percentage": proj.progress_percentage if proj else 0,
            })

        return Response(services_list)



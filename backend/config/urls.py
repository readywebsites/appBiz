from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

def health_check(request):
    return JsonResponse({
        "status": "healthy",
        "service": "Biz499 API",
        "version": "1.0.0",
        "environment": "production" if not settings.DEBUG else "development",
    })

def root_index(request):
    return JsonResponse({
        "service": "Biz499 Digital Services Platform API",
        "status": "online",
        "version": "1.0.0",
        "swagger_docs": "/api/docs/",
        "redoc": "/api/redoc/",
        "health_check": "/api/v1/health/",
        "django_admin": "/django-admin/",
        "web_admin_url": "http://localhost:5173",
    })

urlpatterns = [
    # Root
    path("", root_index, name="root-index"),

    # Admin
    path("django-admin/", admin.site.urls),

    # Health check
    path("api/v1/health/", health_check, name="api-health"),

    # OpenAPI 3 Documentation
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),

    # API v1 routes
    path("api/v1/auth/", include("apps.authentication.urls")),
    path("api/v1/services/", include("apps.services.urls")),
    path("api/v1/leads/", include("apps.leads.urls")),
    path("api/v1/quotations/", include("apps.quotations.urls")),
    path("api/v1/orders/", include("apps.orders.urls")),
    path("api/v1/payments/", include("apps.payments.urls")),
    path("api/v1/invoices/", include("apps.invoices.urls")),
    path("api/v1/projects/", include("apps.projects.urls")),
    path("api/v1/notifications/", include("apps.notifications.urls")),
    path("api/v1/support/", include("apps.support.urls")),
    path("api/v1/audit/", include("apps.audit.urls")),
    path("api/v1/analytics/", include("apps.analytics.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)


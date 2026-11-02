from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LeadPublicCreateView,
    LeadViewSet,
    ConsultationViewSet,
)

router = DefaultRouter()
router.register(r"manage", LeadViewSet, basename="leads-crm")
router.register(r"consultations", ConsultationViewSet, basename="consultations")

urlpatterns = [
    path("submit-enquiry/", LeadPublicCreateView.as_view(), name="lead-submit-enquiry"),
    path("", include(router.urls)),
]


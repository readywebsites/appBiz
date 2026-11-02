from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet, DeviceRegistrationViewSet

router = DefaultRouter()
router.register(r"devices", DeviceRegistrationViewSet, basename="devices")
router.register(r"", NotificationViewSet, basename="notifications")

urlpatterns = [
    path("", include(router.urls)),
]


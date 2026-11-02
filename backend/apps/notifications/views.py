from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from .models import Notification, DeviceRegistration
from .serializers import NotificationSerializer, DeviceRegistrationSerializer

@extend_schema(tags=["Notifications"])
class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by("-created_at")

    @action(detail=True, methods=["post"], url_path="read")
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.mark_as_read()
        return Response({"status": "marked as read"})

    @action(detail=False, methods=["post"], url_path="mark-all-read")
    def mark_all_read(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True, read_at=timezone.now())
        return Response({"status": "all marked as read"})

    @action(detail=False, methods=["get"], url_path="unread-count")
    def unread_count(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({"unread_count": count})

@extend_schema(tags=["Push Notifications Registration"])
class DeviceRegistrationViewSet(viewsets.ModelViewSet):
    serializer_class = DeviceRegistrationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return DeviceRegistration.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        token = serializer.validated_data["push_token"]
        DeviceRegistration.objects.filter(push_token=token).delete()
        serializer.save(user=self.request.user)


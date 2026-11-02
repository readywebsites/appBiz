from rest_framework import viewsets, filters
from drf_spectacular.utils import extend_schema
from apps.authentication.permissions import IsAdminUser
from .models import AuditLog
from .serializers import AuditLogSerializer

@extend_schema(tags=["Security & Compliance Audit"])
class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all().select_related("actor").order_by("-timestamp")
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter]
    search_fields = ["action", "target_model", "target_id", "actor__email", "change_summary"]

    def get_queryset(self):
        qs = super().get_queryset()
        action = self.request.query_params.get("action")
        target_model = self.request.query_params.get("model")
        if action:
            qs = qs.filter(action=action)
        if target_model:
            qs = qs.filter(target_model=target_model)
        return qs


from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, TaskViewSet, ProjectFileViewSet

router = DefaultRouter()
router.register(r"tasks", TaskViewSet, basename="tasks")
router.register(r"files", ProjectFileViewSet, basename="project-files")
router.register(r"", ProjectViewSet, basename="projects")

urlpatterns = [
    path("", include(router.urls)),
]


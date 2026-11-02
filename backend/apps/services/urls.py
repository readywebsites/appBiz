from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ServiceCategoryViewSet,
    ServiceViewSet,
    ServicePackageViewSet,
    PackageAddOnViewSet,
    PortfolioItemViewSet,
    TestimonialViewSet,
    PromotionalBannerViewSet,
    MyServicesView,
)

router = DefaultRouter()
router.register(r"categories", ServiceCategoryViewSet, basename="service-categories")
router.register(r"items", ServiceViewSet, basename="services")
router.register(r"packages", ServicePackageViewSet, basename="service-packages")
router.register(r"add-ons", PackageAddOnViewSet, basename="service-addons")
router.register(r"portfolio", PortfolioItemViewSet, basename="portfolio")
router.register(r"testimonials", TestimonialViewSet, basename="testimonials")
router.register(r"banners", PromotionalBannerViewSet, basename="banners")

urlpatterns = [
    path("my-services/", MyServicesView.as_view(), name="my-services"),
    path("", include(router.urls)),
]


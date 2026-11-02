from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet, CouponViewSet

router = DefaultRouter()
router.register(r"coupons", CouponViewSet, basename="coupons")
router.register(r"", OrderViewSet, basename="orders")

urlpatterns = [
    path("", include(router.urls)),
]


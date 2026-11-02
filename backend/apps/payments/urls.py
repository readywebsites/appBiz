from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentViewSet, RazorpayWebhookView

router = DefaultRouter()
router.register(r"", PaymentViewSet, basename="payments")

urlpatterns = [
    path("webhook/razorpay/", RazorpayWebhookView.as_view(), name="payment-webhook-razorpay"),
    path("", include(router.urls)),
]


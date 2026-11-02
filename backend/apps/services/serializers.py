from rest_framework import serializers
from .models import (
    ServiceCategory,
    Service,
    ServicePackage,
    PackageFeature,
    PackageAddOn,
    PortfolioItem,
    Testimonial,
    PromotionalBanner,
)

class PackageFeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = PackageFeature
        fields = ["id", "title", "is_included", "display_order"]

class PackageAddOnSerializer(serializers.ModelSerializer):
    class Meta:
        model = PackageAddOn
        fields = ["id", "service", "name", "description", "price", "currency", "is_active", "display_order"]

class ServicePackageSerializer(serializers.ModelSerializer):
    features = PackageFeatureSerializer(many=True, read_only=True)

    class Meta:
        model = ServicePackage
        fields = [
            "id",
            "service",
            "name",
            "slug",
            "tagline",
            "price",
            "original_price",
            "currency",
            "billing_type",
            "delivery_days",
            "is_popular",
            "is_active",
            "display_order",
            "features",
        ]

class ServiceListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    packages_count = serializers.IntegerField(source="packages.count", read_only=True)

    class Meta:
        model = Service
        fields = [
            "id",
            "category",
            "category_name",
            "title",
            "slug",
            "short_description",
            "icon",
            "image_url",
            "starting_price",
            "currency",
            "is_featured",
            "is_active",
            "display_order",
            "packages_count",
        ]

class ServiceDetailSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    packages = ServicePackageSerializer(many=True, read_only=True)
    add_ons = PackageAddOnSerializer(many=True, read_only=True)

    class Meta:
        model = Service
        fields = [
            "id",
            "category",
            "category_name",
            "title",
            "slug",
            "short_description",
            "full_description",
            "icon",
            "image_url",
            "starting_price",
            "currency",
            "is_featured",
            "is_active",
            "display_order",
            "packages",
            "add_ons",
        ]

class ServiceCategorySerializer(serializers.ModelSerializer):
    services_count = serializers.IntegerField(source="services.count", read_only=True)

    class Meta:
        model = ServiceCategory
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "icon",
            "display_order",
            "is_active",
            "services_count",
        ]

class PortfolioItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = PortfolioItem
        fields = [
            "id",
            "category",
            "category_name",
            "title",
            "client_name",
            "industry",
            "description",
            "live_url",
            "thumbnail_url",
            "tags",
            "is_featured",
            "display_order",
            "created_at",
        ]

class TestimonialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Testimonial
        fields = [
            "id",
            "client_name",
            "business_name",
            "designation",
            "rating",
            "feedback",
            "avatar_url",
            "is_verified",
            "is_featured",
        ]

class PromotionalBannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromotionalBanner
        fields = [
            "id",
            "title",
            "subtitle",
            "badge",
            "image_url",
            "cta_text",
            "cta_action",
            "is_active",
            "display_order",
        ]


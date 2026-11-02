import uuid
from decimal import Decimal
from django.db import models
from django.utils.text import slugify

class ServiceCategory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150, unique=True)
    slug = models.SlugField(max_length=160, unique=True, blank=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True, help_text="Lucide or Expo icon name")
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Service Category"
        verbose_name_plural = "Service Categories"
        ordering = ["display_order", "name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class Service(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category = models.ForeignKey(ServiceCategory, on_delete=models.CASCADE, related_name="services")
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    short_description = models.CharField(max_length=300)
    full_description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)
    image_url = models.URLField(max_length=500, blank=True)
    starting_price = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("499.00"))
    currency = models.CharField(max_length=10, default="INR")
    is_featured = models.BooleanField(default=False, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)
    display_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Service"
        verbose_name_plural = "Services"
        ordering = ["display_order", "title"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} ({self.category.name})"

class BillingTypeChoices(models.TextChoices):
    ONE_TIME = "ONE_TIME", "One Time"
    MONTHLY = "MONTHLY", "Monthly Subscription"
    YEARLY = "YEARLY", "Annual Subscription"

class ServicePackage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name="packages")
    name = models.CharField(max_length=120)  # e.g., Starter, Growth, Enterprise
    slug = models.SlugField(max_length=150, blank=True)
    tagline = models.CharField(max_length=250, blank=True)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    original_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, help_text="Strikethrough price for marketing")
    currency = models.CharField(max_length=10, default="INR")
    billing_type = models.CharField(max_length=20, choices=BillingTypeChoices.choices, default=BillingTypeChoices.ONE_TIME)
    delivery_days = models.PositiveIntegerField(default=5, help_text="Estimated turnaround days")
    is_popular = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True, db_index=True)
    display_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Service Package"
        verbose_name_plural = "Service Packages"
        ordering = ["display_order", "price"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(f"{self.service.slug}-{self.name}")
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.service.title} - {self.name} (INR {self.price})"

class PackageFeature(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    package = models.ForeignKey(ServicePackage, on_delete=models.CASCADE, related_name="features")
    title = models.CharField(max_length=200)
    is_included = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["display_order", "id"]

    def __str__(self):
        return f"{self.package.name} - {self.title}"

class PackageAddOn(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name="add_ons")
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=10, default="INR")
    is_active = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["display_order", "price"]

    def __str__(self):
        return f"{self.name} (+INR {self.price})"

class PortfolioItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category = models.ForeignKey(ServiceCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name="portfolio_items")
    title = models.CharField(max_length=200)
    client_name = models.CharField(max_length=150, blank=True)
    industry = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    live_url = models.URLField(max_length=500, blank=True)
    thumbnail_url = models.URLField(max_length=500)
    tags = models.CharField(max_length=255, blank=True, help_text="Comma-separated tags")
    is_featured = models.BooleanField(default=False, db_index=True)
    display_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["display_order", "-created_at"]

    def __str__(self):
        return self.title

class Testimonial(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client_name = models.CharField(max_length=150)
    business_name = models.CharField(max_length=150, blank=True)
    designation = models.CharField(max_length=100, blank=True)
    rating = models.PositiveSmallIntegerField(default=5)
    feedback = models.TextField()
    avatar_url = models.URLField(max_length=500, blank=True)
    is_verified = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-is_featured", "-created_at"]

    def __str__(self):
        return f"{self.client_name} - {self.business_name} ({self.rating}★)"

class PromotionalBanner(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    subtitle = models.CharField(max_length=300, blank=True)
    badge = models.CharField(max_length=50, blank=True, default="Limited Offer")
    image_url = models.URLField(max_length=500, blank=True)
    cta_text = models.CharField(max_length=50, default="Claim Now")
    cta_action = models.CharField(max_length=100, default="packages")  # deep link or route
    is_active = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["display_order", "-created_at"]

    def __str__(self):
        return self.title

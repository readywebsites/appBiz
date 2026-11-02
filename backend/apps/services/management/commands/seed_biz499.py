from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.authentication.models import User, CustomerProfile, RoleChoices
from apps.services.models import (
    ServiceCategory,
    Service,
    ServicePackage,
    PackageFeature,
    PackageAddOn,
    PortfolioItem,
    Testimonial,
    PromotionalBanner,
    BillingTypeChoices,
)
from apps.orders.models import Coupon, DiscountTypeChoices
from apps.leads.models import Lead, LeadStatusChoices, LeadPriorityChoices
from apps.quotations.models import Quote, QuoteItem, QuoteStatusChoices
from apps.payments.models import Payment
from apps.payments.services import PaymentGatewayService
from apps.orders.models import Order, OrderItem, OrderStatusChoices, PaymentStatusChoices

class Command(BaseCommand):
    help = "Seeds realistic development and demo data for Biz499 platform"

    def handle(self, *args, **options):
        self.stdout.write("Starting Biz499 seed process...")

        # 1. Users
        admin_user, _ = User.objects.get_or_create(
            email="admin@biz499.com",
            defaults={
                "first_name": "Admin",
                "last_name": "Director",
                "role": RoleChoices.SUPER_ADMIN,
                "is_staff": True,
                "is_superuser": True,
                "is_verified": True,
                "phone": "+919876543210",
            },
        )
        admin_user.set_password("Biz499Admin#2026")
        admin_user.save()

        sales_user, _ = User.objects.get_or_create(
            email="sales@biz499.com",
            defaults={
                "first_name": "Rohit",
                "last_name": "Verma",
                "role": RoleChoices.SALES_MANAGER,
                "is_staff": True,
                "is_verified": True,
                "phone": "+919876543211",
            },
        )
        sales_user.set_password("Biz499Sales#2026")
        sales_user.save()

        pm_user, _ = User.objects.get_or_create(
            email="pm@biz499.com",
            defaults={
                "first_name": "Priya",
                "last_name": "Sharma",
                "role": RoleChoices.PROJECT_MANAGER,
                "is_staff": True,
                "is_verified": True,
                "phone": "+919876543212",
            },
        )
        pm_user.set_password("Biz499Project#2026")
        pm_user.save()

        client_user, _ = User.objects.get_or_create(
            email="demo.client@example.com",
            defaults={
                "first_name": "Vikram",
                "last_name": "Mehta",
                "role": RoleChoices.CUSTOMER,
                "is_verified": True,
                "phone": "+919876543213",
            },
        )
        client_user.set_password("Biz499Client#2026")
        client_user.save()

        CustomerProfile.objects.get_or_create(
            user=client_user,
            defaults={
                "business_name": "Apex Retail Solutions",
                "industry": "Retail & E-commerce",
                "address": "402 Crescent Towers, Bandra West",
                "city": "Mumbai",
                "state": "Maharashtra",
                "pincode": "400050",
                "gstin": "27ABCDE1234F1Z5",
                "referral_code": "BIZ-APEX99",
            },
        )

        # 2. Categories
        categories_data = [
            ("Business Websites", "business-websites", "Professional corporate & business digital presence", "briefcase", 1),
            ("E-Commerce Stores", "ecommerce-stores", "High-conversion online shopping stores with checkout", "shopping-bag", 2),
            ("Landing Pages & Funnels", "landing-pages", "Laser-focused lead generation & promotion funnels", "zap", 3),
            ("Website Redesign", "website-redesign", "Upgrade slow, outdated sites into modern powerhouses", "refresh-cw", 4),
            ("Maintenance & SEO", "maintenance-seo", "Monthly speed optimization, security updates & rank boosts", "shield-check", 5),
        ]
        cat_map = {}
        for name, slug, desc, icon, order in categories_data:
            cat, _ = ServiceCategory.objects.get_or_create(
                slug=slug,
                defaults={"name": name, "description": desc, "icon": icon, "display_order": order},
            )
            cat_map[slug] = cat

        # 3. Services & Packages
        # Service 1: Business Website
        biz_service, _ = Service.objects.get_or_create(
            slug="business-website-development",
            defaults={
                "category": cat_map["business-websites"],
                "title": "Business Website Development",
                "short_description": "Custom high-speed website built to convert visitors into paying clients.",
                "full_description": "Get a state-of-the-art modern responsive website crafted for your brand. Includes mobile optimization, fast hosting connection, SSL, WhatsApp chat, and SEO-ready meta tags.",
                "icon": "globe",
                "image_url": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800",
                "starting_price": Decimal("499.00"),
                "is_featured": True,
                "display_order": 1,
            },
        )

        pkg1, _ = ServicePackage.objects.get_or_create(
            slug="business-website-starter",
            service=biz_service,
            defaults={
                "name": "Starter Web Presence",
                "tagline": "Ideal for local businesses, consultants & small firms",
                "price": Decimal("499.00"),
                "original_price": Decimal("2499.00"),
                "billing_type": BillingTypeChoices.ONE_TIME,
                "delivery_days": 3,
                "is_popular": True,
                "display_order": 1,
            },
        )
        for idx, feat in enumerate([
            "1-Page High-Impact Landing Structure",
            "100% Responsive Mobile & Tablet Layout",
            "WhatsApp & Direct Call Button",
            "Free SSL Certificate Setup",
            "Google Maps Integration",
            "Lead Enquiry Form with Instant Alerts",
        ], start=1):
            PackageFeature.objects.get_or_create(package=pkg1, title=feat, defaults={"display_order": idx})

        pkg2, _ = ServicePackage.objects.get_or_create(
            slug="business-website-growth",
            service=biz_service,
            defaults={
                "name": "Growth Corporate Pro",
                "tagline": "Multi-page complete corporate identity",
                "price": Decimal("4999.00"),
                "original_price": Decimal("8999.00"),
                "billing_type": BillingTypeChoices.ONE_TIME,
                "delivery_days": 5,
                "is_popular": False,
                "display_order": 2,
            },
        )
        for idx, feat in enumerate([
            "Up to 5 Custom Branded Pages",
            "Interactive Portfolio & Gallery Section",
            "SEO Meta Structure & Sitemap",
            "Contact Form + CRM Lead Capture",
            "Speed Optimization (< 1.5s load)",
            "1 Month Free Maintenance & Hosting Support",
        ], start=1):
            PackageFeature.objects.get_or_create(package=pkg2, title=feat, defaults={"display_order": idx})

        # Service 2: E-Commerce Store
        ecom_service, _ = Service.objects.get_or_create(
            slug="ecommerce-store-development",
            defaults={
                "category": cat_map["ecommerce-stores"],
                "title": "E-Commerce Online Store",
                "short_description": "Sell products online with cart, payment gateway and order notifications.",
                "full_description": "Full-featured online store ready to take payments. Product catalog, automated order emails, coupon engine, Razorpay/UPI integration, and customer order tracking.",
                "icon": "shopping-cart",
                "image_url": "https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=800",
                "starting_price": Decimal("9999.00"),
                "is_featured": True,
                "display_order": 2,
            },
        )

        pkg_ecom, _ = ServicePackage.objects.get_or_create(
            slug="ecommerce-starter-store",
            service=ecom_service,
            defaults={
                "name": "E-Commerce Launchpad",
                "tagline": "Launch your D2C or retail brand online",
                "price": Decimal("9999.00"),
                "original_price": Decimal("15999.00"),
                "billing_type": BillingTypeChoices.ONE_TIME,
                "delivery_days": 7,
                "is_popular": True,
                "display_order": 1,
            },
        )
        for idx, feat in enumerate([
            "Up to 50 Products Catalog",
            "Razorpay / UPI Payment Gateway",
            "Shopping Cart & Express Checkout",
            "Automated Order Confirmation Invoices",
            "Customer Account & Order History",
            "Admin Inventory Dashboard",
        ], start=1):
            PackageFeature.objects.get_or_create(package=pkg_ecom, title=feat, defaults={"display_order": idx})

        # Add-ons
        addons_data = [
            (biz_service, "Custom Logo & Brand Palette", "Vector logo design with social media avatars", Decimal("999.00")),
            (biz_service, "Razorpay / UPI Checkout Add-on", "Accept online payments on any package", Decimal("1499.00")),
            (biz_service, "Multi-language Support (Hindi + English)", "Bilingual interface for broader audience reach", Decimal("1199.00")),
            (ecom_service, "Automated WhatsApp Order Alerts", "Send tracking and order notifications via WhatsApp", Decimal("1999.00")),
        ]
        for svc, title, desc, price in addons_data:
            PackageAddOn.objects.get_or_create(
                service=svc,
                name=title,
                defaults={"description": desc, "price": price},
            )

        # 4. Promotional Banners
        PromotionalBanner.objects.get_or_create(
            title="Launch Offer: Get Online for just ₹499",
            defaults={
                "subtitle": "Get a lightning-fast responsive website and start getting inquiries today.",
                "badge": "Special Promo",
                "image_url": "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800",
                "cta_text": "Explore Packages",
                "cta_action": "services",
                "display_order": 1,
            },
        )
        PromotionalBanner.objects.get_or_create(
            title="Free Consultation & Website Audit",
            defaults={
                "subtitle": "Book a 1-on-1 strategy call with our senior tech architect.",
                "badge": "Complimentary",
                "image_url": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800",
                "cta_text": "Book Call",
                "cta_action": "consultation",
                "display_order": 2,
            },
        )

        # 5. Portfolio Items
        portfolio_samples = [
            ("Apex Luxury Decor", "Apex Retail", "Interior Design", "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800", "Interior, Decor, E-commerce"),
            ("FitPulse Athletic Club", "FitPulse Gym", "Fitness & Wellness", "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800", "Gym, Fitness, Booking"),
            ("Saffron Spice Bistro", "Saffron Hospitality", "Restaurant & Cafe", "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800", "Restaurant, Menu, Orders"),
            ("Novus Legal Advisory", "Novus Partners", "Legal Services", "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800", "Corporate, Legal, Consult"),
        ]
        for title, client, ind, thumb, tags in portfolio_samples:
            PortfolioItem.objects.get_or_create(
                title=title,
                defaults={
                    "client_name": client,
                    "industry": ind,
                    "thumbnail_url": thumb,
                    "tags": tags,
                    "is_featured": True,
                },
            )

        # 6. Testimonials
        testimonials_samples = [
            ("Rajesh Singhania", "Singhania Logistics", "Managing Director", 5, "Biz499 delivered our corporate website in just 4 days. Inquiries jumped by 140% in our first month!"),
            ("Ananya Deshmukh", "Chic Boutique", "Founder", 5, "The mobile-first design and WhatsApp ordering integration made it effortless for my customers to shop."),
            ("Amitabh Sen", "Sen Dental Clinic", "Chief Doctor", 5, "Exceptional service and transparent pricing. No hidden costs. Highly recommend Biz499 to every business owner."),
        ]
        for name, biz, desig, rating, feedback in testimonials_samples:
            Testimonial.objects.get_or_create(
                client_name=name,
                business_name=biz,
                defaults={"designation": desig, "rating": rating, "feedback": feedback, "is_verified": True, "is_featured": True},
            )

        # 7. Coupons
        Coupon.objects.get_or_create(
            code="BIZ500",
            defaults={
                "description": "Flat ₹500 discount on any website package above ₹2,000",
                "discount_type": DiscountTypeChoices.FIXED,
                "discount_value": Decimal("500.00"),
                "min_order_value": Decimal("2000.00"),
                "max_uses": 200,
                "is_active": True,
            },
        )
        Coupon.objects.get_or_create(
            code="WELCOME10",
            defaults={
                "description": "10% Welcome Discount for new businesses",
                "discount_type": DiscountTypeChoices.PERCENTAGE,
                "discount_value": Decimal("10.00"),
                "min_order_value": Decimal("499.00"),
                "max_discount_amount": Decimal("1000.00"),
                "max_uses": 500,
                "is_active": True,
            },
        )

        # 8. Sample Leads for CRM demonstration
        leads_data = [
            ("Karan Johar", "karan@luxuryspaces.in", "+919811122233", "Luxury Spaces", "Need a clean portfolio website with 3D render gallery", LeadStatusChoices.NEW, LeadPriorityChoices.HIGH),
            ("Sunita Patil", "sunita@patilagro.com", "+919822233344", "Patil Agro Exports", "Looking for agricultural export portal with multi-language support", LeadStatusChoices.CONTACTED, LeadPriorityChoices.MEDIUM),
            ("Farhan Akhtar", "farhan@dynamoathletics.com", "+919833344455", "Dynamo Athletics", "E-commerce store for sports apparel, need payment gateway setup", LeadStatusChoices.QUALIFIED, LeadPriorityChoices.URGENT),
        ]
        for name, email, phone, comp, req, st, pr in leads_data:
            Lead.objects.get_or_create(
                email=email,
                defaults={
                    "full_name": name,
                    "phone": phone,
                    "company_name": comp,
                    "requirements": req,
                    "status": st,
                    "priority": pr,
                    "assigned_to": sales_user,
                    "estimated_budget": Decimal("9999.00"),
                },
            )

        # 9. Sample Quote & Confirmed Order with Reconciled Payment & Project
        quote, _ = Quote.objects.get_or_create(
            quote_number="QT-10001",
            defaults={
                "customer": client_user,
                "recipient_name": client_user.full_name,
                "recipient_email": client_user.email,
                "recipient_phone": client_user.phone,
                "company_name": "Apex Retail Solutions",
                "status": QuoteStatusChoices.ACCEPTED,
                "created_by": sales_user,
                "valid_until": timezone.now().date() + timezone.timedelta(days=15),
            },
        )
        if not quote.items.exists():
            QuoteItem.objects.create(quote=quote, description="Starter Web Presence (1-Page Responsive)", quantity=1, unit_price=Decimal("499.00"))
            QuoteItem.objects.create(quote=quote, description="Custom Logo & Brand Palette Add-on", quantity=1, unit_price=Decimal("999.00"))
            quote.recalculate()

        # Seed sample confirmed order
        order = Order.objects.filter(quote=quote).first()
        if not order:
            order = Order.objects.create(
                order_number="ORD-10001",
                customer=client_user,
                quote=quote,
                status=OrderStatusChoices.CONFIRMED,
                payment_status=PaymentStatusChoices.PARTIAL,
                subtotal=quote.subtotal,
                discount_amount=Decimal("0.00"),
                tax_percentage=quote.tax_percentage,
                tax_amount=quote.tax_amount,
                total_amount=quote.total_amount,
                balance_due=quote.total_amount,
            )
            OrderItem.objects.create(order=order, title="Starter Web Presence", quantity=1, unit_price=Decimal("499.00"), total_price=Decimal("499.00"))
            OrderItem.objects.create(order=order, title="Custom Logo & Brand Palette Add-on", quantity=1, unit_price=Decimal("999.00"), total_price=Decimal("999.00"))

            # Simulate advance payment reconciliation
            advance_amt = order.minimum_advance_amount
            pay_data = PaymentGatewayService.create_order(order, advance_amt, is_advance=True)
            payment = Payment.objects.get(id=pay_data["payment_id"])
            PaymentGatewayService.reconcile_successful_payment(
                payment=payment,
                gateway_payment_id="pay_sample_test_001",
                gateway_signature="test_signature",
            )

        self.stdout.write(self.style.SUCCESS("Biz499 seed process completed successfully!"))

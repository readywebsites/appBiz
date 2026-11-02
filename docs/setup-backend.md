# Biz499 Backend Setup & Configuration Guide

This guide details the setup, configuration, database management, and execution of the **Biz499** Django REST Framework backend API.

---

## 1. Prerequisites

- **Python**: 3.10, 3.11, or 3.12 (tested on Python 3.12)
- **Database**: PostgreSQL 14+ (Recommended for staging & production) or SQLite (auto fallback for immediate zero-config local development)
- **Package Manager**: `pip` and virtual environment tool (`venv`)

---

## 2. Directory Structure

```text
backend/
├── config/                  # Django project root
│   ├── settings.py          # Unified settings (with DB & CORS fallbacks)
│   ├── urls.py              # Root URL routing, Swagger, and v1 endpoints
│   ├── wsgi.py              # Production WSGI entry point
│   └── asgi.py              # Async ASGI entry point
├── apps/                    # Modular domain apps
│   ├── authentication/      # Custom User, CustomerProfile, JWT, RBAC
│   ├── services/            # Catalog, Packages, Features, Banners, Portfolio
│   ├── leads/               # CRM Leads, Inquiries, Consultations
│   ├── quotations/          # Quotes, Dynamic Calculations, PDF Engine
│   ├── orders/              # Orders, Line Items, Coupons
│   ├── payments/            # Gateway integration, HMAC Webhooks, Refunds
│   ├── invoices/            # Sequential Invoicing (INV-YYYY-XXXX), PDF Receipts
│   ├── projects/            # Milestones, Tasks, Deliverables, Sign-offs
│   ├── notifications/       # In-app alerts, Device tokens
│   ├── support/             # Helpdesk tickets, Threaded replies
│   ├── audit/               # Immutable compliance audit log
│   └── analytics/           # Executive KPI metrics & conversion funnels
├── tests/                   # Automated test suite (10 comprehensive tests)
├── manage.py
├── requirements.txt
├── schema.yml               # OpenAPI 3.0 specification
└── db.sqlite3               # Local development database
```

---

## 3. Environment Variables Configuration

Copy or create a `.env` file in `backend/` based on the template below:

```bash
# Security
DJANGO_SECRET_KEY=biz499-super-secure-production-key-change-in-production-2026
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,10.0.2.2,0.0.0.0

# Database (Leave DB_NAME empty to auto-fallback to db.sqlite3)
DB_ENGINE=django.db.backends.postgresql
DB_NAME=biz499_prod
DB_USER=biz499_admin
DB_PASSWORD=your_secure_password
DB_HOST=localhost
DB_PORT=5432

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:8081,http://localhost:19006

# Razorpay Payment Gateway (Test Sandbox Keys)
RAZORPAY_KEY_ID=rzp_test_sample_key_id
RAZORPAY_KEY_SECRET=rzp_test_sample_secret_key
RAZORPAY_WEBHOOK_SECRET=sample_webhook_secret_for_hmac

# Business Branding
GST_RATE_PERCENTAGE=18.0
BUSINESS_LEGAL_NAME=Biz499 Digital Services Private Limited
BUSINESS_GSTIN=29AABCU9603R1Z7
BUSINESS_SUPPORT_EMAIL=support@biz499.com
BUSINESS_SUPPORT_PHONE=+919876543210
BUSINESS_WHATSAPP_NUMBER=+919876543210
```

---

## 4. Installation & Database Setup

### Step 1: Create and Activate Virtual Environment

```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

### Step 2: Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### Step 3: Run Database Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### Step 4: Seed Initial Data & Demo Accounts

We have provided a comprehensive seed management command that loads catalog categories, website packages (including the flagship ₹499 promo, ₹4,999 Starter, ₹9,999 E-Commerce), testimonials, portfolio showcases, coupons, leads, and demo accounts across all user roles:

```bash
python manage.py seed_biz499
```

This creates:
- **Super Administrator**: `admin@biz499.com` / `Biz499Admin#2026`
- **Sales Manager**: `sales@biz499.com` / `Biz499Sales#2026`
- **Project Manager**: `pm@biz499.com` / `Biz499Project#2026`
- **Demo Customer**: `demo.client@example.com` / `Biz499Client#2026`

---

## 5. Running the Backend Server

```bash
python manage.py runserver 0.0.0.0:8000
```

- API Base URL: `http://localhost:8000/api/v1/`
- API Health Check: `http://localhost:8000/api/v1/health/`
- Swagger Interactive Documentation: `http://localhost:8000/api/v1/schema/swagger-ui/`
- Redoc Documentation: `http://localhost:8000/api/v1/schema/redoc/`
- Django Admin: `http://localhost:8000/admin/`

---

## 6. Running Automated Tests

The test suite covers JWT authentication, permission isolation, authoritative price calculations, sandbox payment verification with HMAC SHA-256 signatures, lead pipeline conversion, and ReportLab PDF invoice generation:

```bash
python manage.py test tests
```

---

## 7. Generating OpenAPI Schema

To validate or export the current OpenAPI 3.0 schema:

```bash
python manage.py spectacular --validate --file schema.yml
```


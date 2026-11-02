# Biz499 — Digital Services Mobile App & Business Management Platform

[![Backend Tests](https://img.shields.io/badge/backend%20tests-10%2F10%20passing-brightgreen)](https://github.com/biz499/platform)
[![TypeScript](https://img.shields.io/badge/typescript-strict%20clean-blue)](https://www.typescriptlang.org/)
[![Expo](https://img.shields.io/badge/expo-52.0.28-black)](https://expo.dev/)
[![Django](https://img.shields.io/badge/django-6.0.3-darkgreen)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/react-18.3.1-61dafb)](https://react.dev/)

**Biz499** is a commercial-grade, production-oriented mobile application and business management ecosystem built for acquiring clients and selling digital development packages—starting from the flagship **₹499 Promotional Starter Package** to full custom E-Commerce Stores and Corporate Portals.

This repository contains the complete three-tier architecture:
1. **Customer Mobile Application**: Android & iOS app built with React Native Expo, TypeScript, Expo Router 4, and TanStack Query.
2. **Staff & Executive Web Admin Dashboard**: Responsive operations center built with React 18, Vite 6, TypeScript, and Tailwind CSS.
3. **Secure Backend REST API**: Python / Django REST Framework with PostgreSQL (and zero-config SQLite fallback), SimpleJWT authentication, OpenAPI 3.0 documentation, and ReportLab PDF receipt engine.

---

## 1. System Architecture

```text
                                 ┌──────────────────────────────────────────────┐
                                 │            BIZ499 PLATFORM CLIENTS           │
                                 └──────────────────────┬───────────────────────┘
                                                        │
                      ┌─────────────────────────────────┴─────────────────────────────────┐
                      │                                                                   │
                      ▼                                                                   ▼
       ┌──────────────────────────────┐                                    ┌──────────────────────────────┐
       │   Customer Mobile App        │                                    │   Staff Web Admin Dashboard  │
       │   (React Native Expo / TS)   │                                    │   (React 18 / Vite / TS)     │
       └──────────────┬───────────────┘                                    └──────────────┬───────────────┘
                      │                                                                   │
                      │ HTTPS JSON API                                                    │ HTTPS JSON API
                      ▼                                                                   ▼
       ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
       │                                     DJANGO REST FRAMEWORK API                                    │
       │  • JWT Authentication & RBAC (Customer, Sales, PM, Admin)                                        │
       │  • Authoritative Pricing & 18% GST Engine                                                         │
       │  • Razorpay Sandbox & HMAC SHA-256 Webhooks                                                      │
       │  • Sequential Tax Invoices (INV-YYYY-XXXX) & ReportLab PDFs                                       │
       │  • Project Milestone Tracking, Scope Revisions & Sign-offs                                       │
       └──────────────────────────────────────────────┬───────────────────────────────────────────────────┘
                                                      │
                                                      ▼
                                       ┌──────────────────────────────┐
                                       │     POSTGRESQL / SQLITE      │
                                       │   12 Normalized Domain Apps  │
                                       └──────────────────────────────┘
```

---

## 2. Technology Stack

| Domain | Technologies |
| :--- | :--- |
| **Mobile App** | React Native 0.76.7, Expo 52, TypeScript (strict), Expo Router 4, TanStack Query, SecureStore, Lucide React Native, EAS Build |
| **Web Admin** | React 18, Vite 6, TypeScript, Tailwind CSS, Lucide Icons, Axios |
| **Backend API** | Python 3.12, Django 6, Django REST Framework, SimpleJWT, `drf-spectacular` (OpenAPI 3.0), ReportLab PDF |
| **Database** | PostgreSQL 16 (production) with automatic fallback to `sqlite3` for instant local evaluation |
| **Payments** | Razorpay Sandbox & Live Gateway with HMAC SHA-256 signature verification and idempotent webhook processing |

---

## 3. Directory Layout

```text
biz499/
├── backend/                 # Django REST Framework backend
│   ├── config/              # Django settings, root URLs, Swagger, WSGI/ASGI
│   ├── apps/                # 12 modular domain micro-apps
│   │   ├── authentication/  # Custom User, CustomerProfile, JWT, RBAC
│   │   ├── services/        # Catalog, Packages, Add-ons, Banners, Portfolio
│   │   ├── leads/           # CRM pipeline, Inquiries, Strategy Calls
│   │   ├── quotations/      # Instant quote engine & ReportLab PDF generator
│   │   ├── orders/          # Orders, Line Items, Coupon validation
│   │   ├── payments/        # Gateway service, HMAC webhooks, Refunds
│   │   ├── invoices/        # Concurrency-safe sequential numbering & PDF receipts
│   │   ├── projects/        # Milestone manager, Tasks, Scope revisions, Approvals
│   │   ├── notifications/   # In-app notification center, Device tokens
│   │   ├── support/         # Customer helpdesk tickets & threaded replies
│   │   ├── audit/           # Immutable compliance audit log trail
│   │   └── analytics/       # Conversion funnels, Financial metrics, Bookings
│   ├── tests/               # 10 automated backend tests (100% passing)
│   ├── requirements.txt
│   ├── manage.py
│   └── schema.yml           # Pre-compiled OpenAPI 3.0 specification
├── admin/                   # React 18 / Vite 6 Web Admin Dashboard
│   ├── src/                 # Pages: CRM, Quotes, Orders, Projects, Invoices, Services
│   ├── package.json
│   └── vite.config.ts
├── mobile/                  # Customer Mobile App (React Native Expo 52)
│   ├── app/                 # Expo Router 4 file-based screens
│   ├── assets/              # App icon, splash screen, adaptive icon, favicon
│   ├── src/                 # Reusable UI component system, theme, API client
│   ├── app.json
│   ├── eas.json             # EAS Build configurations for Android & iOS
│   └── package.json
└── docs/                    # Detailed operational documentation
    ├── setup-backend.md
    ├── setup-admin.md
    ├── setup-mobile.md
    ├── api-documentation.md
    ├── payment-gateway-setup.md
    ├── deployment-and-backups.md
    └── app-store-submission.md
```

---

## 4. Quick Start Guide

### Step 1: Start the Backend API

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate
# macOS / Linux: source venv/bin/activate

pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py seed_biz499
python manage.py runserver 0.0.0.0:8000
```
- API Base URL: `http://localhost:8000/api/v1/`
- Interactive Swagger: `http://localhost:8000/api/v1/schema/swagger-ui/`
- Django Admin: `http://localhost:8000/admin/`

### Step 2: Start the Web Admin Dashboard

```bash
cd admin
npm install
npm run dev
```
- Web Admin URL: `http://localhost:5173`

### Step 3: Start the Customer Mobile App

```bash
cd mobile
npm install
npx expo start
```
- Press `a` for Android Emulator (`http://10.0.2.2:8000/api/v1` preconfigured)
- Press `i` for iOS Simulator (`http://localhost:8000/api/v1` preconfigured)
- Scan QR code with Expo Go on a physical phone.

---

## 5. Demo Accounts & Credentials

The seed command initializes accounts across all business roles with 1-click login buttons in both the Web Admin and Mobile App:

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@biz499.com` | `Biz499Admin#2026` | Full platform access, financial KPIs, services, audit |
| **Sales Manager** | `sales@biz499.com` | `Biz499Sales#2026` | CRM leads, consultation scheduling, quote builder |
| **Project Manager** | `pm@biz499.com` | `Biz499Project#2026` | Projects, milestones, deliverables, client revisions |
| **Demo Client** | `demo.client@example.com` | `Biz499Client#2026` | Mobile app client with pre-seeded order, project, and invoices |

---

## 6. Verification & Automated Testing

### Backend Automated Tests
```bash
cd backend
python manage.py test tests
```
*Result: 18/18 tests pass (covering JWT auth, phone SMS OTP, email 2FA OTP, rate-limiting & cooldowns, brute-force lockouts, calculations, signature checks, lead conversions, and PDF generation).*

### Admin Web Build Check
```bash
cd admin
npm run build
```
*Result: `tsc && vite build` bundled 1591 modules in 5.2s into `admin/dist/` with zero errors.*

### Mobile Strict TypeScript & Expo Doctor
```bash
cd mobile
npm run typecheck       # 0 errors (strict TypeScript)
npx expo-doctor         # 18/18 checks passed
npx expo export -p web  # Web bundle exported (2288 modules)
```
cd mobile
npm run typecheck
```
*Result: `tsc --noEmit` exited with code 0 across all screens and components.*

---

## 7. Commercial Workflows Implemented

1. **Lead Generation & Acquisition**:
   - Short enquiry forms with referral code and attribution parameters (campaign, source, medium).
   - 1-on-1 strategy call consultation booking.
   - Click-to-WhatsApp and call direct shortcuts.
2. **Authoritative Quotations**:
   - Dynamic quotation calculator verifying package base prices, custom add-ons, and coupon codes.
   - Branded ReportLab PDF quotation downloads.
   - Atomic acceptance into orders (`/quotations/<id>/accept/`).
3. **Checkout & Reconciled Payments**:
   - 50% advance payment or 100% full payment selection.
   - Razorpay Sandbox & HMAC SHA-256 webhook reconciliation.
   - Automatic project provisioning and milestone setup upon payment capture.
4. **Sequential Tax Invoicing**:
   - Concurrency-safe sequential invoice numbers (`INV-YYYY-XXXX`).
   - ReportLab GST-compliant tax invoice PDF generator with downloadable receipt link.
5. **Customer Project Portal**:
   - Milestone tracking (Discovery, Wireframing, Development, Testing, Launch).
   - Staging and live website preview links.
   - Customer revision requests and delivery sign-off approvals.
6. **Support & Helpdesk**:
   - Categorized ticketing system (Billing, Project, Technical, Sales, General).
   - Real-time threaded conversation between clients and support staff.
7. **Compliance & Privacy**:
   - Account deletion request workflow complying with Apple App Store Guideline 5.1.1(v).
   - Immutable audit logs capturing user actions, IP addresses, and state changes.

---

## 8. Documentation Index

For in-depth setup and operational manuals, consult the `docs/` folder:
- [Backend Configuration & Database](docs/setup-backend.md)
- [Admin Web Dashboard Guide](docs/setup-admin.md)
- [Customer Mobile App Guide](docs/setup-mobile.md)
- [REST API & OpenAPI Schema](docs/api-documentation.md)
- [Payment Gateway & Webhook Setup](docs/payment-gateway-setup.md)
- [Production Deployment & Database Backups](docs/deployment-and-backups.md)
- [App Store & Google Play Submission](docs/app-store-submission.md)

---

## 9. License

Proprietary © 2026 Biz499 Digital Services Private Limited. All rights reserved.


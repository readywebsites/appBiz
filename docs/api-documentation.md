# Biz499 REST API Documentation

The Biz499 platform provides a versioned, secure REST API adhering to OpenAPI 3.0 standards.

- **Base URL**: `/api/v1`
- **Interactive Swagger UI**: `/api/v1/schema/swagger-ui/`
- **Interactive Redoc**: `/api/v1/schema/redoc/`
- **Raw OpenAPI Schema**: `/api/v1/schema/`
- **Health Check**: `/api/v1/health/`

---

## 1. Authentication & Security

Biz499 uses **JSON Web Tokens (JWT)** via `djangorestframework-simplejwt`.

### Token Headers
For all protected endpoints, pass the access token in the `Authorization` HTTP header:
```http
Authorization: Bearer <access_token>
```

### Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/phone/send-otp/` | Request SMS verification code for mobile number | No |
| `POST` | `/auth/phone/verify-otp/` | Verify 6-digit SMS OTP, login or register account | No |
| `POST` | `/auth/email/login/` | Account password login (returns tokens or 2FA challenge) | No |
| `POST` | `/auth/email/send-otp/` | Request 6-digit verification code to email | No |
| `POST` | `/auth/email/verify-otp/` | Verify 6-digit email OTP and complete sign-in | No |
| `POST` | `/auth/register/` | Register new customer account | No |
| `POST` | `/auth/login/` | Sign in & receive access + refresh tokens | No |
| `POST` | `/auth/token/refresh/` | Obtain fresh access token using refresh token | No |
| `POST` | `/auth/logout/` | Revoke session and blacklist refresh token | Yes |
| `GET` | `/auth/me/` | Retrieve current user profile & business details | Yes |
| `PATCH`| `/auth/me/` | Update profile, business name, GSTIN, WhatsApp opt-in | Yes |
| `POST` | `/auth/delete-account/` | Request GDPR/App Store account deletion | Yes |

---

## 2. Service Catalog & Public Offerings

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/services/categories/` | List active service categories | No |
| `GET` | `/services/items/` | List active services (optional `?category=<slug>`) | No |
| `GET` | `/services/items/<slug>/` | Service detail with package tiers & add-ons | No |
| `GET` | `/services/packages/` | List package tiers (optional `?service_id=<id>`) | No |
| `GET` | `/services/banners/` | Active promotional campaigns and hero banners | No |
| `GET` | `/services/portfolio/` | Case studies and website portfolio showcases | No |
| `GET` | `/services/testimonials/` | Verified client reviews and ratings | No |

---

## 3. Lead Capture & CRM

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/leads/submit-enquiry/` | Submit custom project enquiry with attribution | No |
| `POST` | `/leads/consultations/` | Book 1-on-1 strategy call with slot preferences | No |
| `GET` | `/leads/admin/` | Staff CRM lead list with status filtering | Staff / Admin |
| `POST` | `/leads/admin/<id>/convert/` | Convert CRM lead into active customer account | Staff / Admin |

---

## 4. Quotations & Instant Estimation

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/quotations/estimate/` | Calculate dynamic quotation (coupon, add-ons, GST) | No / Yes |
| `GET` | `/quotations/` | List customer's received quotes | Yes |
| `GET` | `/quotations/<id>/` | View quotation details | Yes |
| `GET` | `/quotations/<id>/pdf/` | Download official branded quotation PDF | Yes |
| `POST` | `/quotations/<id>/accept/` | Atomically accept quotation and generate order | Yes |

---

## 5. Orders & Checkout

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/orders/checkout/` | Create order with authoritative price calculation | Yes |
| `GET` | `/orders/` | List customer's orders | Yes |
| `GET` | `/orders/<id>/` | Retrieve specific order details | Yes |
| `POST` | `/orders/<id>/cancel/` | Request order cancellation | Yes |
| `GET` | `/orders/coupons/validate/` | Validate coupon code against subtotal | Yes |

---

## 6. Payment Processing & Webhooks

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/payments/initiate/` | Create gateway order (50% advance or full) | Yes |
| `POST` | `/payments/verify/` | Verify payment signature and reconcile order | Yes |
| `POST` | `/payments/webhook/` | Idempotent gateway webhook with replay protection | No (HMAC) |

---

## 7. Invoices & Receipts

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/invoices/` | List customer invoices (INV-YYYY-XXXX) | Yes |
| `GET` | `/invoices/<id>/` | Retrieve invoice details | Yes |
| `GET` | `/invoices/<id>/pdf/` | Download ReportLab generated tax invoice PDF | Yes |

---

## 8. Projects & Delivery Milestones

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/projects/` | List customer projects | Yes |
| `GET` | `/projects/<id>/` | Project portal (milestones, tasks, staging URLs) | Yes |
| `POST` | `/projects/<id>/request-revision/` | Submit scope/design revision request | Yes |
| `POST` | `/projects/<id>/approve/` | Submit final delivery sign-off approval | Yes |

---

## 9. Customer Support & Helpdesk

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/support/` | List support tickets | Yes |
| `POST` | `/support/` | Open new support ticket with initial message | Yes |
| `GET` | `/support/<id>/` | Retrieve ticket conversation thread | Yes |
| `POST` | `/support/<id>/reply/` | Post threaded message to support team | Yes |

---

## 10. Analytics & Compliance Audit

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/analytics/metrics/` | Financial summary, sales funnel, conversion rates | Staff / Admin |
| `GET` | `/audit/` | Immutable compliance audit logs | Super Admin |


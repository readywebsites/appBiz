# Biz499 App Store & Google Play Submission Checklist

This document prepares the **Biz499 Mobile App** for submission to the **Apple App Store** and **Google Play Store**, ensuring complete compliance with store review guidelines.

---

## 1. App Store Guidelines Compliance Matrix

| Requirement | Store | Implementation Status in Biz499 |
| :--- | :--- | :--- |
| **Account Deletion** (Apple 5.1.1(v)) | iOS & Android | Implemented via `POST /api/v1/auth/delete-account/` and visible in Mobile Profile tab. |
| **Privacy Policy URL** | iOS & Android | Hosted on `https://biz499.com/privacy/` and linked in registration & profile screens. |
| **Terms of Service URL** | iOS & Android | Hosted on `https://biz499.com/terms/`. |
| **Reviewer Test Account** | iOS & Android | Dedicated demo account with pre-seeded data provided below. |
| **No Incomplete/Demo Placeholders** | iOS & Android | All service packages, features, and quotation workflows connect to live persistent backend APIs. |
| **Push Notification Authorization** | iOS & Android | Graceful user consent request before registering push token with backend. |

---

## 2. Store Metadata & Copy

### App Title
- **iOS**: Biz499: Website & App Services
- **Android**: Biz499 - Website Development & Business Solutions

### Subtitle (iOS - 30 chars max)
Professional Websites from ₹499

### Short Description (Google Play - 80 chars max)
Launch your business online with custom website packages, quotes & project tracking.

### Full Description
Biz499 is your complete digital growth partner. We empower small businesses, startups, and growing enterprises to launch high-performance websites and digital solutions starting from just ₹499.

**Key Features:**
- **Explore Website Packages**: Browse our verified catalog ranging from ₹499 Starter Business Websites to Custom E-Commerce & Growth Portals.
- **Instant Quotation Engine**: Customize requirements, add domains, SEO, or payment integrations, and receive an instant estimate with zero hidden costs.
- **Real-Time Project Tracking**: Follow your website build stage-by-stage—from wireframe and UI design to staging preview and final deployment.
- **Milestone Approvals & Revisions**: Review deliverables directly from your phone and request revisions with one tap.
- **Invoices & Receipts**: View and download official GST-compliant tax invoices for your business accounts.
- **Direct Support Desk**: Instant consultation bookings, live helpdesk ticketing, and WhatsApp shortcuts to your dedicated project manager.

---

## 3. Permissions Justifications

### iOS `Info.plist`
- `ITSAppUsesNonExemptEncryption`: `false` (Standard HTTPS encryption only).
- `NSPhotoLibraryUsageDescription`: "Biz499 requires photo access to allow you to upload logos, assets, and design references for your website project."
- `NSCameraUsageDescription`: "Biz499 uses the camera to allow you to take photos of documents and design samples for project onboarding."

### Android `AndroidManifest.xml`
- `android.permission.INTERNET`: Required for REST API communication.
- `android.permission.POST_NOTIFICATIONS`: Required on Android 13+ (API 33+) for project milestone alerts and support ticket replies.

---

## 4. App Store Reviewer Test Account

Provide the following credentials in the **App Review Information** section of App Store Connect and Google Play Console:

- **Username / Email**: `demo.client@example.com`
- **Password**: `Biz499Client#2026`
- **Notes for Reviewer**:
  - The app connects to the Biz499 REST API.
  - The test account is pre-populated with an active website project ("Modern E-Commerce Store"), order history, milestones, and sample support tickets.
  - In-app payment testing uses the Razorpay Sandbox simulation; no real monetary transactions take place during test checkout.


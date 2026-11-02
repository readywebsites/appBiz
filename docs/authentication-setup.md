# Biz499 — Secure Authentication & Verification Setup Guide

This guide details the setup, configuration, and security policies for Biz499's multi-channel authentication system:
- **Phone Number OTP Authentication** via SMS (Twilio / Dev Sandbox)
- **Email & Password Authentication with 2FA Email OTP** via SMTP (Google App Passwords or Transactional Email Providers)
- **Security Throttling, Cooldowns, and Brute-Force Protection**

---

## 1. Architecture & Security Policies

1. **Zero Plain-Text OTP Storage**:
   - Verification codes are generated using Python's cryptographically secure `secrets` library.
   - Codes are stored as salted cryptographic hashes using Django's PBKDF2/SHA-256 algorithm. The database never holds plain-text codes.
2. **Double Replay & Tamper Protection**:
   - Verification codes expire after **5 minutes** (`OTP_EXPIRY_MINUTES=5`).
   - A single-use policy immediately marks an OTP challenge as verified upon successful authentication. Replays are permanently blocked.
3. **Brute-Force & Account Enumeration Prevention**:
   - A maximum of **5 failed attempts** (`OTP_MAX_ATTEMPTS=5`) is enforced per challenge. On the 5th failure, the challenge is locked out and permanently invalidated.
   - Resend requests enforce a minimum **45-second cooldown** (`OTP_RESEND_COOLDOWN_SECONDS=45`). Rapid requests return `HTTP 429 Too Many Requests`.
   - Error messages avoid leaking whether an arbitrary phone or email is registered.
4. **Zero Credential Leaks**:
   - The plain OTP is strictly routed to the SMS/Email transport layer and is **NEVER** returned in any HTTP API response, client log, or telemetry.

---

## 2. SMS Provider Setup (Twilio)

### A. Development Mode (Default)
When `SMS_PROVIDER=DEV` or when Twilio credentials are unset:
- The backend automatically runs in safe sandbox mode.
- Verification codes are logged directly to the backend terminal console for immediate local testing:
  ```text
  [DEV SMS DISPATCH] Channel: SMS | Destination: +919876543210 | Verification Code: 492018 | Note: Live SMS requires Twilio setup
  ```
- No third-party network calls are made and no SMS charges are incurred.

### B. Production Live SMS via Twilio

1. Create an account on [Twilio](https://www.twilio.com/).
2. Obtain your **Account SID** and **Auth Token** from the Twilio Console dashboard.
3. Purchase an SMS-enabled Twilio phone number or configure an approved Sender ID for your destination country (e.g. India DLT registration compliance).
4. In `backend/.env`, set the following environment variables:
   ```bash
   SMS_PROVIDER=TWILIO
   TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_PHONE_NUMBER=+1234567890
   ```
5. Restart the backend service.

---

## 3. Email Delivery Setup (SMTP & Google App Passwords)

Biz499 uses standard Django email integration supporting Google Workspace, Gmail SMTP, and transactional providers like SendGrid, Mailgun, or Amazon SES.

> [!IMPORTANT]
> **NEVER** use your personal Gmail account password. Google requires a dedicated **16-character App Password** for third-party application access.

### A. Generating a Google App Password
1. Sign in to your Google Account and navigate to [Google Account Security](https://myaccount.google.com/security).
2. Ensure **2-Step Verification** is turned ON.
3. In the search bar at the top, type **App passwords** (or go to Security -> 2-Step Verification -> App passwords).
4. Enter an app name, e.g., `Biz499 Mobile App`.
5. Click **Create**. Google will display a 16-character passcode (e.g. `abcd efgh ijkl mnop`).
6. Copy this 16-character code into `backend/.env` without spaces.

### B. Configuring `backend/.env` for Gmail SMTP

```bash
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=support@biz499.com
EMAIL_HOST_PASSWORD=abcdefghijklmnop
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=Biz499 Security <support@biz499.com>
```

### C. Development Console Fallback
For local development without an active SMTP server:
```bash
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```
Verification emails will be formatted and logged to the Django terminal console.

---

## 4. API Endpoints Reference

| Method | Endpoint | Description | Public / Protected |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/phone/send-otp/` | Request SMS verification code for mobile number | Public |
| `POST` | `/api/v1/auth/phone/verify-otp/` | Verify 6-digit SMS OTP, login or create account | Public |
| `POST` | `/api/v1/auth/email/login/` | Account password sign-in (returns tokens or 2FA challenge) | Public |
| `POST` | `/api/v1/auth/email/send-otp/` | Request 6-digit verification code to email | Public |
| `POST` | `/api/v1/auth/email/verify-otp/` | Verify 6-digit email OTP and complete sign-in | Public |
| `POST` | `/api/v1/auth/token/refresh/` | Obtain fresh JWT access token | Public |
| `POST` | `/api/v1/auth/logout/` | Revoke session and blacklist refresh token | Protected |
| `GET` | `/api/v1/auth/me/` | Fetch current user & business profile | Protected |

---

## 5. Security Testing Checklist

- [x] Invalid phone number formats rejected with `HTTP 400`.
- [x] Rapid repeated requests throttled with `HTTP 429` cooldown.
- [x] Incorrect OTP rejected with remaining attempt count.
- [x] Lockout enforced after 5 failed attempts.
- [x] Expired OTP challenges rejected.
- [x] Reused/already-verified challenges rejected.
- [x] Plain OTP never returned in API payloads.
- [x] Passwords securely hashed with PBKDF2/SHA-256.


# Biz499 Payment Gateway Integration & Reconcilation Guide

This document details the payment gateway architecture, order reconciliation workflows, advance payment rules, cryptographic verification, and the transition from sandbox to live production.

---

## 1. Architecture Overview

Biz499 integrates **Razorpay** (India's premier payment gateway supporting UPI, Credit/Debit cards, NetBanking, and Wallets) with strict security principles:

1. **Client Never Dictates Amounts**: The mobile app and web frontend never pass a price to the payment gateway. The server looks up the authoritative order balance from the database, calculates applicable GST, and generates the payment order.
2. **Double-Verification Mechanism**:
   - Client-side checkout callback is verified by calling `POST /api/v1/payments/verify/` with the gateway signature.
   - Server-to-server webhook callback is verified via `POST /api/v1/payments/webhook/` using HMAC SHA-256 signatures.
3. **Idempotency & Replay Protection**:
   - Every webhook payload and payment ID is recorded in the `PaymentEvent` table.
   - Duplicate events are logged and return `HTTP 200 OK` without triggering repeated order updates or duplicate invoice creations.
4. **Atomic Provisioning**:
   - Upon successful payment verification, the system updates the payment record, recalculates the order balance, generates a sequential tax invoice (`INV-YYYY-XXXX`), and provisions the client project with initial delivery milestones in a single database transaction (`transaction.atomic`).

---

## 2. Payment Modes & Calculations

Biz499 supports two client checkout modes:

- **50% Advance**: Enables clients to start their website project with a 50% commitment.
- **100% Full Payment**: Settles the full project upfront.

### Authoritative Calculation Flow:
$$\text{Payable Amount} = (\text{Package Base} + \sum \text{Add-Ons}) - \text{Coupon Discount} + \text{18% GST}$$

If the client selects the 50% advance option:
$$\text{Advance Required} = \text{Payable Amount} \times 0.50$$

---

## 3. Cryptographic Signature Verification

Razorpay generates an HMAC SHA-256 signature using the following formula:

$$\text{Signature} = \text{HMAC-SHA256}(\text{order\_id} + "|" + \text{payment\_id}, \text{secret\_key})$$

In `backend/apps/payments/services.py`, this is validated securely:

```python
generated_signature = hmac.new(
    settings.RAZORPAY_KEY_SECRET.encode("utf-8"),
    msg.encode("utf-8"),
    hashlib.sha256,
).hexdigest()

if hmac.compare_digest(generated_signature, gateway_signature):
    # Signature is authentic
```

---

## 4. Sandbox vs Live Configuration

### Sandbox Testing (Default)
When using placeholder or test credentials (keys beginning with `rzp_test_` or empty), the payment gateway service automatically operates in safe sandbox simulation mode. Clients can complete payment without incurring real bank charges:

```python
# In backend/.env
RAZORPAY_KEY_ID=rzp_test_sample_key_id
RAZORPAY_KEY_SECRET=rzp_test_sample_secret_key
RAZORPAY_WEBHOOK_SECRET=sample_webhook_secret_for_hmac
```

### Transition to Live Operation

1. Register and verify your business on [Razorpay Dashboard](https://dashboard.razorpay.com).
2. Generate API Keys in **Live Mode** (`rzp_live_...`).
3. Set up a Webhook in the Razorpay Dashboard:
   - **Webhook URL**: `https://api.biz499.com/api/v1/payments/webhook/`
   - **Secret**: Enter a cryptographically strong 32-character string.
   - **Events to Subscribe**:
     - `order.paid`
     - `payment.captured`
     - `payment.failed`
     - `refund.created`
4. Update production environment variables:
   ```bash
   RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
   RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
   ```
5. Restart the backend service.


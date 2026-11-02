import logging
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)

class EmailAuthService:
    @staticmethod
    def send_otp(email: str, otp: str) -> dict:
        """
        Sends an email verification code via Django's configured email backend (SMTP / Console).
        """
        subject = f"Your Biz499 Verification Code: {otp}"
        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "Biz499 <no-reply@biz499.com>")

        plain_message = (
            f"Hello,\n\n"
            f"Your verification code for Biz499 account sign-in is: {otp}\n\n"
            f"This code will expire in 5 minutes.\n"
            f"For your security, never share this code with anyone.\n\n"
            f"If you did not request this code, please secure your account immediately.\n\n"
            f"— The Biz499 Security Team\n"
            f"support@biz499.com"
        )

        html_message = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0F172A; color: #FFFFFF; margin: 0; padding: 24px; }}
            .card {{ background-color: #1E293B; border-radius: 12px; padding: 32px; max-width: 480px; margin: 0 auto; border: 1px solid #334155; }}
            .brand {{ font-size: 24px; font-weight: bold; color: #38BDF8; margin-bottom: 24px; text-align: center; }}
            .otp-box {{ background-color: #0F172A; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0; border: 1px solid #2563EB; }}
            .otp {{ font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #60A5FA; }}
            .footer {{ font-size: 12px; color: #94A3B8; text-align: center; margin-top: 24px; line-height: 1.5; }}
          </style>
        </head>
        <body>
          <div class="card">
            <div class="brand">BIZ499</div>
            <p style="color: #E2E8F0; font-size: 16px;">Hello,</p>
            <p style="color: #CBD5E1; font-size: 14px; line-height: 1.6;">
              Please use the verification code below to complete your sign-in to Biz499:
            </p>
            <div class="otp-box">
              <span class="otp">{otp}</span>
            </div>
            <p style="color: #94A3B8; font-size: 13px;">
              ⏱️ This code is valid for <strong>5 minutes</strong>. For your security, never share this code with anyone.
            </p>
            <div class="footer">
              Biz499 Digital Services Private Limited<br>
              If you did not request this sign-in, please ignore this email.
            </div>
          </div>
        </body>
        </html>
        """

        try:
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=from_email,
                recipient_list=[email],
                html_message=html_message,
                fail_silently=False,
            )
            logger.info("Sent verification email to %s", email)
            return {"success": True, "dev_mode": False}
        except Exception as e:
            logger.warning(
                "[DEV EMAIL DISPATCH] To: %s | OTP: %s | Reason: SMTP failed or console backend (%s)",
                email,
                otp,
                str(e),
            )
            return {
                "success": True,
                "dev_mode": True,
                "note": "Email simulated in development mode. Check server console for verification code.",
            }


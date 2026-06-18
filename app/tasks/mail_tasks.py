
import smtplib

from app.core import celery_app
from app.utils.mailer import send_smtp_email
from config import get_settings

#cau hinh RETRY
RETRY_CONFIG = {
    "autoretry_for": (smtplib.SMTPException, ConnectionError),
    "max_retries": 3,
    "default_retry_delay": 60 #thu lai sau 1 phut
}

settings = get_settings

@celery_app.task(name="tasks.send_veify_email", **RETRY_CONFIG)
def send_verify_email_task(email: str, verify_link: str):
    subject = "[Sĩ Tử Chiến] Xác thực tài khoản của bạn"
    html_content = f"""
    <a href="{verify_link}" target="_blank">Kích hoạt tài khoản tại đây</a>
    <p>Link hết hạn sau {settings.email_verify_expire_minutes} phút.</p>
    """
    send_smtp_email(to_email=email, subject=subject, html_content=html_content)
    return f"Verify email sent to {email}"

@celery_app.task(name="tasks.send_otp_email", **RETRY_CONFIG)
def send_otp_email_task(email: str, otp_code: str):
    subject = "[Sĩ Từ Chiến] Mã OTP Khôi phục mật khẩu"
    html_content = f"""
    <p>Mã OTP của bạn là: {otp_code}</p>
    <p>Mã hết hạn sau {settings.password_reset_otp_expire_minutes} phút.</p>
    """
    send_smtp_email(to_email=email, subject=subject, html_content=html_content)
    return f"OTP sent to {email}"
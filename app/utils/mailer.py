from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import smtplib

import resend

from config import get_settings

settings = get_settings()

def send_resend_email(to_email: str, subject: str, html_content: str):
    try:
        #goi api cua resend de gui maik
        params= {
            "from": "Si Tu Chien <onboarding@resend.dev>",
            "to": [to_email],
            "subject": subject,
            "html_content": html_content
        }
        email = resend.Emails.send(params)
        print("Gui mail xac thuc thanh cong")
        return email
    except Exception as e:
        print(f"RESEND ERROR: {str(e)}")
        raise OSError(f"Resend API failed: {e}")
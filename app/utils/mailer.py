from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import smtplib

from config import get_settings

settings = get_settings()
def send_smtp_email(to_email: str, subject: str, html_content: str):
    msg = MIMEMultipart()
    msg['From'] = settings.smtp_user
    msg['To'] = to_email
    msg['Subject'] = subject

    #dinh dang noi dung dang html
    msg.attach(MIMEText(html_content, 'html'))

    #ket noi server Gmail
    with smtplib.SMTP(settings.smtp_host, int(settings.smtp_port)) as server:
        server.starttls() #Kich hoat bao mat ma  hoa duong truyen
        server.login(settings.smtp_user, settings.smtp_password)
        server.send_message(msg)
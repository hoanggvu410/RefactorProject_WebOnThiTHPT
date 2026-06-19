from pydantic import ConfigDict, field_validator
from pydantic_settings import BaseSettings
from functools import lru_cache

DEFAULT_DATABASE_URL = "postgresql://postgres:123456@localhost:5432/postgres"
DEFAULT_REDIS_URL = "redis://localhost:6379"

class Settings(BaseSettings):
    #database (Pydantic tự động map với DATABASE_URL trong file .env hoặc Render)
    database_url: str = DEFAULT_DATABASE_URL

    vite_api_base_url: str = "http://localhost:8000"

    #redis
    redis_url: str = DEFAULT_REDIS_URL

    #JWT
    secret_key: str
    refresh_secret_key: str
    algorithm: str

    #Token
    access_token_expire_minutes: int
    refresh_token_expire_days: int

    #cau hinh hang so he thong
    UPLOAD_DIR: str = "uploads/"
    AVATAR_ALLOWED_EXTENSIONS: set = {"png", "jpg", "jpeg"}
    DOCUMENT_ALLOWED_EXTENSIONS: set = {"pdf", "docx", "txt"}
    AVATAR_ALLOWED_MIME_TYPES: set = {"image/png", "image/jpeg"}
    DOCUMENT_ALLOWED_MIME_TYPES: set = {"application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"}
    AVATAR_MAX_SIZE: int = 2 * 1024 * 1024  # 2MB
    DOCUMENT_MAX_SIZE: int = 10 * 1024 * 1024  # 10MB

    #SMTP Server
    smtp_host: str
    smtp_port: int
    smtp_user: str
    smtp_password: str

    frontend_url: str
    email_verify_expire_minutes: int
    password_reset_otp_expire_minutes: int

    debug: bool 
    host: str 
    port: int 

    @field_validator("debug", mode="before")
    @classmethod
    def parse_debug(cls, value):
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"release", "prod", "production", "false", "0", "no", "off"}:
                return False
            if normalized in {"debug", "dev", "development", "true", "1", "yes", "on"}:
                return True
        return value

    @field_validator("database_url", mode="before")
    @classmethod
    def parse_database_url(cls, value):
        if value is None or (isinstance(value, str) and not value.strip()):
            return cls.DEFAULT_DATABASE_URL
        return value

    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

@lru_cache
def get_settings():
    return Settings()

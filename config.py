from pydantic import ConfigDict, field_validator
from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import ClassVar


class Settings(BaseSettings):
    DEFAULT_DATABASE_URL: ClassVar[str] = "postgresql://postgres:123456@localhost:5432/postgres"

    #database
    database_url: str = DEFAULT_DATABASE_URL

    #JWT
    SECRET_KEY: str
    REFRESH_SECRET_KEY: str
    ALGORITHM: str = "HS256"

    #Token
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    #cau hinh hang so he thong
    UPLOAD_DIR: str = "app/uploads/"
    AVATAR_ALLOWED_EXTENSIONS: set = {"png", "jpg", "jpeg"}
    DOCUMENT_ALLOWED_EXTENSIONS: set = {"pdf", "docx", "txt"}
    AVATAR_ALLOWED_MIME_TYPES: set = {"image/png", "image/jpeg"}
    DOCUMENT_ALLOWED_MIME_TYPES: set = {"application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"}
    AVATAR_MAX_SIZE: int = 2 * 1024 * 1024  # 2MB
    DOCUMENT_MAX_SIZE: int = 10 * 1024 * 1024  # 10MB

    #redis
    REDIS_URL: str = "redis://default:gQAAAAAAAX5bAAIgcDI3ODI3MGRkNWExNjg0ZTRjYTRhMTU0OWI3MTQ4ZWY2ZQ@gorgeous-crow-97883.upstash.io:6379"

    debug: bool = False
    host: str = "127.0.0.1"
    port: int = 8000

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
        env_file_encoding="utf-8"
    )


@lru_cache
def get_settings():
    return Settings()

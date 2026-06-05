from pydantic import ConfigDict
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    #database
    database_url: str = "postgresql://postgres:123456@localhost:5432/postgres"

    #JWT
    SECRET_KEY: str
    REFRESH_SECRET_KEY: str
    ALGORITHM: str = "HS256"

    #Token
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    debug: bool = False
    host: str = "127.0.0.1"
    port: int = 8000

    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8"
    )


@lru_cache
def get_settings():
    return Settings()


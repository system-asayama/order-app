import os
from pathlib import Path
from pydantic_settings import BaseSettings

# Explicitly load .env from the backend directory
_env_file = Path(__file__).parent / ".env"


class Settings(BaseSettings):
    database_url: str = "postgresql://orderapp:orderapp123@localhost:5432/orderdb"
    secret_key: str = "super-secret-jwt-key-change-in-production-2024"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 480

    class Config:
        env_file = str(_env_file)
        env_file_encoding = "utf-8"
        # Do NOT read from system environment for these keys
        # to avoid picking up the webdev MySQL DATABASE_URL
        extra = "ignore"


# Override DATABASE_URL from .env file directly to avoid system env pollution
def _load_settings() -> Settings:
    raw: dict = {}
    if _env_file.exists():
        for line in _env_file.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                raw[k.strip().lower()] = v.strip()
    return Settings(**raw)


settings = _load_settings()

import os
import json
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "ShopSphere"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "shopsphere-super-secret-key-change-in-production-2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440 # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "Sahil@123"
    POSTGRES_DB: str = "shopsphere"
    DATABASE_URL: str = "postgresql+asyncpg://postgres:Sahil%40123@localhost:5432/shopsphere"
    SYNC_DATABASE_URL: str = "postgresql+psycopg2://postgres:Sahil%40123@localhost:5432/shopsphere"

    UPLOAD_DIR: str = "app/uploads"
    MAX_FILE_SIZE_MB: int = 5
    BACKEND_CORS_ORIGINS: Union[str, List[str]] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "https://shop-sphere-one-gamma.vercel.app"
    ]

    @field_validator("DATABASE_URL", mode="before")
    def assemble_db_url(cls, v: str) -> str:
        if v:
            if v.startswith("postgres://"):
                v = v.replace("postgres://", "postgresql+asyncpg://", 1)
            elif v.startswith("postgresql://") and not v.startswith("postgresql+"):
                v = v.replace("postgresql://", "postgresql+asyncpg://", 1)
            if "sslmode=require" in v:
                v = v.replace("sslmode=require", "ssl=require")
        return v

    @field_validator("SYNC_DATABASE_URL", mode="before")
    def assemble_sync_db_url(cls, v: str) -> str:
        if v:
            if v.startswith("postgres://"):
                v = v.replace("postgres://", "postgresql+psycopg2://", 1)
            elif v.startswith("postgresql://") and not v.startswith("postgresql+"):
                v = v.replace("postgresql://", "postgresql+psycopg2://", 1)
        return v

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            v = v.strip()
            if not v:
                return []
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    cleaned = v.strip("[]").replace("'", '"')
                    try:
                        return json.loads(f"[{cleaned}]")
                    except Exception:
                        return [i.strip().strip("'\"") for i in v.strip("[]").split(",") if i.strip()]
            return [i.strip().strip("'\"") for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return []

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()

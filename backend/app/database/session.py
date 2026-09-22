from typing import AsyncGenerator
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

import ssl

# SSL configuration for cloud databases
async_connect_args = {}
if any(host in settings.DATABASE_URL for host in ["render.com", "neon.tech", "supabase.co", "aws", "rds", "pooler"]) or "ssl" in settings.DATABASE_URL:
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    async_connect_args["ssl"] = ctx

# Async engine & sessionmaker
async_engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    connect_args=async_connect_args
)

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

# Sync engine & sessionmaker (for seed scripts, migrations, etc.)
sync_connect_args = {}
if any(host in settings.SYNC_DATABASE_URL for host in ["render.com", "neon.tech", "supabase.co", "aws", "rds", "pooler"]):
    sync_connect_args["sslmode"] = "require"

sync_engine = create_engine(
    settings.SYNC_DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    connect_args=sync_connect_args
)

SyncSessionLocal = sessionmaker(
    bind=sync_engine,
    autocommit=False,
    autoflush=False
)

Base = declarative_base()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

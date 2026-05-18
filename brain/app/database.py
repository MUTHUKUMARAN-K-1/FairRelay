"""
Database connection and session management.
Uses async SQLAlchemy with asyncpg driver for PostgreSQL,
or aiosqlite for local/free-tier deployment.
"""

import uuid
import os
import logging as _logging
from urllib.parse import urlparse

from fastapi import HTTPException
from sqlalchemy import CHAR, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool
from sqlalchemy.types import TypeDecorator

from app.config import get_settings


class GUID(TypeDecorator):
    """
    Platform-independent GUID type.
    Uses PostgreSQL's UUID type when available, otherwise uses CHAR(32) for SQLite.
    """
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            from sqlalchemy.dialects.postgresql import UUID as PG_UUID
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        else:
            return dialect.type_descriptor(CHAR(32))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return value
        else:
            if isinstance(value, uuid.UUID):
                return value.hex
            else:
                return uuid.UUID(value).hex

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return value
        else:
            if isinstance(value, uuid.UUID):
                return value
            return uuid.UUID(value)


_db_logger = _logging.getLogger("fairrelay.database")

settings = get_settings()

# Determine database URL - fallback to SQLite if no PostgreSQL configured
_raw_url = settings.database_url or ""
_db_url = _raw_url.strip()

def _mask_url(url: str) -> str:
    try:
        p = urlparse(url)
        return url.replace(p.password, "***") if p.password else url
    except Exception:
        return "<unparseable-url>"

_db_logger.info(f"[DB INIT] url length={len(_db_url)}, set={'yes' if _db_url else 'no'}")

if not _db_url:
    _db_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
    os.makedirs(_db_dir, exist_ok=True)
    _db_url = f"sqlite+aiosqlite:///{_db_dir}/fairrelay.db"
    _is_sqlite = True
    _db_logger.info(f"[DB INIT] Using SQLite fallback: {_db_url}")
else:
    if _db_url.startswith("postgres://"):
        _db_url = _db_url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif _db_url.startswith("postgresql://"):
        _db_url = _db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    _is_sqlite = False
    _db_logger.info(f"[DB INIT] Using PostgreSQL: {_mask_url(_db_url)}")

# Create async engine
if _is_sqlite:
    engine = create_async_engine(
        _db_url,
        echo=settings.debug,
        future=True,
        connect_args={"check_same_thread": False},
    )
else:
    # NullPool avoids connection reuse across requests — prevents
    # asyncpg prepared-statement conflicts with Supabase pgbouncer.
    engine = create_async_engine(
        _db_url,
        echo=settings.debug,
        future=True,
        poolclass=NullPool,
        connect_args={"statement_cache_size": 0},
    )

# Session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


async def get_db() -> AsyncSession:
    """
    Dependency that provides a database session.
    Endpoints are responsible for their own commit calls.
    HTTPException is not a DB error — do not rollback on it.
    """
    async with async_session_maker() as session:
        try:
            yield session
        except HTTPException:
            raise
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def check_db_health() -> bool:
    """Check database connectivity by running a simple query."""
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        _db_logger.error(f"[DB HEALTH] check failed: {type(e).__name__}: {e}")
        return False


async def init_db() -> None:
    """Initialize database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

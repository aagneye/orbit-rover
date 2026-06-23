import logging
import os
import re
import ssl
from collections.abc import AsyncGenerator
from functools import lru_cache
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings

logger = logging.getLogger(__name__)

RENDER_SQLITE_FALLBACK = "sqlite+aiosqlite:////tmp/orbit_rover.db"
LOCAL_SQLITE_DEFAULT = "sqlite+aiosqlite:///./data/orbit_rover.db"


class Base(DeclarativeBase):
    pass


def normalize_database_url(url: str) -> tuple[str, dict]:
    """Return (sqlalchemy_url, connect_args) for async engines."""
    connect_args: dict = {}

    if not url or not url.strip():
        if os.getenv("RENDER"):
            return RENDER_SQLITE_FALLBACK, connect_args
        return LOCAL_SQLITE_DEFAULT, connect_args

    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)

    if not url.startswith("postgresql+asyncpg://"):
        return url, connect_args

    parsed = urlparse(url)
    query = parse_qs(parsed.query, keep_blank_values=True)
    ssl_mode = (query.pop("sslmode", [""])[0] or "").lower()
    query.pop("ssl", None)

    needs_ssl = (
        ssl_mode in {"require", "verify-ca", "verify-full"}
        or "neon.tech" in (parsed.hostname or "")
        or "render.com" in (parsed.hostname or "")
    )
    if needs_ssl:
        connect_args["ssl"] = ssl.create_default_context()

    clean_query = urlencode({k: v[0] for k, v in query.items() if v and v[0]})
    url = urlunparse(parsed._replace(query=clean_query))
    url = re.sub(r"\?$", "", url)

    return url, connect_args


@lru_cache
def _engine_bundle() -> tuple[AsyncEngine, async_sessionmaker[AsyncSession]]:
    settings = get_settings()
    db_url, connect_args = normalize_database_url(settings.database_url)
    safe_log = db_url.split("@")[-1] if "@" in db_url else db_url
    logger.info("Database target: %s", safe_log)

    engine = create_async_engine(
        db_url,
        echo=settings.debug,
        connect_args=connect_args,
        pool_pre_ping=True,
    )
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    return engine, factory


def get_engine() -> AsyncEngine:
    return _engine_bundle()[0]


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    return _engine_bundle()[1]


def __getattr__(name: str):
    if name == "engine":
        return get_engine()
    if name == "async_session_factory":
        return get_session_factory()
    raise AttributeError(name)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    factory = get_session_factory()
    async with factory() as session:
        yield session


async def init_db() -> None:
    from app.models.analysis import AnalysisRecord  # noqa: F401

    eng = get_engine()
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

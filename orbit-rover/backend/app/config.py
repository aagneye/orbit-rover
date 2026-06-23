from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Orbit Rover"
    app_version: str = "0.1.0"
    debug: bool = False

    # GitLab
    gitlab_url: str = "https://gitlab.com"
    gitlab_token: str = ""
    gitlab_webhook_secret: str = ""

    # Orbit Knowledge Graph API
    orbit_enabled: bool = True
    orbit_use_mock: bool = True

    # LLM
    llm_provider: Literal["mock", "openai", "anthropic", "ollama"] = "mock"
    openai_api_key: str = ""
    openai_model: str = "gpt-4.1"
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-4-20250514"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2"

    # Database
    database_url: str = "sqlite+aiosqlite:///./data/orbit_rover.db"

    # Analysis behavior
    post_mr_comment: bool = True
    max_log_lines: int = 500
    recent_commits_count: int = 10
    cors_origins: str = "http://localhost:3000"
    dashboard_base_url: str = "http://localhost:3000"
    public_api_url: str = "http://localhost:8000"

    # GitLab OAuth (dashboard login — no Google)
    auth_enabled: bool = False
    gitlab_oauth_client_id: str = ""
    gitlab_oauth_client_secret: str = ""
    gitlab_oauth_redirect_uri: str = "http://localhost:8000/auth/gitlab/callback"
    gitlab_oauth_scopes: str = "read_user api read_api"
    session_secret: str = "change-me-in-production"
    session_max_age: int = 60 * 60 * 24 * 7  # 7 days
    session_cookie_secure: bool = False  # set True in production (HTTPS)


def normalize_database_url(url: str) -> str:
    """Neon/Railway give postgresql:// — convert for SQLAlchemy async."""
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    return url


@lru_cache
def get_settings() -> Settings:
    return Settings()

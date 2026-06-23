from functools import lru_cache
import os
from typing import Literal, Self

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

PRODUCTION_API_URL = "https://orbit-rover-api.onrender.com"
PRODUCTION_DASHBOARD_URL = "https://orbit-rover.vercel.app"


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
    database_url: str = ""  # empty = auto (SQLite /tmp on Render, ./data locally)

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

    @model_validator(mode="after")
    def apply_render_defaults(self) -> Self:
        """Render sets RENDER=true; apply production URLs when env vars are unset."""
        if os.environ.get("RENDER") != "true":
            return self

        if os.environ.get("AUTH_ENABLED") is None:
            self.auth_enabled = True
        if os.environ.get("SESSION_COOKIE_SECURE") is None:
            self.session_cookie_secure = True
        if not os.environ.get("PUBLIC_API_URL") and self.public_api_url == "http://localhost:8000":
            self.public_api_url = PRODUCTION_API_URL
        if not os.environ.get("DASHBOARD_BASE_URL") and self.dashboard_base_url == "http://localhost:3000":
            self.dashboard_base_url = PRODUCTION_DASHBOARD_URL
        if not os.environ.get("CORS_ORIGINS") and self.cors_origins == "http://localhost:3000":
            self.cors_origins = PRODUCTION_DASHBOARD_URL
        if (
            not os.environ.get("GITLAB_OAUTH_REDIRECT_URI")
            and self.gitlab_oauth_redirect_uri == "http://localhost:8000/auth/gitlab/callback"
        ):
            self.gitlab_oauth_redirect_uri = f"{self.public_api_url.rstrip('/')}/auth/gitlab/callback"
        return self

    @property
    def oauth_configured(self) -> bool:
        return bool(self.gitlab_oauth_client_id and self.gitlab_oauth_client_secret)


@lru_cache
def get_settings() -> Settings:
    return Settings()

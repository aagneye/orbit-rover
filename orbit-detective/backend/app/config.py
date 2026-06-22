from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Orbit Detective"
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
    database_url: str = "sqlite+aiosqlite:///./data/orbit_detective.db"

    # Analysis behavior
    post_mr_comment: bool = True
    max_log_lines: int = 500
    recent_commits_count: int = 10
    cors_origins: str = "http://localhost:3000"
    dashboard_base_url: str = "http://localhost:3000"
    public_api_url: str = "http://localhost:8000"


@lru_cache
def get_settings() -> Settings:
    return Settings()

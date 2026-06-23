"""GitLab OAuth2 — dashboard login only (no Google)."""

import secrets
from typing import Any
from urllib.parse import urlencode

import httpx
from jose import JWTError, jwt

from app.config import Settings

ALGORITHM = "HS256"
STATE_COOKIE = "orbit_oauth_state"


def gitlab_authorize_url(settings: Settings, state: str) -> str:
  params = {
    "client_id": settings.gitlab_oauth_client_id,
    "redirect_uri": settings.gitlab_oauth_redirect_uri,
    "response_type": "code",
    "scope": settings.gitlab_oauth_scopes,
    "state": state,
  }
  base = settings.gitlab_url.rstrip("/")
  return f"{base}/oauth/authorize?{urlencode(params)}"


async def exchange_code(settings: Settings, code: str) -> dict[str, Any]:
  base = settings.gitlab_url.rstrip("/")
  async with httpx.AsyncClient(timeout=30.0) as client:
    response = await client.post(
      f"{base}/oauth/token",
      data={
        "client_id": settings.gitlab_oauth_client_id,
        "client_secret": settings.gitlab_oauth_client_secret,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": settings.gitlab_oauth_redirect_uri,
      },
    )
    response.raise_for_status()
    return response.json()


async def fetch_gitlab_user(settings: Settings, access_token: str) -> dict[str, Any]:
  base = settings.gitlab_url.rstrip("/")
  async with httpx.AsyncClient(timeout=30.0) as client:
    response = await client.get(
      f"{base}/api/v4/user",
      headers={"Authorization": f"Bearer {access_token}"},
    )
    response.raise_for_status()
    return response.json()


def create_session_token(settings: Settings, user: dict[str, Any]) -> str:
  payload = {
    "sub": str(user.get("id")),
    "username": user.get("username"),
    "name": user.get("name"),
    "avatar_url": user.get("avatar_url"),
  }
  return jwt.encode(payload, settings.session_secret, algorithm=ALGORITHM)


def decode_session_token(settings: Settings, token: str) -> dict[str, Any] | None:
  try:
    return jwt.decode(token, settings.session_secret, algorithms=[ALGORITHM])
  except JWTError:
    return None


def new_oauth_state() -> str:
  return secrets.token_urlsafe(32)

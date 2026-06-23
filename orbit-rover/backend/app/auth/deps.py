"""Require GitLab login for dashboard API when AUTH_ENABLED=true."""

from fastapi import Depends, HTTPException, Request

from app.config import Settings, get_settings


def get_current_user(request: Request, settings: Settings = Depends(get_settings)) -> dict | None:
  from app.auth.gitlab_oauth import decode_session_token

  if not settings.auth_enabled:
    return {"username": "dev", "name": "Local Dev", "auth_disabled": True}

  token = request.cookies.get("orbit_session")
  if not token:
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
      token = auth_header[7:]
  if not token:
    return None
  return decode_session_token(settings, token)


def require_user(user: dict | None = Depends(get_current_user), settings: Settings = Depends(get_settings)) -> dict:
  if not settings.auth_enabled:
    return user or {"username": "dev", "auth_disabled": True}
  if user is None:
    raise HTTPException(status_code=401, detail="Sign in with GitLab to view the dashboard")
  return user

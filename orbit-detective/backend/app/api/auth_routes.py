"""GitLab OAuth login routes for the manager dashboard."""

import logging

from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import RedirectResponse

from app.auth.gitlab_oauth import (
  STATE_COOKIE,
  create_session_token,
  decode_session_token,
  exchange_code,
  fetch_gitlab_user,
  gitlab_authorize_url,
  new_oauth_state,
)
from app.config import Settings, get_settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth/gitlab", tags=["auth"])

SESSION_COOKIE = "orbit_session"


def get_current_user(request: Request, settings: Settings = Depends(get_settings)) -> dict | None:
  if not settings.auth_enabled:
    return {"username": "dev", "name": "Local Dev", "auth_disabled": True}
  token = request.cookies.get(SESSION_COOKIE)
  if not token:
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
      token = auth_header[7:]
  if not token:
    return None
  return decode_session_token(settings, token)


@router.get("/login")
async def login(settings: Settings = Depends(get_settings)) -> RedirectResponse:
  if not settings.gitlab_oauth_client_id:
    raise HTTPException(status_code=503, detail="GitLab OAuth not configured — set GITLAB_OAUTH_CLIENT_ID")
  state = new_oauth_state()
  response = RedirectResponse(url=gitlab_authorize_url(settings, state), status_code=302)
  response.set_cookie(STATE_COOKIE, state, httponly=True, max_age=600, samesite="lax")
  return response


@router.get("/callback")
async def callback(
  request: Request,
  code: str | None = None,
  state: str | None = None,
  settings: Settings = Depends(get_settings),
) -> RedirectResponse:
  saved_state = request.cookies.get(STATE_COOKIE)
  if not code or not state or state != saved_state:
    raise HTTPException(status_code=400, detail="Invalid OAuth state — try signing in again")

  token_data = await exchange_code(settings, code)
  user = await fetch_gitlab_user(settings, token_data["access_token"])
  session = create_session_token(settings, user)

  params = urlencode({"session": session})
  redirect = RedirectResponse(url=f"{settings.dashboard_base_url}/auth/callback?{params}", status_code=302)
  redirect.set_cookie(
    SESSION_COOKIE,
    session,
    httponly=True,
    max_age=settings.session_max_age,
    samesite="none" if settings.session_cookie_secure else "lax",
    secure=settings.session_cookie_secure,
  )
  redirect.delete_cookie(STATE_COOKIE)
  logger.info("GitLab login: %s", user.get("username"))
  return redirect


@router.get("/logout")
async def logout(settings: Settings = Depends(get_settings)) -> RedirectResponse:
  response = RedirectResponse(url=settings.dashboard_base_url, status_code=302)
  response.delete_cookie(SESSION_COOKIE)
  return response


@router.get("/me")
async def me(user: dict | None = Depends(get_current_user)) -> dict:
  if not user:
    raise HTTPException(status_code=401, detail="Not signed in")
  return user

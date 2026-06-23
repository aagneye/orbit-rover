"""Server-Sent Events — realtime dashboard updates without Supabase."""

import asyncio
import json
import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from app.auth.deps import get_current_user
from app.auth.gitlab_oauth import decode_session_token
from app.config import Settings, get_settings
from app.database import get_db
from app.models.analysis import AnalysisRecord
from app.services.analyzer import list_analyses

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["stream"])

POLL_SECONDS = 8


@router.get("/analyses/stream")
async def analyses_stream(
  request: Request,
  token: str | None = None,
  settings: Settings = Depends(get_settings),
  db: AsyncSession = Depends(get_db),
):
  """Push new analyses to the dashboard every few seconds."""

  if settings.auth_enabled:
    session = token or request.cookies.get("orbit_session")
    if not session or not decode_session_token(settings, session):
      raise HTTPException(status_code=401, detail="Sign in required")

  async def event_generator():
    last_count = -1
    while True:
      if await request.is_disconnected():
        break
      try:
        result = await db.execute(select(AnalysisRecord).order_by(AnalysisRecord.created_at.desc()).limit(50))
        records = result.scalars().all()
        count = len(records)
        if count != last_count:
          items = await list_analyses(db, limit=50)
          payload = [item.model_dump(mode="json") for item in items]
          yield {"event": "analyses", "data": json.dumps(payload, default=str)}
          last_count = count
        else:
          yield {"event": "ping", "data": "{}"}
      except Exception as exc:
        logger.warning("SSE poll error: %s", exc)
        yield {"event": "error", "data": json.dumps({"message": str(exc)})}
      await asyncio.sleep(POLL_SECONDS)

  return EventSourceResponse(event_generator())

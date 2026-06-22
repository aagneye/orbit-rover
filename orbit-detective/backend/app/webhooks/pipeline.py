import logging
from typing import Any

from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.database import async_session_factory, get_db
from app.models.schemas import PipelineWebhookPayload
from app.services.analyzer import PipelineAnalyzer
from app.utils.helpers import verify_gitlab_token

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/webhooks", tags=["webhooks"])


async def _run_analysis(payload: PipelineWebhookPayload, settings: Settings) -> None:
  async with async_session_factory() as db:
    analyzer = PipelineAnalyzer(settings)
    try:
      await analyzer.process_pipeline_failure(db, payload)
    except Exception:
      logger.exception("Background analysis failed for pipeline %s", payload.object_attributes.id)


@router.post("/gitlab/pipeline")
async def gitlab_pipeline_webhook(
  request: Request,
  background_tasks: BackgroundTasks,
  x_gitlab_token: str | None = Header(default=None, alias="X-Gitlab-Token"),
  x_gitlab_event: str | None = Header(default=None, alias="X-Gitlab-Event"),
  settings: Settings = Depends(get_settings),
) -> dict[str, Any]:
  if not verify_gitlab_token(x_gitlab_token, settings.gitlab_webhook_secret):
    raise HTTPException(status_code=403, detail="Invalid webhook token")

  body = await request.json()
  if body.get("object_kind") != "pipeline":
    return {"status": "ignored", "reason": "not a pipeline event"}

  payload = PipelineWebhookPayload.model_validate(body)

  if not payload.is_failed:
    return {
      "status": "ignored",
      "reason": f"pipeline status is {payload.object_attributes.status}",
    }

  logger.info(
    "Pipeline failure received: project=%s pipeline=%s ref=%s",
    payload.project.path_with_namespace,
    payload.object_attributes.id,
    payload.object_attributes.ref,
  )

  background_tasks.add_task(_run_analysis, payload, settings)

  return {
    "status": "accepted",
    "pipeline_id": payload.object_attributes.id,
    "project": payload.project.path_with_namespace,
    "message": "Analysis queued",
  }


@router.post("/gitlab/pipeline/sync")
async def gitlab_pipeline_webhook_sync(
  request: Request,
  x_gitlab_token: str | None = Header(default=None, alias="X-Gitlab-Token"),
  settings: Settings = Depends(get_settings),
  db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
  """Synchronous endpoint for demos and testing."""
  if not verify_gitlab_token(x_gitlab_token, settings.gitlab_webhook_secret):
    raise HTTPException(status_code=403, detail="Invalid webhook token")

  body = await request.json()
  payload = PipelineWebhookPayload.model_validate(body)

  if not payload.is_failed:
    return {"status": "ignored", "reason": "pipeline did not fail"}

  analyzer = PipelineAnalyzer(settings)
  record = await analyzer.process_pipeline_failure(db, payload)

  return {
    "status": "completed",
    "analysis_id": record.id,
    "cause": record.cause,
    "confidence": record.confidence,
  }

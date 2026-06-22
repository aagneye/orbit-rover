from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.database import get_db
from app.services.analyzer import get_analysis, list_analyses

router = APIRouter(prefix="/api", tags=["api"])


@router.get("/health")
async def health(settings: Settings = Depends(get_settings)) -> dict[str, str]:
  return {
    "status": "healthy",
    "app": settings.app_name,
    "version": settings.app_version,
    "llm_provider": settings.llm_provider,
  }


@router.get("/analyses")
async def analyses(limit: int = 50, db: AsyncSession = Depends(get_db)) -> list[dict[str, Any]]:
  items = await list_analyses(db, limit=limit)
  return [item.model_dump(mode="json") for item in items]


@router.get("/analyses/{analysis_id}")
async def analysis_detail(analysis_id: str, db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
  record = await get_analysis(db, analysis_id)
  if not record:
    raise HTTPException(status_code=404, detail="Analysis not found")
  return {
    "id": record.id,
    "project_path": record.project_path,
    "pipeline_id": record.pipeline_id,
    "pipeline_iid": record.pipeline_iid,
    "pipeline_url": record.pipeline_url,
    "branch": record.branch,
    "status": record.status,
    "mr_iid": record.mr_iid,
    "mr_url": record.mr_url,
    "cause": record.cause,
    "confidence": record.confidence,
    "summary": record.summary,
    "report": record.report_json,
    "context": record.context_json,
    "mr_comment_posted": record.mr_comment_posted,
    "provider": record.provider,
    "model": record.model,
    "created_at": record.created_at.isoformat(),
  }


@router.get("/stats")
async def stats(db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
  items = await list_analyses(db, limit=1000)
  if not items:
    return {"total": 0, "avg_confidence": 0, "projects": []}

  projects = list({i.project_path for i in items})
  avg_conf = sum(i.confidence for i in items) / len(items)
  return {
    "total": len(items),
    "avg_confidence": round(avg_conf, 2),
    "projects": projects,
  }

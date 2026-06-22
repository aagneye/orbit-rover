from collections import Counter
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.database import get_db
from app.models.analysis import AnalysisRecord
from app.services.analyzer import get_analysis, list_analyses
from app.services.gitlab import GitLabClient

router = APIRouter(prefix="/api", tags=["api"])

MINUTES_SAVED_PER_ANALYSIS = 198  # ~3h 18m per manual investigation avoided


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


@router.get("/analyses/{analysis_id}/create-issue")
async def create_fix_issue(
  analysis_id: str,
  db: AsyncSession = Depends(get_db),
  settings: Settings = Depends(get_settings),
) -> RedirectResponse:
  """One-click from GitLab MR comment — creates a fix issue and redirects to GitLab."""
  record = await get_analysis(db, analysis_id)
  if not record:
    raise HTTPException(status_code=404, detail="Analysis not found")

  existing = (record.report_json or {}).get("_fix_issue_url")
  if existing:
    return RedirectResponse(url=existing, status_code=302)

  if not settings.gitlab_token:
    demo_url = record.mr_url or record.pipeline_url or settings.gitlab_url
    return RedirectResponse(url=demo_url, status_code=302)

  report = record.report_json or {}
  fixes = report.get("suggested_fixes", [])
  fix_text = "\n".join(f"- [{f.get('priority', 'medium').upper()}] {f.get('action')}" for f in fixes)

  description = f"""## Pipeline Failure — Fix Request

**Root Cause:** {record.cause}

**Confidence:** {int(record.confidence * 100)}%

**Summary:** {record.summary}

### Recommended Fixes
{fix_text or '_See Orbit Detective analysis on the merge request._'}

---
<sub>Created by [Orbit Detective]({settings.dashboard_base_url}/analyses/{analysis_id}) · Pipeline [#{record.pipeline_iid}]({record.pipeline_url or '#'})</sub>
"""

  gitlab = GitLabClient(settings)
  issue = await gitlab.create_issue(
    record.project_id,
    title=f"[Orbit Detective] Fix: {record.cause[:80]}",
    description=description,
    labels=["orbit-detective", "pipeline-failure", "bug"],
  )

  issue_url = issue.get("web_url", settings.gitlab_url)
  updated_report = dict(record.report_json or {})
  updated_report["_fix_issue_url"] = issue_url
  record.report_json = updated_report
  await db.commit()

  return RedirectResponse(url=issue_url, status_code=302)


def _format_duration(minutes: int) -> str:
  hours, mins = divmod(minutes, 60)
  if hours:
    return f"{hours}h {mins}m"
  return f"{mins}m"


def _service_label(project_path: str) -> str:
  name = project_path.split("/")[-1].replace("-", " ").title()
  return f"{name} Pipeline"


@router.get("/stats")
async def stats(db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
  result = await db.execute(select(AnalysisRecord).order_by(AnalysisRecord.created_at.desc()).limit(1000))
  records = result.scalars().all()

  if not records:
    return {
      "total": 0,
      "avg_confidence": 0,
      "projects": [],
      "avg_time_saved": "0m",
      "avg_time_saved_minutes": 0,
      "most_common_failure": "—",
      "top_affected_teams": [],
      "recent_failures": [],
      "latest_analysis": None,
    }

  causes = [r.cause for r in records]
  cause_counter = Counter(causes)
  team_counter: Counter[str] = Counter()
  for r in records:
    teams = (r.report_json or {}).get("affected_teams") or (r.report_json or {}).get("blast_radius", {}).get("teams", [])
    for t in teams:
      team_counter[t] += 1

  total_minutes = len(records) * MINUTES_SAVED_PER_ANALYSIS
  latest = records[0]

  return {
    "total": len(records),
    "avg_confidence": round(sum(r.confidence for r in records) / len(records), 2),
    "projects": list({r.project_path for r in records}),
    "avg_time_saved": _format_duration(total_minutes),
    "avg_time_saved_minutes": total_minutes,
    "most_common_failure": cause_counter.most_common(1)[0][0] if causes else "—",
    "top_affected_teams": [t for t, _ in team_counter.most_common(5)],
    "recent_failures": [
      {
        "id": r.id,
        "label": _service_label(r.project_path),
        "project_path": r.project_path,
        "cause": r.cause,
        "confidence": r.confidence,
        "mr_url": r.mr_url,
        "pipeline_url": r.pipeline_url,
        "created_at": r.created_at.isoformat(),
      }
      for r in records[:8]
    ],
    "latest_analysis": {
      "id": latest.id,
      "cause": latest.cause,
      "confidence": latest.confidence,
      "summary": latest.summary,
      "mr_url": latest.mr_url,
      "pipeline_url": latest.pipeline_url,
      "gitlab_link": latest.mr_url or latest.pipeline_url,
    },
  }

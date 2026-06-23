import logging
import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings
from app.models.analysis import AnalysisRecord
from app.models.schemas import (
  AnalysisReport,
  AnalysisSummary,
  InvestigationContext,
  PipelineWebhookPayload,
)
from app.services.gitlab import GitLabClient
from app.services.llm import LLMService
from app.services.orbit import OrbitClient
from app.utils.markdown import format_mr_comment

logger = logging.getLogger(__name__)


class PipelineAnalyzer:
  def __init__(self, settings: Settings):
    self.settings = settings
    self.gitlab = GitLabClient(settings)
    self.orbit = OrbitClient(settings)
    self.llm = LLMService(settings)

  async def collect_context(self, payload: PipelineWebhookPayload) -> InvestigationContext:
    project_id = payload.project.id
    pipeline_id = payload.object_attributes.id
    ref = payload.object_attributes.ref

    failed_jobs = [b for b in payload.builds if b.status == "failed"]
    if not failed_jobs:
      try:
        api_jobs = await self.gitlab.get_pipeline_jobs(project_id, pipeline_id)
        failed_jobs_data = [j for j in api_jobs if j.get("status") == "failed"]
        from app.models.schemas import BuildInfo

        failed_jobs = [
          BuildInfo(
            id=j["id"],
            stage=j.get("stage", ""),
            name=j.get("name", ""),
            status=j.get("status", ""),
            failure_reason=j.get("failure_reason"),
          )
          for j in failed_jobs_data
        ]
      except Exception as exc:
        logger.warning("Could not fetch pipeline jobs from API: %s", exc)

    failed_builds_dicts = [j.model_dump() for j in failed_jobs]
    job_logs = await self.gitlab.collect_failed_job_logs(
      project_id, pipeline_id, failed_builds_dicts
    )

    merge_request = payload.merge_request
    if merge_request and merge_request.iid:
      try:
        if self.settings.gitlab_token:
          merge_request = await self.gitlab.get_merge_request(project_id, merge_request.iid)
      except Exception as exc:
        logger.warning("Could not fetch MR from GitLab API, using webhook data: %s", exc)
    elif ref:
      merge_request = await self.gitlab.find_mr_for_branch(project_id, ref)

    recent_commits = []
    try:
      if self.settings.gitlab_token:
        recent_commits = await self.gitlab.get_recent_commits(project_id, ref)
    except Exception as exc:
      logger.warning("Could not fetch commits from GitLab API: %s", exc)

    service_name = payload.project.path_with_namespace.split("/")[-1]
    orbit_context = await self.orbit.investigate_pipeline_failure(
      payload.project.path_with_namespace,
      project_id,
      pipeline_id,
      service_name,
    )

    return InvestigationContext(
      webhook=payload,
      failed_jobs=failed_jobs,
      job_logs=job_logs,
      merge_request=merge_request,
      recent_commits=recent_commits,
      orbit=orbit_context,
      collected_at=datetime.utcnow(),
    )

  async def analyze(self, payload: PipelineWebhookPayload) -> tuple[InvestigationContext, AnalysisReport]:
    context = await self.collect_context(payload)
    report = await self.llm.analyze(context)
    return context, report

  async def save_analysis(
    self,
    db: AsyncSession,
    context: InvestigationContext,
    report: AnalysisReport,
    mr_comment_posted: bool = False,
  ) -> AnalysisRecord:
    webhook = context.webhook
    record = AnalysisRecord(
      id=str(uuid.uuid4()),
      project_id=webhook.project.id,
      project_path=webhook.project.path_with_namespace,
      pipeline_id=webhook.object_attributes.id,
      pipeline_iid=webhook.object_attributes.iid,
      pipeline_url=webhook.object_attributes.url,
      branch=webhook.object_attributes.ref,
      status=webhook.object_attributes.status,
      mr_iid=context.merge_request.iid if context.merge_request else None,
      mr_url=context.merge_request.url if context.merge_request else None,
      cause=report.cause,
      confidence=report.confidence,
      summary=report.summary,
      report_json=report.model_dump(),
      context_json=context.model_dump(mode="json"),
      provider=report.provider,
      model=report.model,
      mr_comment_posted=mr_comment_posted,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record

  async def post_mr_comment(
    self, context: InvestigationContext, report: AnalysisReport, analysis_id: str
  ) -> bool:
    if not self.settings.post_mr_comment:
      return False
    mr = context.merge_request
    if not mr or not mr.iid:
      logger.info("No merge request found — skipping MR comment")
      return False
    if not self.settings.gitlab_token:
      logger.warning("GITLAB_TOKEN not set — skipping MR comment (demo mode: comment logged only)")
      body = format_mr_comment(
        report, context, analysis_id,
        self.settings.dashboard_base_url, self.settings.public_api_url,
      )
      logger.info("MR comment preview:\n%s", body[:500])
      return False

    body = format_mr_comment(
      report, context, analysis_id,
      self.settings.dashboard_base_url, self.settings.public_api_url,
    )
    try:
      await self.gitlab.post_merge_request_note(
        context.webhook.project.id, mr.iid, body
      )
      return True
    except Exception as exc:
      logger.error("Failed to post MR comment: %s", exc)
      return False

  async def process_pipeline_failure(
    self, db: AsyncSession, payload: PipelineWebhookPayload
  ) -> AnalysisRecord:
    context, report = await self.analyze(payload)
    record = await self.save_analysis(db, context, report, mr_comment_posted=False)
    comment_posted = await self.post_mr_comment(context, report, record.id)
    if comment_posted != record.mr_comment_posted:
      record.mr_comment_posted = comment_posted
      await db.commit()
      await db.refresh(record)
    logger.info(
      "Analysis complete for pipeline %s — confidence %.0f%%",
      payload.object_attributes.id,
      report.confidence * 100,
    )
    return record


async def list_analyses(db: AsyncSession, limit: int = 50) -> list[AnalysisSummary]:
  result = await db.execute(
    select(AnalysisRecord).order_by(AnalysisRecord.created_at.desc()).limit(limit)
  )
  records = result.scalars().all()
  return [
    AnalysisSummary(
      id=r.id,
      project_path=r.project_path,
      pipeline_id=r.pipeline_id,
      pipeline_iid=r.pipeline_iid,
      pipeline_url=r.pipeline_url,
      branch=r.branch,
      status=r.status,
      cause=r.cause,
      confidence=r.confidence,
      summary=r.summary,
      mr_iid=r.mr_iid,
      mr_url=r.mr_url,
      created_at=r.created_at,
      provider=r.provider,
      model=r.model,
    )
    for r in records
  ]


async def get_analysis(db: AsyncSession, analysis_id: str) -> AnalysisRecord | None:
  result = await db.execute(select(AnalysisRecord).where(AnalysisRecord.id == analysis_id))
  return result.scalar_one_or_none()

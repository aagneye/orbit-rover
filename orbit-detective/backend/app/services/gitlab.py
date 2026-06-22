import logging
from typing import Any

import httpx

from app.config import Settings
from app.models.schemas import CommitInfo, JobLogEntry, MergeRequestInfo
from app.utils.helpers import truncate_log

logger = logging.getLogger(__name__)


class GitLabClient:
  def __init__(self, settings: Settings):
    self.base_url = settings.gitlab_url.rstrip("/")
    self.token = settings.gitlab_token
    self.max_log_lines = settings.max_log_lines
    self.recent_commits_count = settings.recent_commits_count
    self._headers = {"PRIVATE-TOKEN": self.token} if self.token else {}

  async def _get(self, path: str, params: dict[str, Any] | None = None) -> Any:
    url = f"{self.base_url}/api/v4{path}"
    async with httpx.AsyncClient(timeout=60.0) as client:
      response = await client.get(url, headers=self._headers, params=params)
      response.raise_for_status()
      return response.json()

  async def get_pipeline_jobs(self, project_id: int, pipeline_id: int) -> list[dict[str, Any]]:
    return await self._get(f"/projects/{project_id}/pipelines/{pipeline_id}/jobs")

  async def get_job_trace(self, project_id: int, job_id: int) -> str:
    url = f"{self.base_url}/api/v4/projects/{project_id}/jobs/{job_id}/trace"
    async with httpx.AsyncClient(timeout=60.0) as client:
      response = await client.get(url, headers=self._headers)
      response.raise_for_status()
      return response.text

  async def get_merge_request(self, project_id: int, mr_iid: int) -> MergeRequestInfo:
    data = await self._get(f"/projects/{project_id}/merge_requests/{mr_iid}")
    return MergeRequestInfo(
      id=data.get("id"),
      iid=data.get("iid"),
      title=data.get("title"),
      source_branch=data.get("source_branch"),
      target_branch=data.get("target_branch"),
      url=data.get("web_url"),
      state=data.get("state"),
    )

  async def get_recent_commits(self, project_id: int, ref: str) -> list[CommitInfo]:
    data = await self._get(
      f"/projects/{project_id}/repository/commits",
      params={"ref_name": ref, "per_page": self.recent_commits_count},
    )
    commits: list[CommitInfo] = []
    for item in data:
      commits.append(
        CommitInfo(
          id=item["id"],
          short_id=item.get("short_id"),
          title=item.get("title"),
          message=item.get("message"),
          author_name=item.get("author_name"),
          authored_date=item.get("authored_date"),
          web_url=item.get("web_url"),
        )
      )
    return commits

  async def collect_failed_job_logs(
    self, project_id: int, pipeline_id: int, failed_builds: list[dict[str, Any]]
  ) -> list[JobLogEntry]:
    logs: list[JobLogEntry] = []
    for build in failed_builds:
      job_id = build["id"]
      try:
        trace = await self.get_job_trace(project_id, job_id)
        logs.append(
          JobLogEntry(
            job_id=job_id,
            job_name=build.get("name", "unknown"),
            stage=build.get("stage", "unknown"),
            status=build.get("status", "failed"),
            log_tail=truncate_log(trace, self.max_log_lines),
          )
        )
      except httpx.HTTPError as exc:
        logger.error("Failed to fetch job trace for job %s: %s", job_id, exc)
        logs.append(
          JobLogEntry(
            job_id=job_id,
            job_name=build.get("name", "unknown"),
            stage=build.get("stage", "unknown"),
            status=build.get("status", "failed"),
            log_tail=f"[Could not retrieve log: {exc}]",
          )
        )
    return logs

  async def post_merge_request_note(self, project_id: int, mr_iid: int, body: str) -> dict[str, Any]:
    url = f"{self.base_url}/api/v4/projects/{project_id}/merge_requests/{mr_iid}/notes"
    async with httpx.AsyncClient(timeout=30.0) as client:
      response = await client.post(url, headers=self._headers, json={"body": body})
      response.raise_for_status()
      return response.json()

  async def create_issue(
    self, project_id: int, title: str, description: str, labels: list[str] | None = None
  ) -> dict[str, Any]:
    url = f"{self.base_url}/api/v4/projects/{project_id}/issues"
    payload: dict[str, Any] = {"title": title, "description": description}
    if labels:
      payload["labels"] = ",".join(labels)
    async with httpx.AsyncClient(timeout=30.0) as client:
      response = await client.post(url, headers=self._headers, json=payload)
      response.raise_for_status()
      return response.json()

  async def find_mr_for_branch(self, project_id: int, branch: str) -> MergeRequestInfo | None:
    try:
      data = await self._get(
        f"/projects/{project_id}/merge_requests",
        params={"state": "opened", "source_branch": branch},
      )
      if not data:
        return None
      mr = data[0]
      return MergeRequestInfo(
        id=mr.get("id"),
        iid=mr.get("iid"),
        title=mr.get("title"),
        source_branch=mr.get("source_branch"),
        target_branch=mr.get("target_branch"),
        url=mr.get("web_url"),
        state=mr.get("state"),
      )
    except httpx.HTTPError:
      return None

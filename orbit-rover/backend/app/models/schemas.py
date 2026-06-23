from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class ProjectInfo(BaseModel):
    id: int
    name: str
    path_with_namespace: str
    web_url: str
    default_branch: str = "main"


class PipelineAttributes(BaseModel):
    id: int
    iid: int
    ref: str
    sha: str
    status: str
    source: str | None = None
    url: str | None = None
    created_at: str | None = None
    finished_at: str | None = None
    name: str | None = None


class MergeRequestInfo(BaseModel):
    id: int | None = None
    iid: int | None = None
    title: str | None = None
    source_branch: str | None = None
    target_branch: str | None = None
    url: str | None = None
    state: str | None = None


class BuildInfo(BaseModel):
    id: int
    stage: str
    name: str
    status: str
    failure_reason: str | None = None


class CommitInfo(BaseModel):
    id: str
    short_id: str | None = None
    title: str | None = None
    message: str | None = None
    author_name: str | None = None
    authored_date: str | None = None
    web_url: str | None = None


class PipelineWebhookPayload(BaseModel):
    object_kind: str
    object_attributes: PipelineAttributes
    project: ProjectInfo
    merge_request: MergeRequestInfo | None = None
    commit: dict[str, Any] | None = None
    builds: list[BuildInfo] = Field(default_factory=list)

    @property
    def is_failed(self) -> bool:
        return self.object_attributes.status in {"failed", "canceled"}


class JobLogEntry(BaseModel):
    job_id: int
    job_name: str
    stage: str
    status: str
    log_tail: str


class DependencyEdge(BaseModel):
    source_service: str
    target_service: str
    relationship: str = "depends_on"


class ServiceOwner(BaseModel):
    service: str
    team: str
    owner: str | None = None
    contact: str | None = None


class OrbitContext(BaseModel):
    available: bool = False
    dependencies: list[DependencyEdge] = Field(default_factory=list)
    affected_services: list[str] = Field(default_factory=list)
    service_owners: list[ServiceOwner] = Field(default_factory=list)
    related_merge_requests: list[dict[str, Any]] = Field(default_factory=list)
    raw_queries: list[str] = Field(default_factory=list)


class EvidenceItem(BaseModel):
    source: str
    summary: str
    detail: str | None = None
    timestamp: str | None = None


class AffectedService(BaseModel):
    name: str
    impact: str
    team: str | None = None


class BlastRadius(BaseModel):
    services: list[str] = Field(default_factory=list)
    teams: list[str] = Field(default_factory=list)
    severity: str = "medium"


class SuggestedFix(BaseModel):
    action: str
    priority: str = "medium"
    details: str | None = None


class AnalysisReport(BaseModel):
    cause: str
    confidence: float = Field(ge=0.0, le=1.0)
    summary: str
    evidence: list[EvidenceItem] = Field(default_factory=list)
    blast_radius: BlastRadius = Field(default_factory=BlastRadius)
    affected_services: list[AffectedService] = Field(default_factory=list)
    affected_teams: list[str] = Field(default_factory=list)
    suggested_fixes: list[SuggestedFix] = Field(default_factory=list)
    responsible_mr: dict[str, Any] | None = None
    reviewer: str | None = None
    breaking_change: str | None = None
    provider: str = "mock"
    model: str = "mock"


class InvestigationContext(BaseModel):
    webhook: PipelineWebhookPayload
    failed_jobs: list[BuildInfo] = Field(default_factory=list)
    job_logs: list[JobLogEntry] = Field(default_factory=list)
    merge_request: MergeRequestInfo | None = None
    recent_commits: list[CommitInfo] = Field(default_factory=list)
    orbit: OrbitContext = Field(default_factory=OrbitContext)
    collected_at: datetime = Field(default_factory=datetime.utcnow)


class AnalysisSummary(BaseModel):
    id: str
    project_path: str
    pipeline_id: int
    pipeline_iid: int
    pipeline_url: str | None
    branch: str
    status: str
    cause: str
    confidence: float
    summary: str
    mr_iid: int | None
    mr_url: str | None
    created_at: datetime
    provider: str
    model: str

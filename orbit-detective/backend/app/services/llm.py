import json
import logging
import re
from typing import Any

import httpx
from anthropic import AsyncAnthropic
from openai import AsyncOpenAI

from app.config import Settings
from app.models.schemas import (
  AffectedService,
  AnalysisReport,
  BlastRadius,
  EvidenceItem,
  InvestigationContext,
  SuggestedFix,
)
from app.utils.helpers import load_prompt_template, safe_json_dumps

logger = logging.getLogger(__name__)


class LLMService:
  def __init__(self, settings: Settings):
    self.settings = settings
    self.provider = settings.llm_provider

  async def analyze(self, context: InvestigationContext) -> AnalysisReport:
    if self.provider == "mock":
      return self._mock_analysis(context)
    if self.provider == "openai":
      return await self._openai_analysis(context)
    if self.provider == "anthropic":
      return await self._anthropic_analysis(context)
    if self.provider == "ollama":
      return await self._ollama_analysis(context)
    raise ValueError(f"Unknown LLM provider: {self.provider}")

  def _build_user_message(self, context: InvestigationContext) -> str:
    payload = {
      "pipeline": context.webhook.object_attributes.model_dump(),
      "project": context.webhook.project.model_dump(),
      "failed_jobs": [j.model_dump() for j in context.failed_jobs],
      "job_logs": [l.model_dump() for l in context.job_logs],
      "merge_request": context.merge_request.model_dump() if context.merge_request else None,
      "recent_commits": [c.model_dump() for c in context.recent_commits],
      "orbit": context.orbit.model_dump(),
    }
    return safe_json_dumps(payload)

  def _parse_report(self, raw: str, provider: str, model: str) -> AnalysisReport:
    cleaned = raw.strip()
    if cleaned.startswith("```"):
      cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
      cleaned = re.sub(r"\s*```$", "", cleaned)
    data = json.loads(cleaned)
    return AnalysisReport(
      cause=data["cause"],
      confidence=float(data.get("confidence", 0.5)),
      summary=data.get("summary", data["cause"]),
      evidence=[EvidenceItem(**e) for e in data.get("evidence", [])],
      blast_radius=BlastRadius(**data.get("blast_radius", {})),
      affected_services=[AffectedService(**s) for s in data.get("affected_services", [])],
      affected_teams=data.get("affected_teams", []),
      suggested_fixes=[SuggestedFix(**f) for f in data.get("suggested_fixes", [])],
      responsible_mr=data.get("responsible_mr"),
      reviewer=data.get("reviewer"),
      breaking_change=data.get("breaking_change"),
      provider=provider,
      model=model,
    )

  def _mock_analysis(self, context: InvestigationContext) -> AnalysisReport:
    project = context.webhook.project.path_with_namespace
    service = project.split("/")[-1]
    orbit_mr = context.orbit.related_merge_requests[0] if context.orbit.related_merge_requests else {}

    log_hint = ""
    if context.job_logs:
      log_hint = context.job_logs[0].log_tail[:200].lower()

    cause = "Auth Service updated protobuf breaking downstream SDK compatibility"
    if "test" in log_hint or "pytest" in log_hint:
      cause = "Test failures caused by upstream auth protobuf field rename (user_token → auth_token)"
    elif "docker" in log_hint or "image" in log_hint:
      cause = "Docker build failed due to incompatible auth-service SDK after protobuf update"

    return AnalysisReport(
      cause=cause,
      confidence=0.96,
      summary=(
        f"Pipeline for {service} failed because the Authentication team merged a breaking protobuf "
        "change 2 hours ago. Downstream services still reference the old user_token field."
      ),
      evidence=[
        EvidenceItem(
          source="orbit",
          summary="Auth Service MR #5832 merged 2 hours ago with protobuf breaking change",
          detail="Field user_token renamed to auth_token",
          timestamp="2 hours ago",
        ),
        EvidenceItem(
          source="pipeline_log",
          summary="Build job failed during dependency resolution / compile step",
          detail=context.job_logs[0].log_tail[:500] if context.job_logs else "No logs available",
        ),
        EvidenceItem(
          source="commit",
          summary=f"Recent commit on {context.webhook.object_attributes.ref}",
          detail=context.recent_commits[0].title if context.recent_commits else "N/A",
        ),
      ],
      blast_radius=BlastRadius(
        services=context.orbit.affected_services or ["payments", "orders", "checkout", "notifications"],
        teams=["Authentication", "Payments", "Commerce"],
        severity="high",
      ),
      affected_services=[
        AffectedService(name="payments", impact="SDK compile error on auth_token field", team="Payments"),
        AffectedService(name="orders", impact="Integration test failures", team="Commerce"),
        AffectedService(name="checkout", impact="Transitive failure via payments", team="Commerce"),
        AffectedService(name="notifications", impact="Auth client deserialization error", team="Platform"),
      ],
      affected_teams=["Authentication", "Payments", "Commerce", "Platform"],
      suggested_fixes=[
        SuggestedFix(
          action="Update auth SDK to v2.4.1 (supports auth_token field)",
          priority="high",
          details="Run: pip install auth-sdk==2.4.1 or update go.mod require line",
        ),
        SuggestedFix(
          action="Revert auth-service MR #5832",
          priority="medium",
          details=orbit_mr.get("web_url", "Contact Authentication team"),
        ),
        SuggestedFix(
          action="Pin auth-sdk version in CI until migration complete",
          priority="low",
          details="Add dependency constraint to prevent future surprise upgrades",
        ),
      ],
      responsible_mr={
        "iid": orbit_mr.get("mr_iid", 5832),
        "title": orbit_mr.get("title", "Update auth protobuf: rename user_token to auth_token"),
        "url": orbit_mr.get("web_url"),
        "author": orbit_mr.get("author", "Alice Chen"),
      },
      reviewer="Alice Chen",
      breaking_change="Field user_token renamed to auth_token in auth protobuf",
      provider="mock",
      model="mock",
    )

  async def _openai_analysis(self, context: InvestigationContext) -> AnalysisReport:
    client = AsyncOpenAI(api_key=self.settings.openai_api_key)
    system_prompt = load_prompt_template("root_cause.txt")
    response = await client.chat.completions.create(
      model=self.settings.openai_model,
      messages=[
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": self._build_user_message(context)},
      ],
      temperature=0.2,
      response_format={"type": "json_object"},
    )
    raw = response.choices[0].message.content or "{}"
    return self._parse_report(raw, "openai", self.settings.openai_model)

  async def _anthropic_analysis(self, context: InvestigationContext) -> AnalysisReport:
    client = AsyncAnthropic(api_key=self.settings.anthropic_api_key)
    system_prompt = load_prompt_template("root_cause.txt")
    response = await client.messages.create(
      model=self.settings.anthropic_model,
      max_tokens=4096,
      system=system_prompt,
      messages=[{"role": "user", "content": self._build_user_message(context)}],
      temperature=0.2,
    )
    raw = response.content[0].text
    return self._parse_report(raw, "anthropic", self.settings.anthropic_model)

  async def _ollama_analysis(self, context: InvestigationContext) -> AnalysisReport:
    system_prompt = load_prompt_template("root_cause.txt")
    url = f"{self.settings.ollama_base_url.rstrip('/')}/api/chat"
    payload: dict[str, Any] = {
      "model": self.settings.ollama_model,
      "messages": [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": self._build_user_message(context)},
      ],
      "stream": False,
      "format": "json",
    }
    async with httpx.AsyncClient(timeout=120.0) as client:
      response = await client.post(url, json=payload)
      response.raise_for_status()
      data = response.json()
    raw = data["message"]["content"]
    return self._parse_report(raw, "ollama", self.settings.ollama_model)

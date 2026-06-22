import logging
from typing import Any

import httpx

from app.config import Settings
from app.models.schemas import DependencyEdge, OrbitContext, ServiceOwner

logger = logging.getLogger(__name__)


class OrbitClient:
  """Client for GitLab Orbit Knowledge Graph API with mock fallback."""

  def __init__(self, settings: Settings):
    self.base_url = settings.gitlab_url.rstrip("/")
    self.token = settings.gitlab_token
    self.enabled = settings.orbit_enabled
    self.use_mock = settings.orbit_use_mock
    self._headers = {
      "PRIVATE-TOKEN": self.token,
      "Content-Type": "application/json",
    }

  async def check_status(self) -> bool:
    if not self.enabled or self.use_mock or not self.token:
      return False
    try:
      url = f"{self.base_url}/api/v4/orbit/status"
      async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, headers=self._headers)
        response.raise_for_status()
        data = response.json()
        return bool(data.get("user", {}).get("available"))
    except httpx.HTTPError as exc:
      logger.warning("Orbit status check failed: %s", exc)
      return False

  async def query(self, query: dict[str, Any]) -> dict[str, Any]:
    url = f"{self.base_url}/api/v4/orbit/query"
    async with httpx.AsyncClient(timeout=30.0) as client:
      response = await client.post(url, headers=self._headers, json={"query": query})
      response.raise_for_status()
      return response.json()

  async def investigate_pipeline_failure(
    self,
    project_path: str,
    project_id: int,
    pipeline_id: int,
    service_name: str | None = None,
  ) -> OrbitContext:
    if not self.enabled:
      return OrbitContext(available=False)

    orbit_available = await self.check_status()
    if not orbit_available or self.use_mock:
      return self._mock_context(project_path, service_name)

    try:
      return await self._live_context(project_path, project_id, pipeline_id)
    except httpx.HTTPError as exc:
      logger.warning("Orbit query failed, using mock: %s", exc)
      return self._mock_context(project_path, service_name)

  async def _live_context(
    self, project_path: str, project_id: int, pipeline_id: int
  ) -> OrbitContext:
    queries: list[str] = []

    pipeline_query = {
      "query_type": "search",
      "node": {
        "id": "pl",
        "entity": "Pipeline",
        "filters": {"id": pipeline_id},
      },
    }
    pipeline_result = await self.query(pipeline_query)
    queries.append(f"pipeline_search:{pipeline_id}")

    mr_query = {
      "query_type": "traversal",
      "nodes": [
        {"id": "p", "entity": "Project", "node_ids": [project_id]},
        {"id": "mr", "entity": "MergeRequest", "filters": {"state": "merged"}},
      ],
      "relationships": [{"type": "IN_PROJECT", "from": "mr", "to": "p"}],
    }
    mr_result = await self.query(mr_query)
    queries.append(f"recent_mrs:{project_path}")

    related_mrs = mr_result.get("result", [])[:5]

    return OrbitContext(
      available=True,
      dependencies=[],
      affected_services=[project_path.split("/")[-1]],
      service_owners=[],
      related_merge_requests=related_mrs,
      raw_queries=queries,
    )

  def _mock_context(self, project_path: str, service_name: str | None) -> OrbitContext:
    service = service_name or project_path.split("/")[-1]
    return OrbitContext(
      available=True,
      dependencies=[
        DependencyEdge(source_service="payments", target_service="auth-service", relationship="depends_on"),
        DependencyEdge(source_service="orders", target_service="auth-service", relationship="depends_on"),
        DependencyEdge(source_service="checkout", target_service="payments", relationship="depends_on"),
        DependencyEdge(source_service="notifications", target_service="auth-service", relationship="depends_on"),
        DependencyEdge(source_service=service, target_service="auth-service", relationship="depends_on"),
      ],
      affected_services=["payments", "orders", "checkout", "notifications", service],
      service_owners=[
        ServiceOwner(service="auth-service", team="Authentication", owner="Alice Chen", contact="@alice"),
        ServiceOwner(service="payments", team="Payments", owner="Bob Rivera", contact="@bob"),
        ServiceOwner(service="orders", team="Commerce", owner="Carol Kim", contact="@carol"),
        ServiceOwner(service=service, team="Platform", owner="Dev Team", contact="@platform"),
      ],
      related_merge_requests=[
        {
          "mr_iid": 5832,
          "title": "Update auth protobuf: rename user_token to auth_token",
          "author": "Alice Chen",
          "merged_at": "2 hours ago",
          "web_url": f"https://gitlab.com/aagneye-group/auth-service/-/merge_requests/5832",
        }
      ],
      raw_queries=["mock:dependency_graph", "mock:blast_radius", "mock:ownership"],
    )

import json
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


FIXTURE_PATH = Path(__file__).parent.parent / "fixtures" / "sample_pipeline_webhook.json"


@pytest.fixture
def sample_payload():
    return json.loads(FIXTURE_PATH.read_text())


@pytest.mark.asyncio
async def test_health():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app"] == "Orbit Rover"


@pytest.mark.asyncio
async def test_pipeline_webhook_ignores_success(sample_payload):
    sample_payload["object_attributes"]["status"] = "success"
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/webhooks/gitlab/pipeline", json=sample_payload)
    assert response.status_code == 200
    assert response.json()["status"] == "ignored"


@pytest.mark.asyncio
async def test_pipeline_webhook_sync_analysis(sample_payload):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/webhooks/gitlab/pipeline/sync", json=sample_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "completed"
    assert "analysis_id" in data
    assert data["confidence"] > 0.5

    detail = await client.get(f"/api/analyses/{data['analysis_id']}")
    assert detail.status_code == 200
    assert detail.json()["cause"]


@pytest.mark.asyncio
async def test_list_analyses():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/analyses")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

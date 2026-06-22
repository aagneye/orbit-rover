#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${ORBIT_API_URL:-http://localhost:8000}"
TOKEN="${GITLAB_WEBHOOK_SECRET:-orbit-detective-secret}"
FIXTURE="$(dirname "$0")/../backend/fixtures/sample_pipeline_webhook.json"

echo "🛰️  Orbit Detective Demo"
echo "API: $BASE_URL"
echo ""

curl -sf "$BASE_URL/api/health" | python -m json.tool

echo ""
echo "Triggering analysis..."
RESULT=$(curl -sf -X POST "$BASE_URL/webhooks/gitlab/pipeline/sync" \
  -H "Content-Type: application/json" \
  -H "X-Gitlab-Token: $TOKEN" \
  -d @"$FIXTURE")

echo "$RESULT" | python -m json.tool
ANALYSIS_ID=$(echo "$RESULT" | python -c "import sys,json; print(json.load(sys.stdin)['analysis_id'])")

echo ""
echo "Dashboard: http://localhost:3000"
echo "Detail:    http://localhost:3000/analyses/$ANALYSIS_ID"

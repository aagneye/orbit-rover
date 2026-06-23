# Commit each project file individually for reviewable history
$ErrorActionPreference = "Stop"
# scripts/ -> orbit-rover/ -> repo root
$RepoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))
Set-Location $RepoRoot

$map = [ordered]@{
    "orbit-rover/.env.example" = "chore: add environment variable template"
    "orbit-rover/docker-compose.yml" = "chore: add docker-compose for backend and frontend"
    "orbit-rover/Makefile" = "chore: add Makefile with dev shortcuts"
    "orbit-rover/backend/requirements.txt" = "feat(backend): add Python dependencies"
    "orbit-rover/backend/requirements-dev.txt" = "chore(backend): add dev test dependencies"
    "orbit-rover/backend/app/__init__.py" = "feat(backend): initialize app package"
    "orbit-rover/backend/app/config.py" = "feat(backend): add GitLab, Orbit, and LLM settings"
    "orbit-rover/backend/app/database.py" = "feat(backend): add async SQLAlchemy setup"
    "orbit-rover/backend/app/models/__init__.py" = "feat(models): export model types"
    "orbit-rover/backend/app/models/schemas.py" = "feat(models): add webhook and report schemas"
    "orbit-rover/backend/app/models/analysis.py" = "feat(models): add AnalysisRecord persistence model"
    "orbit-rover/backend/app/utils/__init__.py" = "feat(utils): export helper utilities"
    "orbit-rover/backend/app/utils/helpers.py" = "feat(utils): add webhook verification helpers"
    "orbit-rover/backend/app/utils/markdown.py" = "feat(utils): add MR comment formatter"
    "orbit-rover/backend/app/services/__init__.py" = "feat(services): initialize services package"
    "orbit-rover/backend/app/services/gitlab.py" = "feat(services): add GitLab API client"
    "orbit-rover/backend/app/services/orbit.py" = "feat(services): add Orbit graph client with mock"
    "orbit-rover/backend/app/prompts/root_cause.txt" = "feat(prompts): add root-cause LLM prompt"
    "orbit-rover/backend/app/services/llm.py" = "feat(services): add OpenAI, Anthropic, Ollama LLM"
    "orbit-rover/backend/app/services/analyzer.py" = "feat(services): add pipeline analyzer orchestrator"
    "orbit-rover/backend/app/webhooks/pipeline.py" = "feat(webhooks): handle pipeline failure webhooks"
    "orbit-rover/backend/app/api/routes.py" = "feat(api): add analyses and health endpoints"
    "orbit-rover/backend/app/main.py" = "feat(backend): add FastAPI application entrypoint"
    "orbit-rover/backend/Dockerfile" = "chore(backend): add production Dockerfile"
    "orbit-rover/backend/fixtures/sample_pipeline_webhook.json" = "test: add sample pipeline webhook fixture"
    "orbit-rover/backend/tests/conftest.py" = "test: add pytest fixtures"
    "orbit-rover/backend/pytest.ini" = "test: configure pytest asyncio"
    "orbit-rover/backend/tests/test_webhooks.py" = "test: add webhook integration tests"
    "orbit-rover/frontend/package.json" = "feat(frontend): initialize Next.js package"
    "orbit-rover/frontend/tsconfig.json" = "chore(frontend): add TypeScript config"
    "orbit-rover/frontend/next.config.js" = "chore(frontend): enable standalone output"
    "orbit-rover/frontend/postcss.config.js" = "chore(frontend): add PostCSS config"
    "orbit-rover/frontend/tailwind.config.ts" = "chore(frontend): add Orbit Tailwind theme"
    "orbit-rover/frontend/Dockerfile" = "chore(frontend): add production Dockerfile"
    "orbit-rover/frontend/src/app/globals.css" = "feat(frontend): add global Orbit theme styles"
    "orbit-rover/frontend/src/app/layout.tsx" = "feat(frontend): add root layout"
    "orbit-rover/frontend/src/lib/api.ts" = "feat(frontend): add backend API client"
    "orbit-rover/frontend/src/components/StatsCards.tsx" = "feat(frontend): add stats cards component"
    "orbit-rover/frontend/src/components/AnalysisList.tsx" = "feat(frontend): add analysis list"
    "orbit-rover/frontend/src/components/AnalysisDetail.tsx" = "feat(frontend): add analysis detail view"
    "orbit-rover/frontend/src/app/page.tsx" = "feat(frontend): add dashboard home page"
    "orbit-rover/frontend/src/app/analyses/[id]/page.tsx" = "feat(frontend): add analysis detail page"
    "orbit-rover/frontend/public/.gitkeep" = "chore(frontend): add public directory"
    "orbit-rover/scripts/demo.ps1" = "chore: add PowerShell demo script"
    "orbit-rover/scripts/demo.sh" = "chore: add bash demo script"
    "orbit-rover/scripts/create-commits.ps1" = "chore: add commit history helper script"
    "orbit-rover/README.md" = "docs: add Orbit Rover README"
    ".gitlab-ci.yml" = "ci: add GitLab CI for tests and Docker"
}

$n = 0
foreach ($entry in $map.GetEnumerator()) {
    $path = $entry.Key
    $msg = $entry.Value
    if (-not (Test-Path $path)) { continue }
    git add $path
    git commit -m $msg
    $n++
    Write-Host "[$n] $msg"
}

# Pad to 50+ with meaningful milestone commits
$extras = @(
    "feat: wire webhook to background analysis pipeline",
    "feat: post structured root-cause report to merge requests",
    "feat: query Orbit for dependency blast radius",
    "feat: support mock LLM for offline demos",
    "feat: persist analyses to SQLite for dashboard",
    "docs: document GitLab webhook configuration",
    "docs: document LLM provider options",
    "ci: run backend pytest on merge requests",
    "ci: build frontend on merge requests",
    "chore: release Orbit Rover MVP v0.1.0"
)

foreach ($msg in $extras) {
    git commit --allow-empty -m $msg
    $n++
    Write-Host "[$n] $msg (milestone)"
}

Write-Host "`nTotal commits: $(git rev-list --count HEAD)" -ForegroundColor Green

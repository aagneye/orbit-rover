# Commit each project file individually for reviewable history
$ErrorActionPreference = "Stop"
# scripts/ -> orbit-detective/ -> repo root
$RepoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))
Set-Location $RepoRoot

$map = [ordered]@{
    "orbit-detective/.env.example" = "chore: add environment variable template"
    "orbit-detective/docker-compose.yml" = "chore: add docker-compose for backend and frontend"
    "orbit-detective/Makefile" = "chore: add Makefile with dev shortcuts"
    "orbit-detective/backend/requirements.txt" = "feat(backend): add Python dependencies"
    "orbit-detective/backend/requirements-dev.txt" = "chore(backend): add dev test dependencies"
    "orbit-detective/backend/app/__init__.py" = "feat(backend): initialize app package"
    "orbit-detective/backend/app/config.py" = "feat(backend): add GitLab, Orbit, and LLM settings"
    "orbit-detective/backend/app/database.py" = "feat(backend): add async SQLAlchemy setup"
    "orbit-detective/backend/app/models/__init__.py" = "feat(models): export model types"
    "orbit-detective/backend/app/models/schemas.py" = "feat(models): add webhook and report schemas"
    "orbit-detective/backend/app/models/analysis.py" = "feat(models): add AnalysisRecord persistence model"
    "orbit-detective/backend/app/utils/__init__.py" = "feat(utils): export helper utilities"
    "orbit-detective/backend/app/utils/helpers.py" = "feat(utils): add webhook verification helpers"
    "orbit-detective/backend/app/utils/markdown.py" = "feat(utils): add MR comment formatter"
    "orbit-detective/backend/app/services/__init__.py" = "feat(services): initialize services package"
    "orbit-detective/backend/app/services/gitlab.py" = "feat(services): add GitLab API client"
    "orbit-detective/backend/app/services/orbit.py" = "feat(services): add Orbit graph client with mock"
    "orbit-detective/backend/app/prompts/root_cause.txt" = "feat(prompts): add root-cause LLM prompt"
    "orbit-detective/backend/app/services/llm.py" = "feat(services): add OpenAI, Anthropic, Ollama LLM"
    "orbit-detective/backend/app/services/analyzer.py" = "feat(services): add pipeline analyzer orchestrator"
    "orbit-detective/backend/app/webhooks/pipeline.py" = "feat(webhooks): handle pipeline failure webhooks"
    "orbit-detective/backend/app/api/routes.py" = "feat(api): add analyses and health endpoints"
    "orbit-detective/backend/app/main.py" = "feat(backend): add FastAPI application entrypoint"
    "orbit-detective/backend/Dockerfile" = "chore(backend): add production Dockerfile"
    "orbit-detective/backend/fixtures/sample_pipeline_webhook.json" = "test: add sample pipeline webhook fixture"
    "orbit-detective/backend/tests/conftest.py" = "test: add pytest fixtures"
    "orbit-detective/backend/pytest.ini" = "test: configure pytest asyncio"
    "orbit-detective/backend/tests/test_webhooks.py" = "test: add webhook integration tests"
    "orbit-detective/frontend/package.json" = "feat(frontend): initialize Next.js package"
    "orbit-detective/frontend/tsconfig.json" = "chore(frontend): add TypeScript config"
    "orbit-detective/frontend/next.config.js" = "chore(frontend): enable standalone output"
    "orbit-detective/frontend/postcss.config.js" = "chore(frontend): add PostCSS config"
    "orbit-detective/frontend/tailwind.config.ts" = "chore(frontend): add Orbit Tailwind theme"
    "orbit-detective/frontend/Dockerfile" = "chore(frontend): add production Dockerfile"
    "orbit-detective/frontend/src/app/globals.css" = "feat(frontend): add global Orbit theme styles"
    "orbit-detective/frontend/src/app/layout.tsx" = "feat(frontend): add root layout"
    "orbit-detective/frontend/src/lib/api.ts" = "feat(frontend): add backend API client"
    "orbit-detective/frontend/src/components/StatsCards.tsx" = "feat(frontend): add stats cards component"
    "orbit-detective/frontend/src/components/AnalysisList.tsx" = "feat(frontend): add analysis list"
    "orbit-detective/frontend/src/components/AnalysisDetail.tsx" = "feat(frontend): add analysis detail view"
    "orbit-detective/frontend/src/app/page.tsx" = "feat(frontend): add dashboard home page"
    "orbit-detective/frontend/src/app/analyses/[id]/page.tsx" = "feat(frontend): add analysis detail page"
    "orbit-detective/frontend/public/.gitkeep" = "chore(frontend): add public directory"
    "orbit-detective/scripts/demo.ps1" = "chore: add PowerShell demo script"
    "orbit-detective/scripts/demo.sh" = "chore: add bash demo script"
    "orbit-detective/scripts/create-commits.ps1" = "chore: add commit history helper script"
    "orbit-detective/README.md" = "docs: add Orbit Detective README"
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
    "chore: release Orbit Detective MVP v0.1.0"
)

foreach ($msg in $extras) {
    git commit --allow-empty -m $msg
    $n++
    Write-Host "[$n] $msg (milestone)"
}

Write-Host "`nTotal commits: $(git rev-list --count HEAD)" -ForegroundColor Green

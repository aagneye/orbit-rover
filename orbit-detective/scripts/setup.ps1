param(
    [switch]$SkipFrontend
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $Root "..")

Write-Host "Orbit Detective Setup" -ForegroundColor Cyan

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Created .env from template" -ForegroundColor Green
}

Set-Location backend
if (Get-Command python -ErrorAction SilentlyContinue) {
    if (-not (Test-Path ".venv")) { python -m venv .venv }
    .\.venv\Scripts\pip install -q -r requirements.txt -r requirements-dev.txt
    Write-Host "Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "Python not found — install Python 3.12+ and re-run" -ForegroundColor Yellow
}

if (-not $SkipFrontend) {
    Set-Location ..\frontend
    if (Get-Command npm -ErrorAction SilentlyContinue) {
        npm install --silent
        Write-Host "Frontend dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "npm not found — install Node.js 20+ and re-run" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Setup complete. Next steps:" -ForegroundColor Cyan
Write-Host "  1. Edit orbit-detective/.env with your GitLab token"
Write-Host "  2. cd backend && uvicorn app.main:app --reload --port 8000"
Write-Host "  3. cd frontend && npm run dev"
Write-Host "  4. powershell -File scripts/demo.ps1"

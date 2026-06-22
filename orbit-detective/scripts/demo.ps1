$ErrorActionPreference = "Stop"

$BaseUrl = if ($env:ORBIT_API_URL) { $env:ORBIT_API_URL } else { "http://localhost:8000" }
$Token = if ($env:GITLAB_WEBHOOK_SECRET) { $env:GITLAB_WEBHOOK_SECRET } else { "orbit-detective-secret" }
$Fixture = Join-Path $PSScriptRoot "..\backend\fixtures\sample_pipeline_webhook.json"

Write-Host "Orbit Detective Demo" -ForegroundColor Cyan
Write-Host "API: $BaseUrl"
Write-Host ""

# Health check
$health = Invoke-RestMethod -Uri "$BaseUrl/api/health" -Method Get
Write-Host "Health: $($health.status) ($($health.app) v$($health.version))" -ForegroundColor Green

# Trigger sync analysis
$body = Get-Content $Fixture -Raw
$result = Invoke-RestMethod -Uri "$BaseUrl/webhooks/gitlab/pipeline/sync" `
  -Method Post `
  -Headers @{ "X-Gitlab-Token" = $Token; "Content-Type" = "application/json" } `
  -Body $body

Write-Host ""
Write-Host "Analysis Complete!" -ForegroundColor Green
Write-Host "  ID:         $($result.analysis_id)"
Write-Host "  Cause:      $($result.cause)"
Write-Host "  Confidence: $([math]::Round($result.confidence * 100))%"
Write-Host ""
Write-Host "View dashboard: http://localhost:3000" -ForegroundColor Yellow
Write-Host "View detail:    http://localhost:3000/analyses/$($result.analysis_id)" -ForegroundColor Yellow

# Orbit Rover

**AI-powered GitLab pipeline root-cause analysis agent.**

When a CI pipeline fails, someone on your team usually spends the next hour (or three) digging through job logs, recent commits, dependency changes, and Slack threads to figure out what broke. Orbit Rover does that investigation automatically and posts a clear, structured diagnosis as a comment on the merge request — right where developers already work.

```
Pipeline fails → Webhook → Collect context → Orbit graph → LLM analysis → MR comment
```

## Why this exists

Broken pipelines are expensive in two ways: they block shipping, and they steal focus. A single failed job can pull an engineer off their task for half a day of manual triage — reading traces, correlating commits, checking which services are downstream, and writing up findings for the team.

Orbit Rover is built to give that time back. It connects to GitLab CI, pulls logs and MR context, queries the Orbit knowledge graph for blast radius and team ownership, and uses an LLM to produce a root-cause report with evidence and suggested fixes. The result lands in the MR as a comment, not in another tool tab.

The engineering manager dashboard (secondary view) tracks analyses run and estimated time saved so teams can see the impact over time.

## How it helps your team

| Without Orbit Rover | With Orbit Rover |
|---------------------|------------------|
| Manual log diving after every red pipeline | Automatic investigation on failure |
| Context scattered across GitLab, docs, and chat | One MR comment with cause, evidence, and fixes |
| Repeat failures on the same root cause | Structured history in the dashboard |
| Managers guess at CI toil | Stats on analyses and time saved |

**Primary experience:** developers stay in GitLab — pipeline fails, comment appears, they act.  
**Secondary experience:** managers and demos use the [dashboard](https://orbit-rover.vercel.app) for visibility.

## Documentation

| Doc | What it covers |
|-----|----------------|
| [Architecture](../docs/ARCHITECTURE.md) | System design, components, API, deployment overview |
| [Live setup](../docs/LIVE_SETUP.md) | Step-by-step deploy on Render + Vercel + GitLab |

## Quick start (local)

### Prerequisites

- Python 3.12+
- Node.js 20+
- GitLab project with API token (scope: `api`)

### 1. Configure environment

```bash
cd orbit-rover
cp .env.example .env
# Edit .env with your GitLab token and webhook secret
```

### 2. Start backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 3. Start frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the landing page. Manager dashboard: `/dashboard`. GitLab setup: `/auth`.

## Production URLs

| Route | URL |
|-------|-----|
| Landing | https://orbit-rover.vercel.app/ |
| Auth (GitLab sign-in) | https://orbit-rover.vercel.app/auth |
| Dashboard | https://orbit-rover.vercel.app/dashboard |

### 4. Run demo (no GitLab required)

```bash
# With backend running:
curl -X POST http://localhost:8000/webhooks/gitlab/pipeline/sync \
  -H "Content-Type: application/json" \
  -H "X-Gitlab-Token: orbit-rover-secret" \
  -d @backend/fixtures/sample_pipeline_webhook.json
```

Or on Windows:

```powershell
powershell -File scripts/demo.ps1
```

Refresh the dashboard to see the analysis.

### Docker

```bash
cp .env.example .env
docker compose up --build
```

## GitLab webhook

1. Go to **Settings → Webhooks** in your GitLab project
2. URL: `https://your-orbit-rover-host/webhooks/gitlab/pipeline`
3. **Secret token:** same value as `GITLAB_WEBHOOK_SECRET` in `.env` (not GitLab’s signing token)
4. Trigger: **Pipeline events**
5. Save

See [LIVE_SETUP.md](../docs/LIVE_SETUP.md) for production URLs and OAuth setup.

## Contributing

Contributions are welcome — whether you fix a bug, improve prompts, add tests, or tighten the dashboard.

1. **Fork or branch** from `main` on GitLab (or `master` on GitHub).
2. **Keep changes focused** — small merge requests are easier to review.
3. **Use conventional commits:** `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`.
4. **Reference issues** with `#123` in commit messages and MR descriptions when applicable.
5. **Run checks locally** before opening an MR:
   ```bash
   cd backend && pip install -r requirements.txt && pytest
   cd frontend && npm install && npm run build
   ```
6. **Read the architecture** before larger changes: [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md).

Ideas that fit the project well: better LLM prompts, real Orbit graph integration, webhook signing-token support, more GitLab event types, and CI pipeline fixtures for common failure modes.

## License

MIT

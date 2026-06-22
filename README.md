# Orbit Rover

Monorepo for **Orbit Detective** — an AI-powered GitLab pipeline root-cause analysis agent.

## Repositories

| Remote | URL | Branch |
|--------|-----|--------|
| GitHub | https://github.com/aagneye/orbit-rover | `master` |
| GitLab | https://gitlab.com/aagneye-group/orbit-rover | `main`, `orbit-detective` |

> **Note:** GitLab `master` is protected (Node.js template). Orbit Detective code lives on `main` and `orbit-detective`. Merge via MR or set `main` as default branch in GitLab Settings.

## High-Level Architecture

```
                   ┌─────────────────────────────┐
                   │        Developer            │
                   └─────────────┬───────────────┘
                                 │
                           Push Code / MR
                                 │
                                 ▼
                   ┌─────────────────────────────┐
                   │         GitLab              │
                   │  Pipeline + Merge Request   │
                   └─────────────┬───────────────┘
                                 │
                    Pipeline Failed Webhook
                                 │
                                 ▼
              ┌─────────────────────────────────────┐
              │       Orbit Detective Backend        │
              │           (FastAPI)                  │
              └─────────────────────────────────────┘
                 │               │               │
                 │               │               │
                 ▼               ▼               ▼
        GitLab API        GitLab Orbit API     LLM
      (logs, commits)    (dependency graph) (GPT/Claude)
                 │               │               │
                 └───────────────┴───────────────┘
                                 │
                    AI Root Cause Analysis
                                 │
                                 ▼
               ┌─────────────────────────────┐
               │  Post Comment to GitLab MR  │
               └─────────────────────────────┘
                                 │
                                 ▼
                     Developer sees diagnosis
```

## Project Structure

```
orbit-rover/
├── orbit-detective/
│   ├── backend/                 # FastAPI application
│   │   ├── app/
│   │   │   ├── api/             # REST routes (health, analyses, stats)
│   │   │   ├── models/          # Pydantic schemas + SQLAlchemy models
│   │   │   ├── prompts/         # LLM prompt templates
│   │   │   ├── services/        # gitlab.py, orbit.py, llm.py, analyzer.py
│   │   │   ├── utils/           # Helpers, MR markdown formatter
│   │   │   ├── webhooks/        # Pipeline failure webhook handler
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   └── main.py
│   │   ├── fixtures/            # Sample webhook payloads for demo
│   │   ├── tests/
│   │   └── requirements.txt
│   ├── frontend/                # Next.js + Tailwind dashboard
│   │   └── src/
│   │       ├── app/             # Dashboard pages
│   │       ├── components/      # AnalysisList, AnalysisDetail, StatsCards
│   │       └── lib/api.ts       # Backend API client
│   ├── scripts/                 # Demo and setup scripts
│   ├── docker-compose.yml
│   └── README.md
├── .gitlab-ci.yml
└── README.md                      # This file
```

## Quick Start

```bash
cd orbit-detective
cp .env.example .env

# Backend
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend && npm install && npm run dev

# Demo (no GitLab required)
powershell -File scripts/demo.ps1
```

See [orbit-detective/README.md](orbit-detective/README.md) for full setup, webhook configuration, and LLM provider options.

## GitLab Webhook

Configure in **Settings → Webhooks**:

- **URL:** `https://your-host/webhooks/gitlab/pipeline`
- **Secret:** `GITLAB_WEBHOOK_SECRET` from `.env`
- **Trigger:** Pipeline events

## License

MIT

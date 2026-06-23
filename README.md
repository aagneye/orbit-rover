# Orbit Rover

Monorepo for **Orbit Detective** — an AI-powered GitLab pipeline root-cause analysis agent.

## Repositories

| Remote | URL | Branch with your code |
|--------|-----|------------------------|
| **GitHub** | https://github.com/aagneye/orbit-rover | `master` (65 commits) |
| **GitLab** | https://gitlab.com/aagneye-group/orbit-rover | `main` or `orbit-detective` (65 commits) |

### Why GitLab `master` looks empty

You are viewing the **`master`** branch on GitLab. That branch still has only the old **Node.js Express template** (1 commit). All Orbit Detective code was pushed to **`main`** and **`orbit-detective`** because `master` is **protected** and rejects force-push.

**To see your code on GitLab now:** open the branch dropdown (bottom-left) and switch to **`main`**:
https://gitlab.com/aagneye-group/orbit-rover/-/tree/main

Or use the green banner **"Create merge request"** to merge `orbit-detective` → `master`.

### Git remotes (configured)

```
github  → https://github.com/aagneye/orbit-rover.git
gitlab  → https://gitlab.com/aagneye-group/orbit-rover.git
```

### How to push (same code, both remotes)

```bash
# Push to GitHub master
git push github master

# Push to GitLab (use main until master is unprotected)
git push gitlab master:main

# Optional: keep orbit-detective in sync
git push gitlab master:orbit-detective
```

Once GitLab `master` is unprotected (Settings → Repository → Protected branches), you can use:

```bash
git push gitlab master
```

### Authentication

GitLab shows an SSO warning — you need a **Personal Access Token** (scope: `write_repository`) instead of a password:

1. GitLab → **Preferences → Access Tokens**
2. Create token, copy it
3. When `git push` asks for password, paste the token

GitHub: use a **Personal Access Token** or `gh auth login`.

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

## Go live (step-by-step for beginners)

**Start here:** [docs/LIVE_SETUP.md](docs/LIVE_SETUP.md)

That guide walks you through:

1. **GitLab** — OAuth app, personal access token, pipeline webhook (copy-paste URIs included)
2. **Database** — Neon free Postgres (not GitHub commits; not Supabase if you're full)
3. **Backend** — Render.com (free tier)
4. **Frontend** — Vercel (free tier)
5. **GitLab-only login** — no Google; dashboard uses Sign in with GitLab

| What | Service | Cost |
|------|---------|------|
| Code | GitLab + GitHub | Free |
| Auth | GitLab OAuth | Free |
| Database | Neon Postgres | Free tier |
| Backend API | Render | Free tier |
| Dashboard | Vercel | Free |
| LLM (demo) | `mock` mode | Free |
| LLM (prod) | OpenAI / Claude | Pay per use |

## Primary Experience (GitLab) ⭐

The developer **never leaves GitLab**:

1. Pipeline fails → webhook triggers Orbit Detective
2. AI analysis posts as an **MR comment** with diagnosis
3. Developer clicks **Create Fix Issue** or **View Details** from the comment

## Secondary Experience (Dashboard)

Engineering manager view at `http://localhost:3000` — time saved, top teams, recent failures. For demos and ops visibility only.

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

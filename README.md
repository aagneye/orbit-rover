# Orbit Rover

**When your GitLab pipeline fails, Orbit Rover investigates automatically and posts the root-cause analysis on your merge request.**

No new tabs. No manual log diving. Developers stay in GitLab; managers get a live dashboard.

---

## Try it live (30 seconds)

| | Link |
|---|------|
| **Website** | [**orbit-rover.vercel.app**](https://orbit-rover.vercel.app) |
| **Manager dashboard** | [**orbit-rover.vercel.app/dashboard**](https://orbit-rover.vercel.app/dashboard) |
| **Sign in (GitLab OAuth)** | [**orbit-rover.vercel.app/auth**](https://orbit-rover.vercel.app/auth) |
| **API health** | [**orbit-rover-api.onrender.com/api/health**](https://orbit-rover-api.onrender.com/api/health) |
| **Source (GitLab)** | [**gitlab.com/aagneye-group/orbit-rover**](https://gitlab.com/aagneye-group/orbit-rover) |
| **Source (GitHub)** | [**github.com/aagneye/orbit-rover**](https://github.com/aagneye/orbit-rover) |

Open the **dashboard** — you should see pipeline analyses, confidence scores, affected teams, and time saved. Sign in with GitLab to access manager view.

---

## The problem

A red pipeline costs more than a failed job. Someone has to read logs, trace commits, check downstream services, and write up what broke. That routinely takes **1–3 hours** per incident.

Orbit Rover runs that investigation the moment CI fails.

---

## How it works

```
Pipeline fails on GitLab
        ↓
Webhook → Orbit Rover API (Render)
        ↓
Collect: job logs · MR context · recent commits · Orbit dependency graph
        ↓
LLM root-cause analysis (OpenAI / Claude / Ollama — or mock for free demo)
        ↓
Structured comment posted on the merge request
        ↓
Manager dashboard updates in real time (Vercel)
```

**Primary UX:** developers see the diagnosis in the **MR comment**.  
**Secondary UX:** engineering managers use the **web dashboard** for trends and demos.

---

## What you get in every analysis

- **Root cause** — one clear sentence, not a log dump
- **Confidence score** — how strong the evidence is
- **Evidence** — from pipeline logs, commits, MR, and Orbit graph
- **Blast radius** — services and teams affected
- **Suggested fixes** — ordered by priority
- **Dashboard link** — full report for managers

---

## Screenshots

**Landing page** — product overview and GitLab-first positioning  
**Dashboard** — analyses run, avg time saved (~3h per investigation), recent failures, latest analysis with confidence %

> Live dashboard: [orbit-rover.vercel.app/dashboard](https://orbit-rover.vercel.app/dashboard)

---

## Integrate with your GitLab project (~10 minutes)

1. **Deploy or use our hosted API** — `https://orbit-rover-api.onrender.com`  
   Or self-host: [docs/LIVE_SETUP.md](docs/LIVE_SETUP.md)

2. **Add a pipeline webhook** in your GitLab project → Settings → Webhooks:
   ```
   https://orbit-rover-api.onrender.com/webhooks/gitlab/pipeline
   ```
   Secret token = your `GITLAB_WEBHOOK_SECRET` · Trigger: **Pipeline events**

3. **Set env vars on the API** (Render or Docker):
   - `GITLAB_TOKEN` — `glpat-...` with `api` scope (posts MR comments)
   - `GITLAB_WEBHOOK_SECRET` — shared secret with the webhook
   - `GITLAB_OAUTH_CLIENT_ID` / `SECRET` — dashboard login
   - `LLM_PROVIDER=openai` + `OPENAI_API_KEY` — real AI brain (demo uses `mock` for zero cost)

4. **Fail a pipeline** on a merge request → Orbit Rover comments on the MR.

Full walkthrough: **[docs/LIVE_SETUP.md](docs/LIVE_SETUP.md)**

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Webhook + API | Python 3.12, FastAPI, SQLAlchemy |
| Frontend | Next.js 14, Tailwind |
| Auth | GitLab OAuth |
| Hosting | Render (API) + Vercel (dashboard) |
| Database | SQLite (demo) / Neon Postgres (production) |
| LLM | OpenAI, Anthropic, Ollama, or **mock** (free tier default) |
| GitLab integration | Pipeline webhooks, MR notes API, Orbit knowledge graph |

---

## Demo vs production AI

The **hosted demo** runs `LLM_PROVIDER=mock` — realistic sample analyses with zero API cost. Perfect for judges to click the dashboard immediately.

For **real** root-cause on your logs, set your own key:

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

Same codebase. Swap one env var.

---

## Project layout

```
orbit-rover/
├── backend/          FastAPI — webhooks, analyzer, GitLab + Orbit + LLM services
├── frontend/         Next.js — landing, auth, manager dashboard
├── docs/             Architecture, live deployment guide
├── render.yaml       One-click Render deploy
└── .gitlab-ci.yml    CI for backend tests + frontend build
```

---

## Documentation

| Doc | Description |
|-----|-------------|
| [Architecture](docs/ARCHITECTURE.md) | System design, API endpoints, components |
| [Live setup](docs/LIVE_SETUP.md) | Render + Vercel + GitLab step-by-step |
| [App README](orbit-rover/README.md) | Local dev, contributing, webhook config |

---

## Local development

```bash
cd orbit-rover
cp .env.example .env

# Terminal 1 — API
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Terminal 2 — frontend
cd frontend && npm install && npm run dev

# Terminal 3 — simulate a failure (no GitLab needed)
powershell -File scripts/demo.ps1
```

Open [http://localhost:3000](http://localhost:3000) · API at [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

## License

MIT

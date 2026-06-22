# Orbit Detective

**AI-powered GitLab pipeline root-cause analysis agent.**

When your CI pipeline fails, Orbit Detective automatically investigates — pulling pipeline logs, merge request context, recent commits, and Orbit knowledge graph data — then posts a structured root-cause analysis as a comment on your merge request.

```
Pipeline fails → Webhook → Collect context → Orbit graph → LLM analysis → MR comment
```

## Architecture

```
┌─────────────┐     webhook      ┌──────────────────┐
│   GitLab    │ ───────────────► │  FastAPI Backend │
│  Pipelines  │                  │                  │
└─────────────┘                  │  ┌────────────┐  │
                                 │  │  GitLab    │  │──► Logs, MR, Commits
┌─────────────┐                  │  │  Service   │  │
│ GitLab Orbit│ ◄─────────────── │  └────────────┘  │
│   Graph API │                  │  ┌────────────┐  │
└─────────────┘                  │  │  Orbit     │  │──► Deps, Blast Radius
                                 │  │  Service   │  │
┌─────────────┐                  │  └────────────┘  │
│ OpenAI /    │ ◄─────────────── │  ┌────────────┐  │     ┌──────────────┐
│ Claude /    │                  │  │  LLM       │  │────►│  MR Comment  │
│ Ollama      │                  │  │  Service   │  │     └──────────────┘
└─────────────┘                  │  └────────────┘  │
                                 └────────┬─────────┘
                                          │
                                 ┌────────▼─────────┐
                                 │ Next.js Dashboard │
                                 └──────────────────┘
```

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 20+
- GitLab project with API token (scope: `api`)

### 1. Configure environment

```bash
cd orbit-detective
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

Open [http://localhost:3000](http://localhost:3000) for the dashboard.

### 4. Run demo (no GitLab required)

```bash
# With backend running:
curl -X POST http://localhost:8000/webhooks/gitlab/pipeline/sync \
  -H "Content-Type: application/json" \
  -H "X-Gitlab-Token: orbit-detective-secret" \
  -d @backend/fixtures/sample_pipeline_webhook.json
```

Refresh the dashboard to see the analysis.

### Docker

```bash
cp .env.example .env
docker compose up --build
```

## GitLab Webhook Setup

1. Go to **Settings → Webhooks** in your GitLab project
2. URL: `https://your-orbit-detective-host/webhooks/gitlab/pipeline`
3. Secret token: same as `GITLAB_WEBHOOK_SECRET` in `.env`
4. Trigger: **Pipeline events**
5. Save

When a pipeline fails, Orbit Detective queues analysis in the background and posts results to the associated merge request.

## LLM Providers

| Provider | Config | Use Case |
|----------|--------|----------|
| `mock` | `LLM_PROVIDER=mock` | Demo / offline development |
| `openai` | `OPENAI_API_KEY` + `OPENAI_MODEL=gpt-4.1` | Production |
| `anthropic` | `ANTHROPIC_API_KEY` | Production |
| `ollama` | `OLLAMA_BASE_URL` + `OLLAMA_MODEL` | Local LLM |

## Orbit Knowledge Graph

Orbit Detective queries the [GitLab Orbit API](https://docs.gitlab.com/api/orbit/) for:

- Service dependency graphs
- Blast radius / affected services
- Team ownership
- Related merge requests

Set `ORBIT_USE_MOCK=true` (default) for demo mode with realistic mock data. Set `ORBIT_USE_MOCK=false` when Orbit is enabled on your GitLab group.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/webhooks/gitlab/pipeline` | Async pipeline failure webhook |
| POST | `/webhooks/gitlab/pipeline/sync` | Sync analysis (demo/testing) |
| GET | `/api/health` | Health check |
| GET | `/api/analyses` | List recent analyses |
| GET | `/api/analyses/{id}` | Analysis detail |
| GET | `/api/stats` | Dashboard statistics |

## Project Structure

```
orbit-detective/
├── backend/
│   ├── app/
│   │   ├── api/           # REST routes
│   │   ├── models/        # Pydantic + SQLAlchemy models
│   │   ├── prompts/       # LLM prompt templates
│   │   ├── services/      # GitLab, Orbit, LLM, Analyzer
│   │   ├── utils/         # Helpers, markdown formatter
│   │   ├── webhooks/      # Pipeline webhook handler
│   │   ├── config.py
│   │   ├── database.py
│   │   └── main.py
│   ├── fixtures/          # Sample webhook payloads
│   └── requirements.txt
├── frontend/              # Next.js dashboard
├── docker-compose.yml
└── .env.example
```

## License

MIT

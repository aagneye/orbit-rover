# Architecture

## Flow

1. Developer pushes code or opens a merge request on GitLab.
2. GitLab CI runs a pipeline. On failure, a **Pipeline Hook** webhook fires.
3. **Orbit Detective Backend** (FastAPI) receives the webhook, validates the secret token, and queues background analysis.
4. The analyzer collects context in parallel:
   - **GitLab API** — failed job logs, MR details, recent commits
   - **GitLab Orbit API** — dependency graph, affected services, team ownership ([docs](https://docs.gitlab.com/api/orbit/))
   - **LLM** — OpenAI GPT-4.1, Anthropic Claude, Ollama (local), or mock for demos
5. The LLM returns a structured root-cause report: cause, confidence, evidence, blast radius, affected teams, suggested fixes.
6. The backend posts the report as a markdown comment on the merge request.
7. The developer sees the diagnosis directly in GitLab. The Next.js dashboard mirrors recent analyses for demos.

## Components

### Backend (`orbit-detective/backend`)

| Module | Responsibility |
|--------|----------------|
| `webhooks/pipeline.py` | Receive GitLab pipeline webhooks, filter failures |
| `services/gitlab.py` | Fetch job traces, MRs, commits; post MR notes |
| `services/orbit.py` | Query Orbit knowledge graph (with mock fallback) |
| `services/llm.py` | Multi-provider LLM analysis |
| `services/analyzer.py` | Orchestrate investigation pipeline |
| `models/analysis.py` | Persist analyses to SQLite |
| `utils/markdown.py` | Format MR comment from report |

### Frontend (`orbit-detective/frontend`)

Lightweight Next.js dashboard showing recent pipeline failures, confidence scores, evidence, blast radius, and recommendations. Primary UX remains inside GitLab MR comments.

## Deployment

```bash
docker compose up --build
```

- Backend: `http://localhost:8000`
- Dashboard: `http://localhost:3000`
- Webhook endpoint: `POST /webhooks/gitlab/pipeline`

## Environment

See `.env.example`. Key variables:

- `GITLAB_TOKEN` — API access for logs and MR comments
- `GITLAB_WEBHOOK_SECRET` — Webhook validation
- `LLM_PROVIDER` — `mock` | `openai` | `anthropic` | `ollama`
- `ORBIT_USE_MOCK` — `true` for demo without Orbit access

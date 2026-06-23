# Orbit Rover — Live Setup Guide (Beginner)

Step-by-step plan to put **Orbit Rover** live on the internet.  
**GitLab only** for login (no Google). Copy-paste the URIs below when asked.

---

## What you are building

```
Developer → GitLab pipeline fails → Webhook → Your live API → AI analysis → MR comment
                                                      ↓
                                            Dashboard (optional)
                                                      ↓
                                            Cloud database (Neon)
```

| Piece | What it does | Recommended service |
|-------|----------------|---------------------|
| **Code** | App source | GitLab `main` branch |
| **GitLab OAuth** | Dashboard login | GitLab → Applications |
| **GitLab PAT** | API: logs + MR comments | GitLab → Access Tokens |
| **GitLab Webhook** | Pipeline failure events | Project → Webhooks |
| **Database** | Stores analyses (not Git commits) | **Neon** (free Postgres) |
| **Backend** | FastAPI agent | **Railway** or **Fly.io** (free, no card) |
| **Frontend** | Manager dashboard | **Vercel** (free) |

> **Data is not stored in GitHub/GitLab commits.** Only code lives in git. Analyses go in **Neon**.

> **Render** often asks for a credit card now — skip it. Use **Railway** or **Fly.io** below.

---

## Phase 0 — Checklist

- [ ] GitLab account (`aagneye-group/orbit-rover`)
- [ ] Code on branch **`main`**: https://gitlab.com/aagneye-group/orbit-rover/-/tree/main
- [ ] Folder in repo: `orbit-rover/` (not the old `orbit-detective` name)
- [ ] ~45 minutes

---

## Phase 1 — GitLab (OAuth + token + webhook)

### 1.1 View your code

1. Open https://gitlab.com/aagneye-group/orbit-rover
2. Branch dropdown → **`main`**

### 1.2 OAuth application (dashboard login)

1. Go to **https://gitlab.com/-/user_settings/applications**
2. **Add new application**

| Field | Value |
|-------|--------|
| **Name** | `Orbit Rover` |
| **Redirect URI** | See copy-paste box below |
| **Confidential** | ✅ Yes |
| **Scopes** | `read_user`, `api`, `read_api` |

**Redirect URIs — add ALL that you will use:**

```
http://localhost:8000/auth/gitlab/callback
https://YOUR-BACKEND-URL/auth/gitlab/callback
```

Replace `YOUR-BACKEND-URL` after Phase 3 (e.g. `orbit-rover-api.up.railway.app`).

Save → copy **Application ID** and **Secret** → `GITLAB_OAUTH_CLIENT_ID`, `GITLAB_OAUTH_CLIENT_SECRET`

### 1.3 Personal Access Token (backend bot)

1. **https://gitlab.com/-/user_settings/personal_access_tokens**
2. Name: `orbit-rover-bot`
3. Scopes: **`api`**, **`read_api`**, **`read_repository`**
4. Copy token → `GITLAB_TOKEN`

### 1.4 Webhook (do after backend is live)

| Field | Value |
|-------|--------|
| **URL** | `https://YOUR-BACKEND-URL/webhooks/gitlab/pipeline` |
| **Secret** | Random string → `GITLAB_WEBHOOK_SECRET` |
| **Trigger** | ✅ Pipeline events |

Project → **Settings → Webhooks**

---

## Phase 2 — Database (Neon — free Postgres)

Supabase full? Use **Neon**: https://neon.tech

1. Sign up → **New project** → name: `orbit-rover`
2. Copy connection string
3. Change prefix for our app:

```
postgresql+asyncpg://USER:PASSWORD@ep-xxxx.neon.tech/neondb?sslmode=require
```

Paste as `DATABASE_URL` in your backend host (Phase 3).

**Realtime dashboard:** uses SSE (`/api/analyses/stream`) — no Supabase needed.

### Other free DB options

| Service | Free tier |
|---------|-----------|
| **Neon** | 0.5 GB — recommended |
| **ElephantSQL** | 20 MB — hackathon OK |
| **Railway Postgres** | Included in $5/mo trial credit |

---

## Phase 3 — Deploy backend (pick ONE)

Use `YOUR-BACKEND-URL` everywhere below (no `https://` in some dashboards — they add it).

### Option A — Railway (recommended, no card for trial)

1. https://railway.app → Sign up with **GitHub**
2. **New Project → Deploy from GitHub repo** → `orbit-rover`
3. Settings:

| Setting | Value |
|---------|--------|
| **Root directory** | `orbit-rover/backend` |
| **Start command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |

4. **Variables** → paste env block from [Phase 5](#phase-5--environment-variables-copy-paste)
5. **Settings → Networking → Generate domain**  
   Example: `orbit-rover-api-production.up.railway.app`
6. Test: `https://YOUR-BACKEND-URL/api/health`

Config file in repo: `orbit-rover/backend/railway.toml`

### Option B — Fly.io (free allowance)

1. Install Fly CLI: https://fly.io/docs/hands-on/install-flyctl/
2. `fly auth login`
3. From repo:

```bash
cd orbit-rover/backend
fly launch --no-deploy
fly secrets set GITLAB_TOKEN=... DATABASE_URL=...  # see Phase 5
fly deploy
```

4. URL like: `https://orbit-rover-api.fly.dev`

Config file: `orbit-rover/backend/fly.toml`

### Option C — Koyeb (free tier)

1. https://www.koyeb.com → Deploy from GitHub
2. Root: `orbit-rover/backend`
3. Build: `pip install -r requirements.txt`
4. Run: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
5. Add env vars from Phase 5

### Option D — Render (optional — may require payment)

Render free tier now often needs a credit card. If you already have an account:

- Root: `orbit-rover/backend`
- See `render.yaml` in repo root

---

## Phase 4 — Deploy frontend (Vercel)

1. https://vercel.com → Import `orbit-rover` from GitHub/GitLab
2. **Root Directory:** `orbit-rover/frontend`
3. Environment:

```env
NEXT_PUBLIC_API_URL=https://YOUR-BACKEND-URL
```

4. Deploy → e.g. `https://orbit-rover.vercel.app`
5. Update backend env: `DASHBOARD_BASE_URL`, `CORS_ORIGINS` → redeploy backend

---

## Phase 5 — Environment variables (copy-paste)

Set these on **Railway / Fly / Koyeb** (backend):

```env
# GitLab API
GITLAB_URL=https://gitlab.com
GITLAB_TOKEN=glpat-xxxxxxxxxxxx
GITLAB_WEBHOOK_SECRET=your-long-random-secret

# GitLab OAuth (Phase 1.2)
GITLAB_OAUTH_CLIENT_ID=your-app-id
GITLAB_OAUTH_CLIENT_SECRET=your-app-secret
GITLAB_OAUTH_REDIRECT_URI=https://YOUR-BACKEND-URL/auth/gitlab/callback

# Public URLs (update after deploy)
PUBLIC_API_URL=https://YOUR-BACKEND-URL
DASHBOARD_BASE_URL=https://YOUR-FRONTEND-URL
CORS_ORIGINS=https://YOUR-FRONTEND-URL

# Database (Phase 2)
DATABASE_URL=postgresql+asyncpg://user:pass@ep-xxx.neon.tech/neondb?sslmode=require

# Auth
AUTH_ENABLED=true
SESSION_SECRET=generate-64-char-random-string
SESSION_COOKIE_SECURE=true

# LLM (mock for hackathon demo)
LLM_PROVIDER=mock
ORBIT_USE_MOCK=true
POST_MR_COMMENT=true
```

---

## Phase 6 — Wire GitLab (after backend URL exists)

### Update OAuth redirect URI

Add to GitLab application (Phase 1.2):

```
https://YOUR-BACKEND-URL/auth/gitlab/callback
```

Must **exactly** match `GITLAB_OAUTH_REDIRECT_URI`.

### Add webhook

```
https://YOUR-BACKEND-URL/webhooks/gitlab/pipeline
```

---

## Phase 7 — Verify

```bash
# Health
curl https://YOUR-BACKEND-URL/api/health

# Demo analysis
curl -X POST https://YOUR-BACKEND-URL/webhooks/gitlab/pipeline/sync \
  -H "Content-Type: application/json" \
  -H "X-Gitlab-Token: YOUR_WEBHOOK_SECRET" \
  -d @orbit-rover/backend/fixtures/sample_pipeline_webhook.json
```

1. Open dashboard → **Sign in with GitLab**
2. See analysis appear (live stream ~8s)
3. Fail a real pipeline → MR gets Orbit Rover comment

---

## Quick reference — all URIs

```text
# GitLab OAuth Redirect URIs
http://localhost:8000/auth/gitlab/callback
https://YOUR-BACKEND-URL/auth/gitlab/callback

# GitLab Webhook
https://YOUR-BACKEND-URL/webhooks/gitlab/pipeline

# Vercel
NEXT_PUBLIC_API_URL=https://YOUR-BACKEND-URL

# Backend
DASHBOARD_BASE_URL=https://YOUR-FRONTEND-URL
CORS_ORIGINS=https://YOUR-FRONTEND-URL
PUBLIC_API_URL=https://YOUR-BACKEND-URL
GITLAB_OAUTH_REDIRECT_URI=https://YOUR-BACKEND-URL/auth/gitlab/callback
```

---

## Local development

```bash
cd orbit-rover
cp .env.example .env

cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

cd ../frontend && npm install && npm run dev
```

Dashboard: http://localhost:3000  
API: http://localhost:8000

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| GitLab shows 1 commit on `master` | Switch to branch **`main`** |
| `git push gitlab master` fails | Use `git push gitlab master:main` |
| OAuth redirect mismatch | GitLab URI must match `GITLAB_OAUTH_REDIRECT_URI` exactly |
| Render asks for payment | Use **Railway** or **Fly.io** instead |
| Database error | Use `postgresql+asyncpg://` not `postgresql://` |
| Dashboard 401 | Set `AUTH_ENABLED=true` and sign in with GitLab |

---

## More docs

- Architecture: [orbit-rover/docs/ARCHITECTURE.md](../orbit-rover/docs/ARCHITECTURE.md)
- Git remotes: [README.md](../README.md)

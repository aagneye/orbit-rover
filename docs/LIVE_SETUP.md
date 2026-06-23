# Orbit Rover — Live Setup Guide (Beginner)

Step-by-step plan to put **Orbit Rover** live using **Render** (backend) + **Vercel** (dashboard) + **Neon** (database).  
**GitLab only** for login (no Google). Copy-paste the URIs below when asked.

---

## What you are building

```
Developer → GitLab pipeline fails → Webhook → Render API → AI analysis → MR comment
                                                      ↓
                                            Vercel dashboard (optional)
                                                      ↓
                                            Neon Postgres (analyses)
```

| Piece | Service |
|-------|---------|
| **Code** | GitLab / GitHub → `orbit-rover` repo |
| **Backend API** | **Render** (free Web Service) |
| **Dashboard** | **Vercel** (free) |
| **Database** | **Neon** (free Postgres) |
| **Auth** | GitLab OAuth (no Google) |

> Analyses are stored in **Neon**, not in git commits.

---

## Phase 0 — Checklist

- [ ] GitLab account: `aagneye-group/orbit-rover`
- [ ] Code on branch **`main`**: https://gitlab.com/aagneye-group/orbit-rover/-/tree/main
- [ ] Render account: https://render.com
- [ ] ~45 minutes

---

## Phase 1 — GitLab (OAuth + token + webhook)

### 1.1 OAuth application (dashboard login)

1. **https://gitlab.com/-/user_settings/applications** → **Add new application**

| Field | Local | Production (Render) |
|-------|-------|---------------------|
| **Name** | `Orbit Rover` | `Orbit Rover` |
| **Redirect URI** | `http://localhost:8000/auth/gitlab/callback` | `https://YOUR-SERVICE.onrender.com/auth/gitlab/callback` |
| **Confidential** | ✅ Yes | ✅ Yes |
| **Scopes** | `read_user`, `api`, `read_api` | same |

**Copy-paste Redirect URIs (add both):**

```
http://localhost:8000/auth/gitlab/callback
https://YOUR-SERVICE.onrender.com/auth/gitlab/callback
```

Replace `YOUR-SERVICE` with your real Render service name after Phase 3 (e.g. `orbit-rover-api`).

Save → copy **Application ID** → `GITLAB_OAUTH_CLIENT_ID`  
Save → copy **Secret** → `GITLAB_OAUTH_CLIENT_SECRET`

### 1.2 Personal Access Token (backend bot)

1. **https://gitlab.com/-/user_settings/personal_access_tokens**
2. Name: `orbit-rover-bot`
3. Scopes: **`api`**, **`read_api`**, **`read_repository`**
4. Copy token → `GITLAB_TOKEN`

### 1.3 Webhook (after Render is live — Phase 5)

| Field | Value |
|-------|--------|
| **URL** | `https://YOUR-SERVICE.onrender.com/webhooks/gitlab/pipeline` |
| **Secret token** | Same as `GITLAB_WEBHOOK_SECRET` in Render |
| **Trigger** | ✅ Pipeline events |

GitLab project → **Settings → Webhooks**

---

## Phase 2 — Database (Neon)

1. https://neon.tech → Sign up → **New project** → `orbit-rover`
2. Copy the connection string
3. Change the prefix for our app:

```
postgresql+asyncpg://USER:PASSWORD@ep-xxxx.neon.tech/neondb?sslmode=require
```

You will paste this as `DATABASE_URL` in Render (Phase 3).

**Realtime dashboard:** SSE at `/api/analyses/stream` — no Supabase needed.

---

## Phase 3 — Deploy backend on Render

### 3.1 Connect repo

1. Go to **https://dashboard.render.com**
2. **New +** → **Blueprint** (uses `render.yaml` in repo root)  
   **OR** **New +** → **Web Service** → connect GitHub/GitLab repo `orbit-rover`

### 3.2 Web Service settings (if not using Blueprint)

| Setting | Value |
|---------|--------|
| **Name** | `orbit-rover-api` |
| **Region** | Pick closest to you |
| **Branch** | `main` or `master` |
| **Root Directory** | `orbit-rover/backend` |
| **Runtime** | Python 3 |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | Free |

### 3.3 Environment variables (Render → Environment)

Click **Add Environment Variable** and paste from `orbit-rover/.env.example` (production section), or use:

```env
GITLAB_URL=https://gitlab.com
GITLAB_TOKEN=glpat-xxxxxxxxxxxx
GITLAB_WEBHOOK_SECRET=your-long-random-secret

GITLAB_OAUTH_CLIENT_ID=your-application-id
GITLAB_OAUTH_CLIENT_SECRET=your-application-secret
GITLAB_OAUTH_REDIRECT_URI=https://orbit-rover-api.onrender.com/auth/gitlab/callback

PUBLIC_API_URL=https://orbit-rover-api.onrender.com
DASHBOARD_BASE_URL=https://YOUR-FRONTEND.vercel.app
CORS_ORIGINS=https://YOUR-FRONTEND.vercel.app

DATABASE_URL=postgresql+asyncpg://user:pass@ep-xxx.neon.tech/neondb?sslmode=require

AUTH_ENABLED=true
SESSION_SECRET=generate-a-long-random-string-here
SESSION_COOKIE_SECURE=true

LLM_PROVIDER=mock
ORBIT_USE_MOCK=true
POST_MR_COMMENT=true
```

> Update `DASHBOARD_BASE_URL` and `CORS_ORIGINS` after Vercel deploy (Phase 4), then **Manual Deploy** on Render.

### 3.4 Deploy and copy URL

Example URL: `https://orbit-rover-api.onrender.com`

**Test:**

```
https://orbit-rover-api.onrender.com/api/health
```

Should return `"status": "healthy"`.

### 3.5 Update GitLab OAuth redirect

Go back to Phase 1.1 and add your real Render callback:

```
https://orbit-rover-api.onrender.com/auth/gitlab/callback
```

Must **exactly** match `GITLAB_OAUTH_REDIRECT_URI` in Render.

---

## Phase 4 — Deploy frontend on Vercel

1. https://vercel.com → **Add New Project** → import `orbit-rover`
2. **Root Directory:** `orbit-rover/frontend`
3. Environment variable:

```env
NEXT_PUBLIC_API_URL=https://orbit-rover-api.onrender.com
```

4. Deploy → copy URL e.g. `https://orbit-rover.vercel.app`

5. Back on **Render** → update:

```env
DASHBOARD_BASE_URL=https://orbit-rover.vercel.app
CORS_ORIGINS=https://orbit-rover.vercel.app
```

6. **Manual Deploy** on Render to apply CORS changes.

---

## Phase 5 — GitLab webhook

In your GitLab project → **Settings → Webhooks**:

```
https://orbit-rover-api.onrender.com/webhooks/gitlab/pipeline
```

Secret token = your `GITLAB_WEBHOOK_SECRET` value from Render.

---

## Phase 6 — Verify

```bash
curl https://orbit-rover-api.onrender.com/api/health
```

```bash
curl -X POST https://orbit-rover-api.onrender.com/webhooks/gitlab/pipeline/sync \
  -H "Content-Type: application/json" \
  -H "X-Gitlab-Token: YOUR_WEBHOOK_SECRET" \
  -d @orbit-rover/backend/fixtures/sample_pipeline_webhook.json
```

1. Open Vercel dashboard URL → **Sign in with GitLab**
2. See the demo analysis
3. Fail a real pipeline → MR gets Orbit Rover comment

---

## Quick reference — copy-paste URIs

```text
# GitLab OAuth Redirect URIs
http://localhost:8000/auth/gitlab/callback
https://orbit-rover-api.onrender.com/auth/gitlab/callback

# GitLab Webhook
https://orbit-rover-api.onrender.com/webhooks/gitlab/pipeline

# Vercel env
NEXT_PUBLIC_API_URL=https://orbit-rover-api.onrender.com

# Render env (backend)
PUBLIC_API_URL=https://orbit-rover-api.onrender.com
DASHBOARD_BASE_URL=https://orbit-rover.vercel.app
CORS_ORIGINS=https://orbit-rover.vercel.app
GITLAB_OAUTH_REDIRECT_URI=https://orbit-rover-api.onrender.com/auth/gitlab/callback
```

Replace `orbit-rover-api` / `orbit-rover.vercel.app` with your actual Render and Vercel hostnames.

---

## Local development

```bash
cd orbit-rover
cp .env.example .env
# Edit .env — local section only

cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

cd ../frontend
npm install
npm run dev
```

- API: http://localhost:8000  
- Dashboard: http://localhost:3000

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Render build fails | Check **Root Directory** = `orbit-rover/backend` |
| `Application failed to respond` | Free tier sleeps — first request takes ~30s |
| OAuth redirect mismatch | GitLab URI must match `GITLAB_OAUTH_REDIRECT_URI` exactly |
| Database error on deploy | Use `sqlite+aiosqlite:////tmp/orbit_rover.db` on Render until Neon is ready |
| Neon / Postgres SSL error | URL can include `?sslmode=require` — app strips it and enables SSL automatically |
| Webhook not firing | Check secret token + Pipeline events enabled |
| CORS error on dashboard | Set `CORS_ORIGINS` to exact Vercel URL, redeploy Render |
| GitLab shows old code | Switch branch to **`main`** on GitLab |

---

## More docs

- Architecture: [orbit-rover/docs/ARCHITECTURE.md](../orbit-rover/docs/ARCHITECTURE.md)
- Git remotes: [README.md](../README.md)

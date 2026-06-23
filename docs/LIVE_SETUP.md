# Orbit Detective — Live Setup Guide (Beginner)

Step-by-step plan to put Orbit Detective **live on the internet** using **GitLab only** for auth (no Google).  
Copy-paste the URIs below into GitLab when asked.

---

## What you are building

```
Developer → GitLab pipeline fails → Webhook → Your live backend → AI analysis → MR comment
                                                                    ↓
                                                          Dashboard (optional, manager view)
                                                                    ↓
                                                          Cloud database (stores analyses)
```

| Piece | What it does | Where it runs |
|-------|----------------|---------------|
| **GitLab repo** | Your code + CI | gitlab.com/aagneye-group/orbit-rover |
| **GitLab OAuth** | Login to dashboard (team members only) | GitLab → Settings → Applications |
| **GitLab PAT** | Backend talks to GitLab API (logs, MR comments) | GitLab → Access Tokens |
| **GitLab Webhook** | Tells backend when pipeline fails | Project → Settings → Webhooks |
| **Cloud database** | Stores every analysis (persistent) | **Neon** (free Postgres) — not GitHub |
| **Backend** | FastAPI agent | **Render** or **Railway** (free tier) |
| **Frontend** | Dashboard | **Vercel** (free) |

> **Important:** Analysis data is **not** stored in GitHub/GitLab commits. Commits only store **code**.  
> Pipeline analyses are stored in the **database** (Neon). If Supabase is full, use Neon (recommended below).

---

## Phase 0 — Checklist before you start

- [ ] GitLab account (you have: `aagneye-group`)
- [ ] Code on GitLab branch **`main`**: https://gitlab.com/aagneye-group/orbit-rover/-/tree/main
- [ ] Credit card **not** required for Neon + Render free tiers (Render may ask after trial)
- [ ] 30–60 minutes

---

## Phase 1 — GitLab (code + OAuth + tokens + webhook)

### 1.1 See your code on GitLab

1. Open https://gitlab.com/aagneye-group/orbit-rover
2. Branch dropdown (bottom-left) → select **`main`** (not `master`)
3. You should see `orbit-detective/` folder

Optional: merge `main` → `master` via **Merge request** so `master` shows your code too.

### 1.2 Create GitLab OAuth Application (dashboard login)

Used so only your GitLab team can open the manager dashboard.

1. Go to **https://gitlab.com/-/user_settings/applications**
   - For a **group** app: Group → **Settings → Applications**
2. Click **Add new application**
3. Fill in:

| Field | Local development | Production (after deploy) |
|-------|-------------------|----------------------------|
| **Name** | `Orbit Detective` | `Orbit Detective` |
| **Redirect URI** | `http://localhost:8000/auth/gitlab/callback` | `https://YOUR-BACKEND.onrender.com/auth/gitlab/callback` |
| **Confidential** | ✅ Yes | ✅ Yes |
| **Scopes** | `read_user`, `api`, `read_api` | same |

4. Click **Save application**
5. Copy **Application ID** → `GITLAB_OAUTH_CLIENT_ID`
6. Copy **Secret** → `GITLAB_OAUTH_CLIENT_SECRET`

**Copy-paste Redirect URIs (add BOTH if testing locally and live):**

```
http://localhost:8000/auth/gitlab/callback
https://YOUR-BACKEND.onrender.com/auth/gitlab/callback
```

Replace `YOUR-BACKEND` with your real Render URL after Phase 3.

### 1.3 Create Personal Access Token (backend → GitLab API)

The backend uses this to read pipeline logs and post MR comments.

1. **https://gitlab.com/-/user_settings/personal_access_tokens**
2. Token name: `orbit-detective-bot`
3. Scopes: **`api`**, **`read_api`**, **`read_repository`**
4. Create → copy token → `GITLAB_TOKEN`

> If your org uses SSO: you **must** use a token; password login for `git push` will not work.

### 1.4 Create Webhook (pipeline failures → your backend)

Do this **after** backend is live (Phase 3). For now, note the URL shape:

| Field | Value |
|-------|--------|
| **URL** | `https://YOUR-BACKEND.onrender.com/webhooks/gitlab/pipeline` |
| **Secret token** | Pick a long random string → `GITLAB_WEBHOOK_SECRET` |
| **Trigger** | ✅ Pipeline events |
| **SSL verification** | ✅ Enable |

Local testing with webhook: use **ngrok** (`ngrok http 8000`) and put `https://xxxx.ngrok.io/webhooks/gitlab/pipeline` as URL.

---

## Phase 2 — Database (Neon — free Postgres)

Supabase full? Use **Neon** (free tier, no card for basic use).

### 2.1 Create Neon project

1. https://neon.tech → Sign up (GitHub login is fine for Neon account only — app auth stays GitLab)
2. **New Project** → name: `orbit-detective`
3. Copy connection string (looks like):

```
postgresql://user:password@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### 2.2 Convert for our backend

Change `postgresql://` to `postgresql+asyncpg://`:

```
DATABASE_URL=postgresql+asyncpg://user:password@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

Paste into Render environment variables (Phase 3).

**What gets stored:** every pipeline analysis (cause, confidence, evidence, teams, timestamps).  
Dashboard reads from here. **Realtime:** dashboard auto-refreshes via SSE (`/api/analyses/stream`).

### Other free database options (if Neon unavailable)

| Service | Free tier | Notes |
|---------|-----------|--------|
| **Neon** | 0.5 GB | Recommended |
| **Turso** | 9 GB SQLite | Use `DATABASE_URL` with libsql adapter (advanced) |
| **Railway** | $5 credit/month | Postgres + backend in one place |
| **ElephantSQL** | 20 MB | Tiny but works for hackathon |

---

## Phase 3 — Deploy backend (Render)

### 3.1 Create Web Service

1. https://render.com → Sign up
2. **New → Web Service**
3. Connect **GitLab** (or GitHub) repo `orbit-rover`
4. Settings:

| Setting | Value |
|---------|--------|
| **Root Directory** | `orbit-detective/backend` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **Instance** | Free |

### 3.2 Environment variables (Render → Environment)

Copy from `.env.example` and fill:

```env
# GitLab API (bot token from Phase 1.3)
GITLAB_URL=https://gitlab.com
GITLAB_TOKEN=glpat-xxxxxxxxxxxxxxxxxxxx
GITLAB_WEBHOOK_SECRET=your-long-random-secret

# GitLab OAuth (from Phase 1.2)
GITLAB_OAUTH_CLIENT_ID=your-application-id
GITLAB_OAUTH_CLIENT_SECRET=your-application-secret
GITLAB_OAUTH_REDIRECT_URI=https://YOUR-SERVICE.onrender.com/auth/gitlab/callback

# URLs (update after deploy)
PUBLIC_API_URL=https://YOUR-SERVICE.onrender.com
DASHBOARD_BASE_URL=https://YOUR-FRONTEND.vercel.app
CORS_ORIGINS=https://YOUR-FRONTEND.vercel.app

# Database (from Phase 2)
DATABASE_URL=postgresql+asyncpg://user:pass@ep-xxx.neon.tech/neondb?sslmode=require

# Auth
AUTH_ENABLED=true
SESSION_SECRET=generate-a-long-random-string-here

# LLM (start with mock, add OpenAI later)
LLM_PROVIDER=mock
ORBIT_USE_MOCK=true
POST_MR_COMMENT=true
```

### 3.3 Deploy → copy URL

Example: `https://orbit-detective-api.onrender.com`

Test: open `https://YOUR-SERVICE.onrender.com/api/health` → should show `"status": "healthy"`

### 3.4 Update GitLab OAuth redirect URI

Go back to Phase 1.2 and add:

```
https://orbit-detective-api.onrender.com/auth/gitlab/callback
```

### 3.5 Add webhook (Phase 1.4)

In your **GitLab project** → Settings → Webhooks:

```
https://orbit-detective-api.onrender.com/webhooks/gitlab/pipeline
```

---

## Phase 4 — Deploy frontend (Vercel)

1. https://vercel.com → Import repo `orbit-rover`
2. **Root Directory:** `orbit-detective/frontend`
3. Environment variable:

```env
NEXT_PUBLIC_API_URL=https://YOUR-SERVICE.onrender.com
```

4. Deploy → copy URL e.g. `https://orbit-detective.vercel.app`

5. Update Render env:

```env
DASHBOARD_BASE_URL=https://orbit-detective.vercel.app
CORS_ORIGINS=https://orbit-detective.vercel.app
```

Redeploy backend after changing CORS.

---

## Phase 5 — Verify end-to-end

### 5.1 Health check

```bash
curl https://YOUR-SERVICE.onrender.com/api/health
```

### 5.2 Demo analysis (no real pipeline)

```bash
curl -X POST https://YOUR-SERVICE.onrender.com/webhooks/gitlab/pipeline/sync \
  -H "Content-Type: application/json" \
  -H "X-Gitlab-Token: YOUR_WEBHOOK_SECRET" \
  -d @orbit-detective/backend/fixtures/sample_pipeline_webhook.json
```

### 5.3 Dashboard login

1. Open `https://YOUR-FRONTEND.vercel.app`
2. Click **Sign in with GitLab**
3. Approve OAuth → you should see analyses

### 5.4 Real pipeline test

1. Push a commit that fails CI on a merge request
2. Webhook fires → MR gets Orbit Detective comment
3. Dashboard updates within ~10 seconds (realtime stream)

---

## Phase 6 — Optional upgrades

| Upgrade | When | How |
|---------|------|-----|
| **OpenAI / Claude** | Better analysis | Set `LLM_PROVIDER=openai` + `OPENAI_API_KEY` |
| **GitLab Orbit API** | Real dependency graph | `ORBIT_USE_MOCK=false` (needs Orbit enabled on group) |
| **Custom domain** | Hackathon polish | Render + Vercel domain settings |
| **GitLab CI deploy** | Auto-deploy on push | See `.gitlab-ci.yml` — add deploy stage |

---

## Quick reference — all copy-paste URIs

```text
# GitLab OAuth Redirect URIs (add all that apply)
http://localhost:8000/auth/gitlab/callback
https://YOUR-BACKEND.onrender.com/auth/gitlab/callback

# GitLab Webhook URL
https://YOUR-BACKEND.onrender.com/webhooks/gitlab/pipeline

# Dashboard → Backend API (Vercel env)
NEXT_PUBLIC_API_URL=https://YOUR-BACKEND.onrender.com

# Backend → Dashboard (Render env)
DASHBOARD_BASE_URL=https://YOUR-FRONTEND.vercel.app
CORS_ORIGINS=https://YOUR-FRONTEND.vercel.app
PUBLIC_API_URL=https://YOUR-BACKEND.onrender.com

# OAuth callback (Render env — must match GitLab app exactly)
GITLAB_OAUTH_REDIRECT_URI=https://YOUR-BACKEND.onrender.com/auth/gitlab/callback
```

---

## Local development (before going live)

```bash
cd orbit-detective
cp .env.example .env
# Edit .env with GitLab token + OAuth IDs

cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

cd ../frontend
npm install
npm run dev
```

Login locally: http://localhost:3000 → Sign in → redirects via http://localhost:8000/auth/gitlab/callback

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| GitLab shows 1 commit on `master` | Switch branch to **`main`** |
| `git push gitlab master` fails | Use `git push gitlab master:main` or unprotect `master` |
| OAuth redirect mismatch | URI in GitLab app must **exactly** match `GITLAB_OAUTH_REDIRECT_URI` |
| Webhook not firing | Check secret token, SSL URL, Pipeline events enabled |
| Dashboard empty | Run demo curl or trigger real pipeline failure |
| Database error on Render | Use `postgresql+asyncpg://` not `postgresql://` |

---

## Need help?

- Full architecture: [orbit-detective/docs/ARCHITECTURE.md](../orbit-detective/docs/ARCHITECTURE.md)
- Git push remotes: [README.md](../README.md#repositories)

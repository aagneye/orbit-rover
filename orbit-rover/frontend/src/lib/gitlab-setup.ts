import { API_PRODUCTION_URL, DOCS_LIVE_SETUP, GITLAB_OAUTH_DOCS, PRODUCTION_URL } from "@/lib/site";

export const GITLAB_SETUP_STEPS = [
  {
    id: "oauth-app",
    title: "Create a GitLab OAuth application",
    body: "GitLab → Preferences → Applications. Add redirect URI for your API callback.",
    code: `${API_PRODUCTION_URL}/auth/gitlab/callback`,
    link: GITLAB_OAUTH_DOCS,
    linkLabel: "GitLab OAuth docs",
  },
  {
    id: "render-env",
    title: "Set secrets on Render (backend API)",
    body: "Render → orbit-rover-api → Environment. Paste OAuth client ID/secret, PAT, and webhook secret.",
    items: [
      "GITLAB_OAUTH_CLIENT_ID",
      "GITLAB_OAUTH_CLIENT_SECRET",
      "GITLAB_TOKEN (glpat-… with api scope)",
      "GITLAB_WEBHOOK_SECRET (your own random string)",
      "SESSION_SECRET (long random string)",
      "DASHBOARD_BASE_URL=" + PRODUCTION_URL,
      "CORS_ORIGINS=" + PRODUCTION_URL,
    ],
    link: DOCS_LIVE_SETUP,
    linkLabel: "Full live setup guide",
  },
  {
    id: "webhook",
    title: "Add pipeline webhook in GitLab",
    body: "Project → Settings → Webhooks. Use Secret token (not Signing token) — same value as GITLAB_WEBHOOK_SECRET on Render.",
    code: `${API_PRODUCTION_URL}/webhooks/gitlab/pipeline`,
    note: "Enable Pipeline events only. Delete any webhook pointing at api.render.com/hooks — that is for Render deploys, not Orbit Rover.",
  },
  {
    id: "vercel",
    title: "Confirm Vercel frontend env",
    body: "Vercel project → Environment Variables. Production build must know the API URL.",
    code: `NEXT_PUBLIC_API_URL=${API_PRODUCTION_URL}`,
    note: "Production site: " + PRODUCTION_URL,
  },
  {
    id: "sign-in",
    title: "Sign in on the Auth tab",
    body: "Click Sign in with GitLab below. You will be redirected to GitLab, then back to the dashboard with a session.",
    note: "If login fails, check /api/health on Render — auth_enabled and oauth_configured should both be true.",
  },
] as const;

export const GITLAB_ERRORS = [
  {
    symptom: "Redirects to localhost:8000",
    fix: "Redeploy Vercel after setting NEXT_PUBLIC_API_URL. Clear browser cache.",
  },
  {
    symptom: '"Auth off" or auth_enabled: false',
    fix: "Redeploy Render backend. AUTH_ENABLED auto-enables when RENDER=true.",
  },
  {
    symptom: "OAuth not configured banner",
    fix: "Set GITLAB_OAUTH_CLIENT_ID and GITLAB_OAUTH_CLIENT_SECRET on Render, then Manual Deploy.",
  },
  {
    symptom: "403 on webhook / invalid token",
    fix: "GitLab Secret token must match GITLAB_WEBHOOK_SECRET exactly. Do not use the whsec signing token.",
  },
  {
    symptom: "Redirect URI mismatch",
    fix: `GitLab OAuth app must include ${API_PRODUCTION_URL}/auth/gitlab/callback`,
  },
] as const;

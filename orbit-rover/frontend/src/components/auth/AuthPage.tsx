"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GitLabSetupGuide } from "@/components/auth/GitLabSetupGuide";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteNav } from "@/components/site/SiteNav";
import { API_PRODUCTION_URL, PRODUCTION_URL } from "@/lib/site";
import { clearSessionToken, fetchHealth, fetchMe, getApiUrl, loginUrl, logoutUrl, type UserInfo } from "@/lib/api";

export function AuthPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [health, setHealth] = useState<{
    auth_enabled?: boolean;
    oauth_configured?: boolean;
    dashboard_base_url?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchMe().then(setUser).catch(() => setUser(null)),
      fetchHealth()
        .then(setHealth)
        .catch(() => setHealth(null)),
    ]).finally(() => setLoading(false));
  }, []);

  const apiUrl = getApiUrl();
  const oauthReady = health?.oauth_configured !== false;
  const authEnabled = health?.auth_enabled !== false;

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <SiteNav active="auth" />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-10 w-full">
        <div className="grid lg:grid-cols-5 gap-10">
          {/* Sign-in panel */}
          <section className="lg:col-span-2 space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400 font-medium mb-2">Auth</p>
              <h1 className="font-display text-3xl text-stone-900 leading-tight">
                Register &amp; sign in with <em className="italic">GitLab</em>
              </h1>
              <p className="text-stone-500 mt-3 text-sm leading-relaxed">
                The manager dashboard at{" "}
                <a href={PRODUCTION_URL} className="text-orbit-600 hover:underline">
                  orbit-rover.vercel.app
                </a>{" "}
                uses GitLab OAuth only — no Google. Complete setup below, then sign in.
              </p>
            </div>

            <div className="card-surface p-6">
              {loading ? (
                <p className="text-stone-400 text-sm">Checking API…</p>
              ) : user && !user.auth_disabled ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orbit-100 text-orbit-700 flex items-center justify-center font-semibold">
                      {(user.username || user.name || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-stone-900">@{user.username}</div>
                      <div className="text-sm text-stone-500">{user.name}</div>
                    </div>
                  </div>
                  <Link href="/dashboard" className="btn-primary w-full">
                    Go to dashboard →
                  </Link>
                  <a
                    href={logoutUrl()}
                    onClick={() => clearSessionToken()}
                    className="block text-center text-sm text-stone-500 hover:text-stone-800"
                  >
                    Sign out
                  </a>
                </div>
              ) : (
                <div className="space-y-4">
                  {!authEnabled && (
                    <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <strong>API auth is off.</strong> Redeploy Render backend — auth should auto-enable on
                      Render.
                    </div>
                  )}
                  {!oauthReady && (
                    <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <strong>GitLab OAuth not configured.</strong> Set{" "}
                      <code className="text-xs bg-white px-1 rounded">GITLAB_OAUTH_CLIENT_ID</code> and{" "}
                      <code className="text-xs bg-white px-1 rounded">GITLAB_OAUTH_CLIENT_SECRET</code> on
                      Render, then Manual Deploy.
                    </div>
                  )}
                  <a href={loginUrl()} className="btn-gitlab w-full py-3 text-base">
                    <GitLabIcon />
                    Sign in with GitLab
                  </a>
                  <p className="text-xs text-stone-400 text-center">
                    Redirects to {apiUrl}/auth/gitlab/login
                  </p>
                </div>
              )}
            </div>

            {/* API status */}
            <div className="card-surface p-5 text-sm space-y-2">
              <h3 className="font-medium text-stone-900">API status</h3>
              {health ? (
                <ul className="space-y-1 text-stone-600 font-mono text-xs">
                  <li>auth_enabled: {String(health.auth_enabled)}</li>
                  <li>oauth_configured: {String(health.oauth_configured)}</li>
                  <li>dashboard: {health.dashboard_base_url || "—"}</li>
                </ul>
              ) : (
                <p className="text-amber-700">Cannot reach API at {apiUrl}</p>
              )}
              <a
                href={`${API_PRODUCTION_URL}/api/health`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-orbit-600 hover:underline text-xs"
              >
                Open health check →
              </a>
            </div>
          </section>

          {/* Setup guide */}
          <section className="lg:col-span-3">
            <GitLabSetupGuide />
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function GitLabIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="m23.6 9.6-.033-.09L20.34.42a.85.85 0 0 0-.336-.405.87.87 0 0 0-1.027.125l-5.5 6.42-5.5-6.42a.87.87 0 0 0-1.027-.125.85.85 0 0 0-.336.405L.433 9.51l-.033.09a12.1 12.1 0 0 0 4.24 14.01l.045.03.05.036 5.52 4.08 2.73 2.05 2.73-2.05 5.52-4.08.05-.036.045-.03a12.1 12.1 0 0 0 4.24-14.01Z" />
    </svg>
  );
}

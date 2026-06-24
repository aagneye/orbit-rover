"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteNav } from "@/components/site/SiteNav";
import { DOCS_LIVE_SETUP } from "@/lib/site";
import { clearSessionToken, fetchMe, loginUrl, logoutUrl, type UserInfo } from "@/lib/api";

export function AuthPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <SiteNav active="auth" />

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-16">
        <section className="w-full max-w-md space-y-8 text-center">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-stone-400 font-medium mb-2">Auth</p>
            <h1 className="font-display text-3xl text-stone-900 leading-tight">
              Sign in with <em className="italic">GitLab</em>
            </h1>
            <p className="text-stone-500 mt-3 text-sm leading-relaxed">
              Access the manager dashboard with your GitLab account.
            </p>
          </div>

          <div className="card-surface p-8">
            {loading ? (
              <p className="text-stone-400 text-sm">Loading…</p>
            ) : user && !user.auth_disabled ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orbit-100 text-orbit-700 flex items-center justify-center font-semibold">
                    {(user.username || user.name || "?")[0].toUpperCase()}
                  </div>
                  <div className="text-left">
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
                <a href={loginUrl()} className="btn-gitlab w-full py-3 text-base">
                  <GitLabIcon />
                  Sign in with GitLab
                </a>
                <p className="text-xs text-stone-400">
                  Deploying your own instance?{" "}
                  <a
                    href={DOCS_LIVE_SETUP}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orbit-600 hover:underline"
                  >
                    See setup guide
                  </a>
                </p>
              </div>
            )}
          </div>
        </section>
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

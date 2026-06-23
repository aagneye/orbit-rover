"use client";

import { useEffect, useState } from "react";
import { clearSessionToken, fetchMe, loginUrl, logoutUrl, type UserInfo } from "@/lib/api";

export function AuthBar() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  if (user?.auth_disabled) {
    return (
      <div className="text-xs text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
        Auth off (local dev) — set <code className="text-amber-300">AUTH_ENABLED=true</code> for production
      </div>
    );
  }

  if (!user) {
    return (
      <a
        href={loginUrl()}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FC6D26] hover:bg-[#e24329] text-white text-sm font-medium transition-colors"
      >
        <GitLabIcon />
        Sign in with GitLab
      </a>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-400">@{user.username}</span>
      <a
        href={logoutUrl()}
        onClick={() => clearSessionToken()}
        className="text-xs text-slate-500 hover:text-slate-300"
      >
        Sign out
      </a>
    </div>
  );
}

function GitLabIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="m23.6 9.6-.033-.09L20.34.42a.85.85 0 0 0-.336-.405.87.87 0 0 0-1.027.125l-5.5 6.42-5.5-6.42a.87.87 0 0 0-1.027-.125.85.85 0 0 0-.336.405L.433 9.51l-.033.09a12.1 12.1 0 0 0 4.24 14.01l.045.03.05.036 5.52 4.08 2.73 2.05 2.73-2.05 5.52-4.08.05-.036.045-.03a12.1 12.1 0 0 0 4.24-14.01Z" />
    </svg>
  );
}

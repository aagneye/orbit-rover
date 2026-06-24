"use client";

import Link from "next/link";
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

  if (loading) {
    return <div className="w-24 h-9 rounded-full bg-stone-100 animate-pulse" />;
  }

  if (user?.auth_disabled) {
    return (
      <Link href="/auth" className="btn-secondary text-xs px-3 py-2">
        Sign in
      </Link>
    );
  }

  if (!user) {
    return (
      <a href={loginUrl()} className="btn-gitlab">
        <GitLabIcon />
        Sign in
      </a>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="text-right hidden sm:block">
        <div className="text-sm font-medium text-stone-900">@{user.username}</div>
        <div className="text-xs text-stone-400">{user.name}</div>
      </div>
      <a
        href={logoutUrl()}
        onClick={() => clearSessionToken()}
        className="text-xs text-stone-500 hover:text-stone-800 underline"
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

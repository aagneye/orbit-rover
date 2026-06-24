"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnalysisList } from "@/components/AnalysisList";
import { AuthBar } from "@/components/AuthBar";
import { ManagerDashboard } from "@/components/ManagerDashboard";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteNav } from "@/components/site/SiteNav";
import { StatsCards } from "@/components/StatsCards";
import {
  fetchAnalyses,
  fetchStats,
  getApiUrl,
  loginUrl,
  streamUrl,
  type AnalysisSummary,
  type Stats,
} from "@/lib/api";

const emptyStats: Stats = {
  total: 0,
  avg_confidence: 0,
  projects: [],
  avg_time_saved: "0m",
  most_common_failure: "—",
  top_affected_teams: [],
  latest_analysis: null,
};

function DashboardInner() {
  const [analyses, setAnalyses] = useState<AnalysisSummary[]>([]);
  const [stats, setStats] = useState<Stats>(emptyStats);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);

  const load = useCallback(async () => {
    try {
      const [a, s] = await Promise.all([fetchAnalyses(), fetchStats()]);
      setAnalyses(a);
      setStats(s);
      setError(null);
    } catch (e) {
      if (e instanceof Error && e.message === "UNAUTHORIZED") {
        setError("auth");
      } else {
        setError("offline");
      }
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const es = new EventSource(streamUrl());
    es.addEventListener("analyses", (ev) => {
      try {
        setAnalyses(JSON.parse(ev.data));
        setLive(true);
        fetchStats().then(setStats).catch(() => {});
      } catch {
        /* ignore */
      }
    });
    es.onerror = () => setLive(false);
    return () => es.close();
  }, []);

  if (error === "auth") {
    return (
      <div className="flex flex-col min-h-screen bg-surface">
        <SiteNav active="dashboard" />
        <main className="flex-1 max-w-lg mx-auto px-4 py-20 text-center w-full">
          <p className="text-xs uppercase tracking-[0.2em] text-stone-400 mb-3">Dashboard</p>
          <h1 className="font-display text-3xl text-stone-900 mb-3">Sign in to continue</h1>
          <p className="text-stone-500 mb-8">
            Register through the Auth tab with your GitLab account — no Google sign-in.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth" className="btn-gitlab">
              Open Auth tab →
            </Link>
            <a href={loginUrl()} className="btn-secondary">
              Sign in with GitLab
            </a>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <SiteNav active="dashboard" />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full">
        <header className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400 font-medium mb-2">
                Engineering manager view
                {live && (
                  <span className="ml-2 text-emerald-600 normal-case tracking-normal">● Live</span>
                )}
              </p>
              <h1 className="font-display text-3xl text-stone-900">Pipeline intelligence</h1>
            </div>
            <AuthBar />
          </div>
          <p className="text-sm text-stone-500 mt-3 max-w-2xl">
            Primary workflow stays in <strong className="text-stone-700">GitLab MR comments</strong>. This
            dashboard tracks analyses, time saved, and team impact.
          </p>
          {error === "offline" && (
            <div className="mt-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <strong>Backend offline.</strong> The API at{" "}
              <a href={getApiUrl()} className="underline font-mono text-xs">
                {getApiUrl()}
              </a>{" "}
              is not reachable.
            </div>
          )}
        </header>

        <StatsCards stats={stats} />

        <div className="grid lg:grid-cols-5 gap-6 mt-8">
          <section className="lg:col-span-3">
            <h2 className="text-xs uppercase tracking-[0.15em] text-stone-400 font-medium mb-4">
              Recent pipeline failures
            </h2>
            <AnalysisList analyses={analyses} />
          </section>
          <aside className="lg:col-span-2 space-y-6">
            <ManagerDashboard stats={stats} />
          </aside>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

export function LiveDashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-stone-400">Loading dashboard…</div>
      }
    >
      <DashboardInner />
    </Suspense>
  );
}

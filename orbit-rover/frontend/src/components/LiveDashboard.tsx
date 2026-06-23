"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { AnalysisList } from "@/components/AnalysisList";
import { AuthBar } from "@/components/AuthBar";
import { ManagerDashboard } from "@/components/ManagerDashboard";
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
      <main className="max-w-lg mx-auto px-4 py-24 text-center">
        <h1 className="text-xl font-semibold text-slate-200 mb-2">Sign in required</h1>
        <p className="text-slate-400 mb-6">The manager dashboard uses GitLab login (no Google).</p>
        <a href={loginUrl()} className="px-4 py-2 rounded-lg bg-[#FC6D26] text-white font-medium">
          Sign in with GitLab
        </a>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <header className="mb-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-widest text-orbit-500 font-medium mb-1">
              Secondary · Engineering Manager View
              {live && <span className="ml-2 text-emerald-400">● Live</span>}
            </p>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🛰️</span>
              <h1 className="text-2xl font-bold text-slate-100">Orbit Rover Dashboard</h1>
            </div>
          </div>
          <AuthBar />
        </div>
        <p className="text-sm text-slate-500 mt-3">
          Primary experience is inside <strong className="text-slate-400">GitLab MR comments</strong>.
          This dashboard is for managers and demos.
        </p>
        {error === "offline" && (
          <p className="text-amber-400 text-sm mt-2">
            Backend offline — check API at {getApiUrl()}
          </p>
        )}
      </header>

      <StatsCards stats={stats} />

      <div className="grid lg:grid-cols-5 gap-6 mt-8">
        <section className="lg:col-span-3">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3">
            Recent Pipeline Failures
          </h2>
          <AnalysisList analyses={analyses} />
        </section>
        <aside className="lg:col-span-2">
          <ManagerDashboard stats={stats} />
        </aside>
      </div>
    </main>
  );
}

export function LiveDashboard() {
  return (
    <Suspense fallback={<main className="p-10 text-slate-400">Loading dashboard…</main>}>
      <DashboardInner />
    </Suspense>
  );
}

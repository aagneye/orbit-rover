import { AnalysisList } from "@/components/AnalysisList";
import { ManagerDashboard } from "@/components/ManagerDashboard";
import { StatsCards } from "@/components/StatsCards";
import { fetchAnalyses, fetchStats } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let analyses = [];
  let stats = {
    total: 0,
    avg_confidence: 0,
    projects: [] as string[],
    avg_time_saved: "0m",
    top_affected_teams: [] as string[],
    most_common_failure: "—",
    latest_analysis: null,
  };

  try {
    [analyses, stats] = await Promise.all([fetchAnalyses(), fetchStats()]);
  } catch {
    // Backend may not be running during build
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <header className="mb-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-widest text-orbit-500 font-medium mb-1">
              Secondary · Engineering Manager View
            </p>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🛰️</span>
              <h1 className="text-2xl font-bold text-slate-100">Orbit Detective Dashboard</h1>
            </div>
          </div>
          <div className="text-xs text-slate-500 bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2">
            Primary UX lives in <strong className="text-slate-300">GitLab MR comments</strong>
          </div>
        </div>
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

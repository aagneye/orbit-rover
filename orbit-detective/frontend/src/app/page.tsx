import { AnalysisList } from "@/components/AnalysisList";
import { StatsCards } from "@/components/StatsCards";
import { fetchAnalyses, fetchStats } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let analyses = [];
  let stats = { total: 0, avg_confidence: 0, projects: [] as string[] };

  try {
    [analyses, stats] = await Promise.all([fetchAnalyses(), fetchStats()]);
  } catch {
    // Backend may not be running during build
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🛰️</span>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orbit-500 to-violet-400 bg-clip-text text-transparent">
            Orbit Detective
          </h1>
        </div>
        <p className="text-slate-400 max-w-2xl">
          AI-powered GitLab pipeline root-cause analysis. When CI fails, Orbit investigates
          automatically — logs, dependencies, ownership — and comments on your merge request.
        </p>
        <div className="mt-4 p-4 rounded-lg bg-slate-900/40 border border-slate-800 text-xs font-mono text-slate-500 leading-relaxed hidden lg:block">
          Developer → GitLab Pipeline → Webhook → FastAPI → GitLab API + Orbit API + LLM → MR Comment
        </div>
      </header>

      <div className="mb-8">
        <StatsCards stats={stats} />
      </div>

      <section>
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Recent Pipeline Failures</h2>
        <AnalysisList analyses={analyses} />
      </section>
    </main>
  );
}

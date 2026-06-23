import Link from "next/link";
import { confidenceClass, formatConfidence } from "@/lib/api";
import type { Stats } from "@/lib/api";

interface Props {
  stats: Stats;
}

export function ManagerDashboard({ stats }: Props) {
  const latest = stats.latest_analysis;

  return (
    <div className="space-y-6">
      {(stats.top_affected_teams?.length ?? 0) > 0 && (
        <section className="card-glow rounded-xl bg-slate-900/60 p-5">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3">
            Top Affected Teams
          </h2>
          <div className="flex flex-wrap gap-2">
            {stats.top_affected_teams!.map((team) => (
              <span key={team} className="px-3 py-1.5 rounded-lg bg-orbit-700/30 text-orbit-100 text-sm font-medium">
                {team}
              </span>
            ))}
          </div>
        </section>
      )}

      {latest && (
        <section className="card-glow rounded-xl bg-gradient-to-br from-orbit-900/40 to-slate-900/60 p-6 border border-orbit-500/20">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3">
            Latest Analysis
          </h2>
          <p className="text-lg font-semibold text-slate-100 mb-2">{latest.cause}</p>
          <p className="text-sm text-slate-400 mb-4 line-clamp-2">{latest.summary}</p>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <span className="text-xs text-slate-500">Confidence</span>
              <div className={`text-3xl font-bold ${confidenceClass(latest.confidence)}`}>
                {formatConfidence(latest.confidence)}
              </div>
            </div>
            <div className="flex gap-3">
              {latest.gitlab_link && (
                <a
                  href={latest.gitlab_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg bg-orbit-600 hover:bg-orbit-500 text-white text-sm font-medium transition-colors"
                >
                  View in GitLab →
                </a>
              )}
              <Link
                href={`/analyses/${latest.id}`}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors"
              >
                Full Report
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

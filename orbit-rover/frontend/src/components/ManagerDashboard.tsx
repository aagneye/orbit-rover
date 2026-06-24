import Link from "next/link";
import { confidenceClass, formatConfidence } from "@/lib/api";
import type { Stats } from "@/lib/api";

interface Props {
  stats: Stats;
}

export function ManagerDashboard({ stats }: Props) {
  const latest = stats.latest_analysis;

  return (
    <div className="space-y-4">
      {(stats.top_affected_teams?.length ?? 0) > 0 && (
        <section className="card-surface p-5">
          <h2 className="text-xs uppercase tracking-[0.15em] text-stone-400 font-medium mb-3">
            Top affected teams
          </h2>
          <div className="flex flex-wrap gap-2">
            {stats.top_affected_teams!.map((team) => (
              <span
                key={team}
                className="px-3 py-1 rounded-full bg-stone-100 text-stone-700 text-sm font-medium"
              >
                {team}
              </span>
            ))}
          </div>
        </section>
      )}

      {latest ? (
        <section className="card-surface p-6 border-orbit-200 bg-gradient-to-br from-orbit-50/80 to-white">
          <h2 className="text-xs uppercase tracking-[0.15em] text-stone-400 font-medium mb-3">
            Latest analysis
          </h2>
          <p className="font-medium text-stone-900 leading-snug mb-2">{latest.cause}</p>
          <p className="text-sm text-stone-500 mb-4 line-clamp-2">{latest.summary}</p>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <span className="text-xs text-stone-400">Confidence</span>
              <div className={`text-2xl font-bold tabular-nums ${confidenceClass(latest.confidence)}`}>
                {formatConfidence(latest.confidence)}
              </div>
            </div>
            <div className="flex gap-2">
              {latest.gitlab_link && (
                <a
                  href={latest.gitlab_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary text-xs px-3 py-2"
                >
                  GitLab →
                </a>
              )}
              <Link href={`/analyses/${latest.id}`} className="btn-secondary text-xs px-3 py-2">
                Full report
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="card-surface p-5 text-sm text-stone-500">
          Latest analysis will appear here after your first pipeline failure is processed.
        </section>
      )}
    </div>
  );
}

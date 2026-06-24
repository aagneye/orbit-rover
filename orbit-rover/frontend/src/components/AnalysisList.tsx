import Link from "next/link";
import { confidenceClass, formatConfidence } from "@/lib/api";
import type { AnalysisSummary } from "@/lib/api";

interface Props {
  analyses: AnalysisSummary[];
}

export function AnalysisList({ analyses }: Props) {
  if (analyses.length === 0) {
    return (
      <div className="card-surface p-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center text-2xl mx-auto mb-4">
          🛰️
        </div>
        <h3 className="font-display text-xl text-stone-900">No pipeline failures yet</h3>
        <p className="text-stone-500 mt-2 max-w-md mx-auto text-sm leading-relaxed">
          In production, Orbit Rover comments on GitLab merge requests when CI fails. For a local demo,
          run <code className="text-xs bg-stone-100 px-1.5 py-0.5 rounded font-mono">scripts/demo.ps1</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {analyses.map((a) => {
        const service = a.project_path.split("/").pop()?.replace(/-/g, " ") || a.project_path;
        return (
          <div
            key={a.id}
            className="card-surface p-4 flex items-center justify-between gap-4 hover:border-stone-300 transition-colors"
          >
            <div className="min-w-0 flex-1">
              <div className="font-medium text-stone-900 capitalize">{service} pipeline</div>
              <div className="text-sm text-stone-500 truncate mt-0.5">{a.cause}</div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className={`text-sm font-semibold tabular-nums ${confidenceClass(a.confidence)}`}>
                {formatConfidence(a.confidence)}
              </span>
              {a.mr_url ? (
                <a
                  href={a.mr_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-orbit-600 hover:text-orbit-700"
                >
                  GitLab →
                </a>
              ) : (
                <Link
                  href={`/analyses/${a.id}`}
                  className="text-xs font-medium text-stone-500 hover:text-orbit-600"
                >
                  Details →
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

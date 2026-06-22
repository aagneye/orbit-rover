import Link from "next/link";
import { confidenceClass, formatConfidence } from "@/lib/api";
import type { AnalysisSummary } from "@/lib/api";

interface Props {
  analyses: AnalysisSummary[];
}

export function AnalysisList({ analyses }: Props) {
  if (analyses.length === 0) {
    return (
      <div className="card-glow rounded-xl bg-slate-900/60 p-12 text-center">
        <div className="text-4xl mb-4">🛰️</div>
        <h3 className="text-lg font-semibold text-slate-200">No pipeline failures yet</h3>
        <p className="text-slate-400 mt-2 max-w-md mx-auto">
          Run <code className="text-orbit-400">scripts/demo.ps1</code> to simulate a failure.
          In production, Orbit Detective comments directly on GitLab merge requests.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {analyses.map((a) => {
        const service = a.project_path.split("/").pop()?.replace(/-/g, " ") || a.project_path;
        return (
          <div
            key={a.id}
            className="card-glow rounded-xl bg-slate-900/60 p-4 flex items-center justify-between gap-4"
          >
            <div className="min-w-0 flex-1">
              <div className="font-medium text-slate-200 capitalize">{service} Pipeline</div>
              <div className="text-sm text-slate-500 truncate">{a.cause}</div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className={`text-sm font-bold ${confidenceClass(a.confidence)}`}>
                {formatConfidence(a.confidence)}
              </span>
              {a.mr_url ? (
                <a
                  href={a.mr_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-orbit-400 hover:text-orbit-300"
                >
                  GitLab →
                </a>
              ) : (
                <Link href={`/analyses/${a.id}`} className="text-xs text-slate-400 hover:text-orbit-400">
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

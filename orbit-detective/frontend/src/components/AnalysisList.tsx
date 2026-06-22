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
        <h3 className="text-lg font-semibold text-slate-200">No analyses yet</h3>
        <p className="text-slate-400 mt-2 max-w-md mx-auto">
          Trigger a pipeline failure webhook or run the demo script to see Orbit Detective in action.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {analyses.map((a) => (
        <Link
          key={a.id}
          href={`/analyses/${a.id}`}
          className="block card-glow rounded-xl bg-slate-900/60 p-5 hover:bg-slate-800/60 transition-colors group"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                <span className="font-mono">{a.project_path}</span>
                <span>·</span>
                <span>pipeline #{a.pipeline_iid}</span>
                <span>·</span>
                <span className="text-red-400">{a.status}</span>
              </div>
              <h3 className="font-semibold text-slate-100 group-hover:text-orbit-500 transition-colors truncate">
                {a.cause}
              </h3>
              <p className="text-sm text-slate-400 mt-1 line-clamp-2">{a.summary}</p>
            </div>
            <div className="text-right shrink-0">
              <div className={`text-2xl font-bold ${confidenceClass(a.confidence)}`}>
                {formatConfidence(a.confidence)}
              </div>
              <div className="text-xs text-slate-500 mt-1">{a.branch}</div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

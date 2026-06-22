import Link from "next/link";
import { confidenceClass, formatConfidence, formatDate } from "@/lib/api";
import type { AnalysisDetail } from "@/lib/api";

interface Props {
  analysis: AnalysisDetail;
}

export function AnalysisDetailView({ analysis }: Props) {
  const { report } = analysis;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-sm text-slate-400">
        <Link href="/" className="hover:text-orbit-500 transition-colors">← Dashboard</Link>
        <span>·</span>
        <span className="font-mono">{analysis.project_path}</span>
      </div>

      <header className="card-glow rounded-xl bg-slate-900/60 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-medium mb-3">
              Pipeline Failed · #{analysis.pipeline_iid}
            </div>
            <h1 className="text-2xl font-bold text-slate-100">{report.cause}</h1>
            <p className="text-slate-400 mt-2">{report.summary}</p>
          </div>
          <div className="text-center shrink-0">
            <div className={`text-4xl font-bold ${confidenceClass(report.confidence)}`}>
              {formatConfidence(report.confidence)}
            </div>
            <div className="text-xs text-slate-500 mt-1">confidence</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-400">
          <span>Branch: <code className="text-orbit-500">{analysis.branch}</code></span>
          <span>Analyzed: {formatDate(analysis.created_at)}</span>
          <span>Provider: {analysis.provider}/{analysis.model}</span>
          {analysis.mr_comment_posted && (
            <span className="text-emerald-400">✓ MR comment posted</span>
          )}
        </div>
      </header>

      {report.breaking_change && (
        <section className="card-glow rounded-xl bg-amber-500/5 border border-amber-500/20 p-5">
          <h2 className="font-semibold text-amber-400 mb-2">Breaking Change</h2>
          <p className="text-slate-300">{report.breaking_change}</p>
        </section>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="card-glow rounded-xl bg-slate-900/60 p-5">
          <h2 className="font-semibold text-slate-200 mb-4">Evidence</h2>
          <ul className="space-y-3">
            {report.evidence.map((e, i) => (
              <li key={i} className="border-l-2 border-orbit-500 pl-3">
                <div className="text-xs text-orbit-500 font-mono uppercase">{e.source}</div>
                <div className="text-sm text-slate-300">{e.summary}</div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card-glow rounded-xl bg-slate-900/60 p-5">
          <h2 className="font-semibold text-slate-200 mb-4">Blast Radius</h2>
          <div className="mb-3">
            <span className="text-xs text-slate-500">Severity</span>
            <div className="text-lg font-semibold uppercase text-red-400">{report.blast_radius.severity}</div>
          </div>
          <div className="mb-3">
            <span className="text-xs text-slate-500">Services</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {report.blast_radius.services.map((s) => (
                <span key={s} className="px-2 py-1 rounded bg-slate-800 text-sm font-mono">{s}</span>
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-500">Teams</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {report.blast_radius.teams.map((t) => (
                <span key={t} className="px-2 py-1 rounded bg-orbit-700/30 text-sm">{t}</span>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="card-glow rounded-xl bg-slate-900/60 p-5">
        <h2 className="font-semibold text-slate-200 mb-4">Affected Services</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {report.affected_services.map((s) => (
            <div key={s.name} className="rounded-lg bg-slate-800/50 p-3">
              <div className="font-medium text-slate-200">{s.name}</div>
              <div className="text-xs text-slate-500">{s.team}</div>
              <div className="text-sm text-slate-400 mt-1">{s.impact}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="card-glow rounded-xl bg-slate-900/60 p-5">
        <h2 className="font-semibold text-slate-200 mb-4">Recommendations</h2>
        <ul className="space-y-3">
          {report.suggested_fixes.map((f, i) => (
            <li key={i} className="flex gap-3">
              <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium uppercase ${
                f.priority === "high" ? "bg-red-500/20 text-red-400" :
                f.priority === "medium" ? "bg-amber-500/20 text-amber-400" :
                "bg-slate-700 text-slate-400"
              }`}>{f.priority}</span>
              <div>
                <div className="text-slate-200">{f.action}</div>
                {f.details && <div className="text-sm text-slate-500 mt-0.5">{f.details}</div>}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {report.responsible_mr && (
        <section className="card-glow rounded-xl bg-slate-900/60 p-5">
          <h2 className="font-semibold text-slate-200 mb-2">Responsible MR</h2>
          <a
            href={report.responsible_mr.url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-orbit-500 hover:underline"
          >
            !{report.responsible_mr.iid} — {report.responsible_mr.title}
          </a>
          {report.reviewer && (
            <p className="text-sm text-slate-400 mt-2">Reviewer: {report.reviewer}</p>
          )}
        </section>
      )}
    </div>
  );
}

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
      <div className="flex items-center gap-3 text-sm text-stone-500">
        <Link href="/dashboard" className="hover:text-orbit-600 transition-colors font-medium">
          ← Dashboard
        </Link>
        <span>·</span>
        <span className="font-mono text-xs">{analysis.project_path}</span>
      </div>

      <header className="card-surface p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-medium mb-3 border border-red-100">
              Pipeline failed · #{analysis.pipeline_iid}
            </div>
            <h1 className="font-display text-2xl text-stone-900">{report.cause}</h1>
            <p className="text-stone-500 mt-2">{report.summary}</p>
          </div>
          <div className="text-center shrink-0">
            <div className={`text-4xl font-bold tabular-nums ${confidenceClass(report.confidence)}`}>
              {formatConfidence(report.confidence)}
            </div>
            <div className="text-xs text-stone-400 mt-1">confidence</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mt-4 text-sm text-stone-500">
          <span>
            Branch: <code className="text-orbit-600 bg-orbit-50 px-1 rounded">{analysis.branch}</code>
          </span>
          <span>Analyzed: {formatDate(analysis.created_at)}</span>
          <span>
            Provider: {analysis.provider}/{analysis.model}
          </span>
          {analysis.mr_comment_posted && <span className="text-emerald-600 font-medium">✓ MR comment posted</span>}
        </div>
      </header>

      {report.breaking_change && (
        <section className="card-surface p-5 border-amber-200 bg-amber-50/60">
          <h2 className="font-semibold text-amber-900 mb-2">Breaking change</h2>
          <p className="text-stone-700">{report.breaking_change}</p>
        </section>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="card-surface p-5">
          <h2 className="font-semibold text-stone-900 mb-4">Evidence</h2>
          <ul className="space-y-3">
            {report.evidence.map((e, i) => (
              <li key={i} className="border-l-2 border-orbit-400 pl-3">
                <div className="text-xs text-orbit-600 font-mono uppercase">{e.source}</div>
                <div className="text-sm text-stone-600">{e.summary}</div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card-surface p-5">
          <h2 className="font-semibold text-stone-900 mb-4">Blast radius</h2>
          <div className="mb-3">
            <span className="text-xs text-stone-400">Severity</span>
            <div className="text-lg font-semibold uppercase text-red-600">{report.blast_radius.severity}</div>
          </div>
          <div className="mb-3">
            <span className="text-xs text-stone-400">Services</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {report.blast_radius.services.map((s) => (
                <span key={s} className="px-2 py-1 rounded-lg bg-stone-100 text-sm font-mono text-stone-700">
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs text-stone-400">Teams</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {report.blast_radius.teams.map((t) => (
                <span key={t} className="px-2 py-1 rounded-full bg-orbit-50 text-orbit-800 text-sm">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="card-surface p-5">
        <h2 className="font-semibold text-stone-900 mb-4">Affected services</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {report.affected_services.map((s) => (
            <div key={s.name} className="rounded-xl bg-stone-50 border border-surface-border p-3">
              <div className="font-medium text-stone-900">{s.name}</div>
              <div className="text-xs text-stone-400">{s.team}</div>
              <div className="text-sm text-stone-600 mt-1">{s.impact}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="card-surface p-5">
        <h2 className="font-semibold text-stone-900 mb-4">Recommendations</h2>
        <ul className="space-y-3">
          {report.suggested_fixes.map((f, i) => (
            <li key={i} className="flex gap-3">
              <span
                className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium uppercase ${
                  f.priority === "high"
                    ? "bg-red-50 text-red-700 border border-red-100"
                    : f.priority === "medium"
                      ? "bg-amber-50 text-amber-800 border border-amber-100"
                      : "bg-stone-100 text-stone-600"
                }`}
              >
                {f.priority}
              </span>
              <div>
                <div className="text-stone-900">{f.action}</div>
                {f.details && <div className="text-sm text-stone-500 mt-0.5">{f.details}</div>}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {report.responsible_mr && (
        <section className="card-surface p-5">
          <h2 className="font-semibold text-stone-900 mb-2">Responsible MR</h2>
          <a
            href={report.responsible_mr.url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-orbit-600 hover:underline font-medium"
          >
            !{report.responsible_mr.iid} — {report.responsible_mr.title}
          </a>
          {report.reviewer && <p className="text-sm text-stone-500 mt-2">Reviewer: {report.reviewer}</p>}
        </section>
      )}
    </div>
  );
}

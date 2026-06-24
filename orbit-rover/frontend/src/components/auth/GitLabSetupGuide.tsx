import { GITLAB_ERRORS, GITLAB_SETUP_STEPS } from "@/lib/gitlab-setup";

export function GitLabSetupGuide({ compact = false }: { compact?: boolean }) {
  return (
    <div className="space-y-6">
      {!compact && (
        <div>
          <h2 className="text-lg font-semibold text-stone-900 mb-1">GitLab setup checklist</h2>
          <p className="text-sm text-stone-500">
            Complete these steps once. Orbit Rover will then analyze failed pipelines and post MR comments
            automatically.
          </p>
        </div>
      )}

      <ol className="space-y-4">
        {GITLAB_SETUP_STEPS.map((step, i) => (
          <li key={step.id} className="card-surface p-5">
            <div className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-stone-100 text-stone-600 text-sm font-medium flex items-center justify-center">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-stone-900">{step.title}</h3>
                <p className="text-sm text-stone-500 mt-1">{step.body}</p>
                {"code" in step && step.code && (
                  <pre className="mt-3 text-xs font-mono bg-stone-50 border border-surface-border rounded-lg p-3 overflow-x-auto text-stone-700">
                    {step.code}
                  </pre>
                )}
                {"items" in step && step.items && (
                  <ul className="mt-3 space-y-1">
                    {step.items.map((item) => (
                      <li key={item} className="text-xs font-mono text-stone-600">
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
                {"note" in step && step.note && (
                  <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    {step.note}
                  </p>
                )}
                {"link" in step && step.link && (
                  <a
                    href={step.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-3 text-sm text-orbit-600 hover:text-orbit-700 font-medium"
                  >
                    {step.linkLabel} →
                  </a>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>

      {!compact && (
        <div className="card-surface p-5 border-amber-200 bg-amber-50/50">
          <h3 className="font-medium text-stone-900 mb-3">Common GitLab / deploy errors</h3>
          <dl className="space-y-3">
            {GITLAB_ERRORS.map((err) => (
              <div key={err.symptom} className="text-sm">
                <dt className="font-medium text-stone-800">{err.symptom}</dt>
                <dd className="text-stone-600 mt-0.5">{err.fix}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}

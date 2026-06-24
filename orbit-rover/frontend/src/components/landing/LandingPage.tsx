import Link from "next/link";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteNav } from "@/components/site/SiteNav";

export function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <SiteNav active="home" />

      <main>
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-16">
          <div className="relative hero-mesh hero-noise rounded-4xl overflow-hidden shadow-hero min-h-[420px] flex flex-col items-center justify-center text-center px-6 py-16">
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-white/90 text-xs font-medium mb-8 border border-white/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Built for GitLab CI/CD teams
              </div>
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-white leading-[1.1] tracking-tight">
                Pipeline failed at 2am?{" "}
                <em className="not-italic font-display italic opacity-95">Let Orbit Rover find out why.</em>
              </h1>
              <p className="mt-6 text-lg text-white/80 max-w-xl mx-auto leading-relaxed">
                Orbit Rover turns failed jobs, merge requests, and your Orbit dependency graph into a
                root-cause report — posted right on your MR.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/auth"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-stone-900 font-medium hover:bg-stone-100 transition-colors shadow-lg"
                >
                  Get started with GitLab →
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white/10 text-white font-medium border border-white/25 hover:bg-white/20 transition-colors backdrop-blur"
                >
                  View dashboard
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* About */}
        <section id="about" className="bg-grid border-y border-surface-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400 font-medium mb-4">
                What Orbit Rover is
              </p>
              <h2 className="font-display text-3xl sm:text-4xl text-stone-900 leading-tight">
                Root-cause analysis that lives in your merge request —{" "}
                <em className="italic">not another tab.</em>
              </h2>
              <div className="mt-6 space-y-4 text-stone-600 leading-relaxed">
                <p>
                  When a pipeline fails, someone on your team usually spends hours reading logs, tracing
                  commits, and asking which services are downstream. Orbit Rover does that automatically.
                </p>
                <p>
                  Connect your GitLab project with a webhook and OAuth. On failure, the agent pulls job
                  traces, MR context, recent commits, and Orbit graph data — then posts a structured
                  diagnosis with evidence and suggested fixes.
                </p>
                <p>
                  Engineering managers get a secondary dashboard at{" "}
                  <strong className="text-stone-800">orbit-rover.vercel.app</strong> for time saved,
                  team impact, and demo visibility.
                </p>
              </div>
            </div>
            <div className="relative aspect-square max-w-md mx-auto lg:ml-auto w-full">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-400 via-sky-300 to-blue-500 opacity-90 hero-noise shadow-hero" />
              <div className="absolute inset-4 rounded-2xl border border-white/30 backdrop-blur-sm bg-white/10 flex items-center justify-center">
                <div className="text-center text-white p-6">
                  <div className="text-5xl mb-4">🛰️</div>
                  <p className="font-display text-2xl italic">~3 hours saved</p>
                  <p className="text-sm text-white/80 mt-2">per manual investigation avoided</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <p className="text-xs uppercase tracking-[0.2em] text-stone-400 font-medium mb-4 text-center">
            How it works
          </p>
          <h2 className="font-display text-3xl text-stone-900 text-center mb-12">
            Four steps, zero context switching
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "Pipeline fails",
                body: "GitLab sends a webhook to Orbit Rover when CI goes red.",
              },
              {
                step: "02",
                title: "Context collected",
                body: "Logs, MR details, commits, and Orbit blast radius in parallel.",
              },
              {
                step: "03",
                title: "AI analyzes",
                body: "Structured report with cause, confidence, evidence, and fixes.",
              },
              {
                step: "04",
                title: "MR comment",
                body: "Developers see the diagnosis where they already work — in GitLab.",
              },
            ].map((item) => (
              <div key={item.step} className="card-surface p-6">
                <div className="text-xs font-mono text-orbit-600 mb-3">{item.step}</div>
                <h3 className="font-semibold text-stone-900 mb-2">{item.title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
          <div className="card-surface p-10 sm:p-14 text-center">
            <h2 className="font-display text-3xl text-stone-900 mb-4">
              Register through the <em className="italic">Auth</em> tab
            </h2>
            <p className="text-stone-500 max-w-lg mx-auto mb-8">
              Sign in with GitLab to access the manager dashboard. First-time setup takes about 10
              minutes — we walk you through OAuth, webhooks, and Render env vars.
            </p>
            <Link href="/auth" className="btn-gitlab px-8 py-3">
              Open Auth → Sign in with GitLab
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

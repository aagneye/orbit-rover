"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnalysisDetailView } from "@/components/AnalysisDetail";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteNav } from "@/components/site/SiteNav";
import { fetchAnalysis, loginUrl, type AnalysisDetail } from "@/lib/api";

export function AnalysisDetailClient({ id }: { id: string }) {
  const [analysis, setAnalysis] = useState<AnalysisDetail | null>(null);
  const [error, setError] = useState<"auth" | "notfound" | null>(null);

  useEffect(() => {
    fetchAnalysis(id)
      .then(setAnalysis)
      .catch((e) => setError(e instanceof Error && e.message === "UNAUTHORIZED" ? "auth" : "notfound"));
  }, [id]);

  if (error === "auth") {
    return (
      <div className="flex flex-col min-h-screen bg-surface">
        <SiteNav active="dashboard" />
        <main className="flex-1 max-w-lg mx-auto px-4 py-24 text-center">
          <h1 className="font-display text-2xl text-stone-900 mb-3">Sign in required</h1>
          <p className="text-stone-500 mb-6 text-sm">Use the Auth tab to register with GitLab first.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth" className="btn-gitlab">
              Open Auth tab
            </Link>
            <a href={loginUrl()} className="btn-secondary">
              Sign in with GitLab
            </a>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (error === "notfound" || !analysis) {
    return (
      <div className="flex flex-col min-h-screen bg-surface">
        <SiteNav active="dashboard" />
        <main className="flex-1 max-w-lg mx-auto px-4 py-24 text-center text-stone-500">
          {error ? "Analysis not found" : "Loading…"}
          <div className="mt-4">
            <Link href="/dashboard" className="text-orbit-600 hover:underline font-medium">
              ← Dashboard
            </Link>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <SiteNav active="dashboard" />
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-10 w-full">
        <AnalysisDetailView analysis={analysis} />
      </main>
      <SiteFooter />
    </div>
  );
}

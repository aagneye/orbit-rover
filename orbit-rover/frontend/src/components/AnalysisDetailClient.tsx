"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnalysisDetailView } from "@/components/AnalysisDetail";
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
      <main className="max-w-lg mx-auto px-4 py-24 text-center">
        <h1 className="text-xl font-semibold text-slate-200 mb-2">Sign in required</h1>
        <a href={loginUrl()} className="px-4 py-2 rounded-lg bg-[#FC6D26] text-white font-medium">
          Sign in with GitLab
        </a>
      </main>
    );
  }

  if (error === "notfound" || !analysis) {
    return (
      <main className="max-w-lg mx-auto px-4 py-24 text-center text-slate-400">
        {error ? "Analysis not found" : "Loading…"}
        <div className="mt-4">
          <Link href="/" className="text-orbit-400 hover:underline">← Dashboard</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <AnalysisDetailView analysis={analysis} />
    </main>
  );
}

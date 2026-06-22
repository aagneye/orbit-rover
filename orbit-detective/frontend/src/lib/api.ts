const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface AnalysisSummary {
  id: string;
  project_path: string;
  pipeline_id: number;
  pipeline_iid: number;
  pipeline_url: string | null;
  branch: string;
  status: string;
  cause: string;
  confidence: number;
  summary: string;
  mr_iid: number | null;
  mr_url: string | null;
  created_at: string;
  provider: string;
  model: string;
}

export interface AnalysisDetail extends AnalysisSummary {
  report: {
    cause: string;
    confidence: number;
    summary: string;
    evidence: Array<{ source: string; summary: string; detail?: string }>;
    blast_radius: { services: string[]; teams: string[]; severity: string };
    affected_services: Array<{ name: string; impact: string; team?: string }>;
    affected_teams: string[];
    suggested_fixes: Array<{ action: string; priority: string; details?: string }>;
    responsible_mr?: { iid: number; title: string; url?: string; author?: string };
    reviewer?: string;
    breaking_change?: string;
  };
  mr_comment_posted: boolean;
}

export interface Stats {
  total: number;
  avg_confidence: number;
  projects: string[];
}

export async function fetchAnalyses(): Promise<AnalysisSummary[]> {
  const res = await fetch(`${API_URL}/api/analyses`, { next: { revalidate: 10 } });
  if (!res.ok) throw new Error("Failed to fetch analyses");
  return res.json();
}

export async function fetchAnalysis(id: string): Promise<AnalysisDetail> {
  const res = await fetch(`${API_URL}/api/analyses/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Analysis not found");
  return res.json();
}

export async function fetchStats(): Promise<Stats> {
  const res = await fetch(`${API_URL}/api/stats`, { next: { revalidate: 10 } });
  if (!res.ok) return { total: 0, avg_confidence: 0, projects: [] };
  return res.json();
}

export function confidenceClass(confidence: number): string {
  if (confidence >= 0.9) return "confidence-high";
  if (confidence >= 0.7) return "confidence-medium";
  return "confidence-low";
}

export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

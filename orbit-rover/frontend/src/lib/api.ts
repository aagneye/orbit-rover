const PRODUCTION_API_URL = "https://orbit-rover-api.onrender.com";

export function getApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }
  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_API_URL;
  }
  return "http://localhost:8000";
}

const API_URL = getApiUrl();
const SESSION_KEY = "orbit_session";

export interface UserInfo {
  username?: string;
  name?: string;
  avatar_url?: string;
  auth_disabled?: boolean;
}

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
  avg_time_saved?: string;
  avg_time_saved_minutes?: number;
  most_common_failure?: string;
  top_affected_teams?: string[];
  recent_failures?: Array<{
    id: string;
    label: string;
    project_path: string;
    cause: string;
    confidence: number;
    mr_url: string | null;
    pipeline_url: string | null;
  }>;
  latest_analysis?: {
    id: string;
    cause: string;
    confidence: number;
    summary: string;
    mr_url: string | null;
    pipeline_url: string | null;
    gitlab_link: string | null;
  } | null;
}

export function getSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_KEY);
}

export function setSessionToken(token: string): void {
  localStorage.setItem(SESSION_KEY, token);
}

export function clearSessionToken(): void {
  localStorage.removeItem(SESSION_KEY);
}

function authHeaders(): HeadersInit {
  const token = getSessionToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: { ...authHeaders(), ...init?.headers },
  });
}

export function loginUrl(): string {
  return `${API_URL}/auth/gitlab/login`;
}

export function logoutUrl(): string {
  return `${API_URL}/auth/gitlab/logout`;
}

export function streamUrl(): string {
  const token = getSessionToken();
  return token
    ? `${API_URL}/api/analyses/stream?token=${encodeURIComponent(token)}`
    : `${API_URL}/api/analyses/stream`;
}

export async function fetchMe(): Promise<UserInfo> {
  const res = await apiFetch("/auth/gitlab/me");
  if (!res.ok) throw new Error("Not signed in");
  return res.json();
}

export async function fetchAnalyses(): Promise<AnalysisSummary[]> {
  const res = await apiFetch("/api/analyses", { cache: "no-store" });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw new Error("Failed to fetch analyses");
  return res.json();
}

export async function fetchAnalysis(id: string): Promise<AnalysisDetail> {
  const res = await apiFetch(`/api/analyses/${id}`, { cache: "no-store" });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw new Error("Analysis not found");
  return res.json();
}

export async function fetchStats(): Promise<Stats> {
  const res = await apiFetch("/api/stats", { cache: "no-store" });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) {
    return {
      total: 0,
      avg_confidence: 0,
      projects: [],
      avg_time_saved: "0m",
      most_common_failure: "—",
      top_affected_teams: [],
      latest_analysis: null,
    };
  }
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

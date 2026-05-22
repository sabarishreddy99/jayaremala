"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api/client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PeriodStats { total_responses: number; unique_visitors: number }
interface Feedback { total: number; positive: number; negative: number; satisfaction_pct: number }
interface Question { text: string; count: number }
interface BlogPost { slug: string; views: number; claps: number }
interface BlogSummary { total_views: number; total_claps: number; posts: BlogPost[] }

interface AdminStats {
  conversations: { week: PeriodStats; month: PeriodStats; all: PeriodStats };
  feedback: Feedback;
  top_questions: Question[];
  blog: BlogSummary;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, color = "default",
}: { label: string; value: string | number; sub?: string; color?: "default" | "emerald" | "rose" | "indigo" }) {
  const accent = {
    default: "text-fg",
    emerald: "text-emerald-600 dark:text-emerald-400",
    rose: "text-rose-600 dark:text-rose-400",
    indigo: "text-indigo-600 dark:text-indigo-400",
  }[color];
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 flex flex-col gap-1">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-fg-faint">{label}</p>
      <p className={`text-3xl font-bold tabular-nums ${accent}`}>{typeof value === "number" ? fmt(value) : value}</p>
      {sub && <p className="text-[11px] text-fg-faint">{sub}</p>}
    </div>
  );
}

function SatisfactionBar({ positive, negative }: { positive: number; negative: number }) {
  const total = positive + negative;
  if (total === 0) return <p className="text-xs text-fg-faint">No feedback yet</p>;
  const pct = Math.round((positive / total) * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-emerald-600 dark:text-emerald-400 font-medium">👍 {positive} positive</span>
        <span className="text-rose-600 dark:text-rose-400 font-medium">{negative} negative 👎</span>
      </div>
      <div className="h-2 rounded-full bg-surface-raised overflow-hidden">
        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[10px] text-fg-faint text-center">{pct}% satisfaction from {total} rated responses</p>
    </div>
  );
}

// ── Login ─────────────────────────────────────────────────────────────────────

function LoginForm({ onAuth }: { onAuth: (token: string) => void }) {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/stats/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { onAuth(token); }
      else { setError("Invalid token — check your ADMIN_TOKEN env var."); }
    } catch {
      setError("Could not reach the backend.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-fg-faint">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span className="text-sm font-semibold text-fg">Avocado Admin</span>
        </div>
        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-surface p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-fg-muted mb-1.5">Admin token</label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter ADMIN_TOKEN"
              className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:border-accent transition-colors"
              autoFocus
            />
          </div>
          {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
          <button
            type="submit"
            disabled={!token || loading}
            className="w-full rounded-xl bg-fg text-bg py-2 text-sm font-semibold hover:opacity-80 transition-opacity disabled:opacity-40"
          >
            {loading ? "Verifying…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

type Period = "week" | "month" | "all";
const PERIOD_LABELS: Record<Period, string> = { week: "This week", month: "This month", all: "All time" };

function Dashboard({ stats, onLogout }: { stats: AdminStats; onLogout: () => void }) {
  const [period, setPeriod] = useState<Period>("all");
  const conv = stats.conversations[period];
  const topPosts = [...stats.blog.posts].sort((a, b) => b.views - a.views).slice(0, 8);

  return (
    <div className="min-h-screen bg-bg px-4 sm:px-6 py-8">
      <div className="mx-auto max-w-5xl space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🥑</span>
            <div>
              <h1 className="text-lg font-bold text-fg">Avocado Analytics</h1>
              <p className="text-[11px] text-fg-faint">Internal dashboard — not public</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="text-xs text-fg-faint hover:text-fg-muted border border-border rounded-lg px-3 py-1.5 transition-colors"
          >
            Sign out
          </button>
        </div>

        {/* Period tabs */}
        <div className="flex items-center gap-1 bg-surface-raised rounded-xl p-1 w-fit border border-border">
          {(["week", "month", "all"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                period === p ? "bg-fg text-bg shadow-sm" : "text-fg-muted hover:text-fg"
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        {/* Top stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Conversations"
            value={conv.total_responses}
            sub={period === "all" ? "total" : `in the last ${period === "week" ? "7" : "30"} days`}
            color="indigo"
          />
          <StatCard
            label="Unique Visitors"
            value={conv.unique_visitors}
            sub={`${conv.total_responses > 0 ? Math.round((conv.total_responses / Math.max(conv.unique_visitors, 1) * 10) / 10) : 0} avg msgs/visitor`}
          />
          <StatCard
            label="Satisfaction"
            value={stats.feedback.total > 0 ? `${stats.feedback.satisfaction_pct}%` : "—"}
            sub={`from ${stats.feedback.total} rated responses`}
            color={stats.feedback.satisfaction_pct >= 70 ? "emerald" : stats.feedback.satisfaction_pct > 0 ? "rose" : "default"}
          />
          <StatCard
            label="Blog Views"
            value={stats.blog.total_views}
            sub={`${fmt(stats.blog.total_claps)} claps across ${stats.blog.posts.length} posts`}
          />
        </div>

        {/* Questions + Feedback */}
        <div className="grid lg:grid-cols-2 gap-6">

          {/* Top questions */}
          <div className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-fg-faint mb-4">Top Questions</h2>
            {stats.top_questions.length === 0 ? (
              <p className="text-sm text-fg-faint">No questions logged yet.</p>
            ) : (
              <ol className="space-y-2">
                {stats.top_questions.map((q, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-[10px] font-mono text-fg-faint mt-0.5 w-4 shrink-0">{i + 1}.</span>
                    <span className="text-xs text-fg-muted leading-relaxed flex-1 min-w-0 truncate" title={q.text}>
                      {q.text}
                    </span>
                    <span className="text-[10px] font-semibold tabular-nums bg-surface-raised border border-border rounded-full px-2 py-0.5 text-fg-muted shrink-0">
                      {q.count}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* Feedback breakdown */}
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-fg-faint">Response Feedback</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-surface-raised border border-border p-3 text-center">
                <p className="text-2xl font-bold text-fg">{stats.feedback.total}</p>
                <p className="text-[10px] text-fg-faint mt-0.5">Total rated</p>
              </div>
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3 text-center">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.feedback.positive}</p>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-500 mt-0.5">👍 Positive</p>
              </div>
              <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-3 text-center">
                <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{stats.feedback.negative}</p>
                <p className="text-[10px] text-rose-700 dark:text-rose-500 mt-0.5">👎 Negative</p>
              </div>
            </div>
            <SatisfactionBar positive={stats.feedback.positive} negative={stats.feedback.negative} />

            {/* All-time conversation comparison */}
            <div className="pt-3 border-t border-border space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-fg-faint">Conversations by period</p>
              {(["week", "month", "all"] as Period[]).map((p) => {
                const c = stats.conversations[p];
                const maxVal = stats.conversations.all.total_responses || 1;
                return (
                  <div key={p} className="flex items-center gap-3">
                    <span className="text-[10px] text-fg-faint w-16 shrink-0">{PERIOD_LABELS[p]}</span>
                    <div className="flex-1 h-1.5 bg-surface-raised rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full"
                        style={{ width: `${Math.round((c.total_responses / maxVal) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold tabular-nums text-fg-muted w-8 text-right shrink-0">
                      {fmt(c.total_responses)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Blog table */}
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-fg-faint">Blog Performance</h2>
            <div className="flex items-center gap-4 text-[11px] text-fg-faint">
              <span><strong className="text-fg-muted">{fmt(stats.blog.total_views)}</strong> total views</span>
              <span><strong className="text-fg-muted">{fmt(stats.blog.total_claps)}</strong> total claps</span>
            </div>
          </div>
          {topPosts.length === 0 ? (
            <p className="px-5 py-6 text-sm text-fg-faint">No blog data yet.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-2.5 text-fg-faint font-semibold uppercase tracking-wider text-[10px]">Post</th>
                  <th className="text-right px-5 py-2.5 text-fg-faint font-semibold uppercase tracking-wider text-[10px]">Views</th>
                  <th className="text-right px-5 py-2.5 text-fg-faint font-semibold uppercase tracking-wider text-[10px]">Claps</th>
                </tr>
              </thead>
              <tbody>
                {topPosts.map((p, i) => (
                  <tr key={p.slug} className={i < topPosts.length - 1 ? "border-b border-border" : ""}>
                    <td className="px-5 py-3 text-fg-muted font-medium max-w-xs">
                      <a
                        href={`/blog/${p.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-accent transition-colors truncate block"
                      >
                        {p.slug}
                      </a>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-fg-muted font-semibold">{fmt(p.views)}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-fg-muted">{fmt(p.claps)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p className="text-center text-[10px] text-fg-faint pb-4">
          Avocado Admin · {new Date().getFullYear()} · Data from analytics.db on Lightsail
        </p>

      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState("");

  // Restore token from localStorage after hydration
  useEffect(() => {
    const saved = localStorage.getItem("avocado_admin_token");
    if (saved) setToken(saved);
  }, []);

  // Fetch stats whenever token is set
  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE_URL}/stats/admin`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (!res.ok) { setToken(null); localStorage.removeItem("avocado_admin_token"); return; }
        setStats(await res.json());
      })
      .catch(() => setError("Failed to load stats — is the backend reachable?"));
  }, [token]);

  function handleAuth(t: string) {
    localStorage.setItem("avocado_admin_token", t);
    setToken(t);
  }

  function handleLogout() {
    localStorage.removeItem("avocado_admin_token");
    setToken(null);
    setStats(null);
  }

  if (!token) return <LoginForm onAuth={handleAuth} />;

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm text-rose-600">{error}</p>
    </div>
  );

  if (!stats) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm text-fg-faint animate-pulse">Loading stats…</p>
    </div>
  );

  return <Dashboard stats={stats} onLogout={handleLogout} />;
}

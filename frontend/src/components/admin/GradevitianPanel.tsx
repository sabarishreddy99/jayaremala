"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api/client";
import { StatCard, fmt } from "@/components/admin/StatCard";

interface GvMetrics {
  users: {
    total: number; new_7d: number; new_30d: number;
    recent: { name: string; username: string; email: string; created_at: string }[];
  };
  saved_calcs: { total: number; by_type: { calc_type: string; count: number }[] };
  comments: { approved: number; pending: number; rejected: number; total: number };
  engagement: {
    page_loads: number; visits: number; active_streaks: number;
    longest_streak: number; badges_total: number;
    badges_by_type: { badge: string; count: number }[];
  };
}

function BreakdownList({ title, rows }: { title: string; rows: { label: string; count: number }[] }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-fg-subtle mb-3">{title}</p>
      {rows.length === 0 ? (
        <p className="text-xs text-fg-faint">No data yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {rows.map((r) => (
            <li key={r.label} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-fg-muted truncate">{r.label}</span>
              <span className="font-semibold tabular-nums text-fg">{fmt(r.count)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function GradevitianPanel() {
  const [metrics, setMetrics] = useState<GvMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("avocado_admin_token") ?? "" : "";
        const res = await fetch(`${API_BASE_URL}/gv/admin/metrics`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        setMetrics(await res.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load gradeVITian metrics");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p className="text-sm text-fg-faint">Loading gradeVITian metrics…</p>;
  if (error) return <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>;
  if (!metrics) return null;

  const { users, saved_calcs, comments, engagement } = metrics;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Total users" value={users.total} color="indigo" />
        <StatCard label="New · 7d" value={users.new_7d} sub="signups, last 7 days" />
        <StatCard label="New · 30d" value={users.new_30d} sub="signups, last 30 days" />
        <StatCard label="Saved calcs" value={saved_calcs.total} />
        <StatCard label="Visits" value={engagement.visits} sub="unique browser sessions" />
        <StatCard label="Page loads" value={engagement.page_loads} sub="every load / reload" />
        <StatCard label="Active streaks" value={engagement.active_streaks} sub={`longest: ${engagement.longest_streak} days`} color="emerald" />
        <StatCard label="Badges awarded" value={engagement.badges_total} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <BreakdownList
          title="Saved calcs by type"
          rows={saved_calcs.by_type.map((r) => ({ label: r.calc_type, count: r.count }))}
        />
        <BreakdownList
          title="Comments by status"
          rows={[
            { label: "Approved", count: comments.approved },
            { label: "Pending", count: comments.pending },
            { label: "Rejected", count: comments.rejected },
          ]}
        />
        <BreakdownList
          title="Badges by type"
          rows={engagement.badges_by_type.map((r) => ({ label: r.badge, count: r.count }))}
        />
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-fg-subtle px-4 sm:px-5 pt-4 pb-2">
          Recent signups
        </p>
        {users.recent.length === 0 ? (
          <p className="text-xs text-fg-faint px-4 sm:px-5 pb-4">No signups yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-fg-faint border-b border-border">
                  <th className="text-left font-semibold px-4 sm:px-5 py-2">Name</th>
                  <th className="text-left font-semibold px-4 py-2">Username</th>
                  <th className="text-left font-semibold px-4 py-2">Email</th>
                  <th className="text-left font-semibold px-4 sm:px-5 py-2">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.recent.map((u) => (
                  <tr key={u.username} className="border-b border-border/50 last:border-0">
                    <td className="px-4 sm:px-5 py-2 text-fg">{u.name}</td>
                    <td className="px-4 py-2 text-fg-muted">@{u.username}</td>
                    <td className="px-4 py-2 text-fg-muted truncate max-w-[200px]">{u.email}</td>
                    <td className="px-4 sm:px-5 py-2 text-fg-faint tabular-nums whitespace-nowrap">
                      {u.created_at?.slice(0, 10)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

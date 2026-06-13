"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api/client";

interface SystemData {
  latency: { count: number; p50: number; p95: number; p99: number; avg: number };
  stages: { stage: string; avg_ms: number; count: number }[];
  models: { model: string; count: number; avg_ms: number }[];
  fallback_rate_pct: number;
  primary_model: string;
  model_chain: string[];
  volume: { date: string; count: number }[];
  totals: { total_responses: number; unique_visitors: number; sessions: number };
  kb_docs: number;
  health: { status: string; api: string; analytics_db: string; rag: string };
  retrieval: { embed_model: string; embed_dim: number; method: string };
}

const STAGE_LABEL: Record<string, string> = {
  retrieve: "Hybrid retrieval",
  rrf: "Rank fusion",
  rerank: "Re-rank",
  graph: "Graph expansion",
  llm: "LLM generation",
};

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-faint">{label}</p>
      <p className="mt-1.5 font-mono text-2xl font-semibold tabular-nums text-fg">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-fg-faint">{sub}</p>}
    </div>
  );
}

export default function SystemDashboard() {
  const [data, setData] = useState<SystemData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/stats/system`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <p className="text-sm text-fg-faint">
        The live system is warming up or unreachable. This dashboard reads real-time metrics from the
        Railway backend — refresh in a moment.
      </p>
    );
  }
  if (!data) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-surface-raised animate-pulse" />
        ))}
      </div>
    );
  }

  const healthy = data.health.status === "ok";
  const maxStage = Math.max(...data.stages.map((s) => s.avg_ms), 1);
  const maxVol = Math.max(...data.volume.map((v) => v.count), 1);
  const totalModel = data.models.reduce((s, m) => s + m.count, 0) || 1;

  return (
    <div className="space-y-8">
      {/* Health + retrieval method */}
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium ${
            healthy
              ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
              : "border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${healthy ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
          {healthy ? "All systems operational" : "Degraded"}
        </span>
        <span className="text-[11px] text-fg-faint font-mono">
          {data.retrieval.embed_model} · {data.retrieval.embed_dim}d
        </span>
      </div>

      {/* Latency percentiles */}
      <section>
        <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-fg-faint mb-3">
          End-to-end latency
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="P50" value={`${data.latency.p50}ms`} sub="median" />
          <Stat label="P95" value={`${data.latency.p95}ms`} />
          <Stat label="P99" value={`${data.latency.p99}ms`} sub="tail" />
          <Stat label="Avg" value={`${data.latency.avg}ms`} sub={`${data.latency.count} responses`} />
        </div>
      </section>

      {/* Pipeline stage breakdown */}
      {data.stages.length > 0 && (
        <section>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-fg-faint mb-1">
            RAG pipeline — average stage latency
          </h2>
          <p className="text-[11px] text-fg-faint mb-3">{data.retrieval.method}</p>
          <div className="rounded-xl border border-border bg-surface p-4 space-y-2.5">
            {data.stages.map((s) => (
              <div key={s.stage}>
                <div className="flex items-baseline justify-between">
                  <span className="text-[12px] text-fg-muted">{STAGE_LABEL[s.stage] ?? s.stage}</span>
                  <span className="font-mono tabular-nums text-[11px] text-fg-faint">{s.avg_ms}ms</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-surface-raised overflow-hidden">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(3, (s.avg_ms / maxStage) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Model mix + fallback */}
        <section>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-fg-faint mb-3">
            Model mix · {data.fallback_rate_pct}% fallback
          </h2>
          <div className="rounded-xl border border-border bg-surface p-4 space-y-2.5">
            {data.models.length === 0 && <p className="text-[12px] text-fg-faint">No responses yet.</p>}
            {data.models.map((m) => (
              <div key={m.model}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-mono text-[11px] text-fg-muted truncate">{m.model}</span>
                  <span className="font-mono tabular-nums text-[10px] text-fg-faint shrink-0">
                    {m.count} · {m.avg_ms}ms
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-surface-raised overflow-hidden">
                  <div
                    className={`h-full rounded-full ${m.model === data.primary_model ? "bg-accent" : "bg-amber-400"}`}
                    style={{ width: `${Math.max(3, (m.count / totalModel) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
            <p className="pt-1 text-[10px] text-fg-faint">
              Fallback chain: <span className="font-mono">{data.model_chain.join(" → ")}</span>
            </p>
          </div>
        </section>

        {/* Volume sparkline */}
        <section>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-fg-faint mb-3">
            Chat volume · 30 days
          </h2>
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-end gap-[3px] h-24">
              {data.volume.map((v) => (
                <div
                  key={v.date}
                  title={`${v.date}: ${v.count}`}
                  className="flex-1 rounded-sm bg-accent/70 hover:bg-accent transition-colors"
                  style={{ height: `${Math.max(4, (v.count / maxVol) * 100)}%` }}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-fg-faint">
              <span>30d ago</span><span>today</span>
            </div>
          </div>
        </section>
      </div>

      {/* Totals */}
      <section>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Responses" value={String(data.totals.total_responses)} />
          <Stat label="Unique visitors" value={String(data.totals.unique_visitors)} />
          <Stat label="Sessions" value={String(data.totals.sessions)} />
          <Stat label="KB documents" value={String(data.kb_docs)} sub="embedded chunks" />
        </div>
      </section>
    </div>
  );
}

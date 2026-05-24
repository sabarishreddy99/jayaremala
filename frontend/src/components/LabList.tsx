"use client";

import Link from "next/link";
import { useState } from "react";
import type { LabMeta, LabStatus } from "@/lib/lab";

const STATUS_STYLES: Record<LabStatus, { dot: string; text: string; bg: string; label: string }> = {
  active:  { dot: "bg-emerald-400 animate-pulse", text: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800", label: "Active" },
  shipped: { dot: "bg-indigo-400",                text: "text-indigo-700 dark:text-indigo-400",   bg: "bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800",   label: "Shipped" },
  paused:  { dot: "bg-amber-400",                 text: "text-amber-700 dark:text-amber-400",     bg: "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800",     label: "Paused" },
};

const ALL_STATUSES: LabStatus[] = ["active", "shipped", "paused"];

export default function LabList({ entries }: { entries: LabMeta[] }) {
  const [activeStatus, setActiveStatus] = useState<LabStatus | null>(null);

  const availableStatuses = ALL_STATUSES.filter((s) => entries.some((e) => e.status === s));
  const filtered = activeStatus ? entries.filter((e) => e.status === activeStatus) : entries;

  return (
    <div>
      {availableStatuses.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveStatus(null)}
            className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
              !activeStatus
                ? "bg-fg text-bg"
                : "border border-border bg-surface text-fg-muted hover:border-fg-muted hover:text-fg"
            }`}
          >
            All
          </button>
          {availableStatuses.map((status) => {
            const s = STATUS_STYLES[status];
            return (
              <button
                key={status}
                onClick={() => setActiveStatus(activeStatus === status ? null : status)}
                className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors inline-flex items-center gap-1.5 ${
                  activeStatus === status
                    ? "bg-fg text-bg border border-fg"
                    : "border border-border bg-surface text-fg-muted hover:border-fg-muted hover:text-fg"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${activeStatus === status ? "bg-bg" : s.dot}`} />
                {s.label}
              </button>
            );
          })}
        </div>
      )}

      <ol className="space-y-4">
        {filtered.map((entry) => {
          const s = STATUS_STYLES[entry.status];
          return (
            <li key={entry.slug}>
              <Link
                href={`/lab/${entry.slug}`}
                className="group block rounded-2xl border border-border bg-surface p-5 sm:p-6 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <h2 className="text-base font-bold text-fg group-hover:text-accent transition-colors leading-snug truncate">
                      {entry.title}
                    </h2>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold ${s.bg} ${s.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                      {s.label}
                    </span>
                    <span className="text-[10px] text-fg-faint">updated {entry.updatedAt}</span>
                  </div>
                </div>

                <p className="text-sm text-fg-subtle leading-relaxed mb-3">{entry.description}</p>

                <div className="flex flex-wrap gap-1.5">
                  {entry.tech.map((t) => (
                    <span key={t} className="rounded-md bg-surface-raised px-2 py-0.5 text-[10px] font-mono font-medium text-fg-subtle border border-border">
                      {t}
                    </span>
                  ))}
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

"use client";

import NoteTile from "@/components/portfolio/NoteTile";
import { useState, useEffect, useRef } from "react";
import type { LabMeta, LabStatus } from "@/lib/content/lab";

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.06 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`flex flex-1 transition-[opacity,transform] duration-500 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      {children}
    </div>
  );
}

const STATUS_STYLES: Record<LabStatus, {
  dot: string;
  text: string;
  bg: string;
  label: string;
  pillActive: string;
  leftBorder: string;
  sweep: string;
}> = {
  active: {
    dot: "bg-accent animate-pulse",
    text: "text-accent",
    bg: "bg-accent-light border-accent/30",
    label: "Active",
    pillActive: "bg-accent text-accent-fg border-accent",
    leftBorder: "border-l border-l-accent",
    sweep: "accent",
  },
  shipped: {
    dot: "bg-fg",
    text: "text-fg-muted",
    bg: "bg-surface-raised border-border-strong",
    label: "Shipped",
    pillActive: "bg-accent text-accent-fg border-accent",
    leftBorder: "border-l border-l-border-strong",
    sweep: "accent",
  },
  paused: {
    dot: "bg-fg-faint",
    text: "text-fg-subtle",
    bg: "bg-surface border-border",
    label: "Paused",
    pillActive: "bg-fg-subtle text-bg border-fg-subtle",
    leftBorder: "border-l border-l-border",
    sweep: "accent",
  },
};

const ALL_STATUSES: LabStatus[] = ["active", "shipped", "paused"];

function formatMonth(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(parts[1]) - 1]} ${parts[0]}`;
}

export default function LabList({ entries }: { entries: LabMeta[] }) {
  const [activeStatus, setActiveStatus] = useState<LabStatus | null>(null);

  const availableStatuses = ALL_STATUSES.filter((s) => entries.some((e) => e.status === s));
  const filtered = activeStatus ? entries.filter((e) => e.status === activeStatus) : entries;

  return (
    <div>
      {/* Filter pills */}
      {availableStatuses.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveStatus(null)}
            className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-sm px-3.5 py-1.5 border transition-all duration-150 ${
              !activeStatus
                ? "bg-accent text-accent-fg border-accent shadow-sm"
                : "bg-surface border-border text-fg-faint hover:text-fg"
            }`}
          >
            All
            <span className={`text-[10px] font-semibold rounded-sm px-1.5 py-0.5 ${
              !activeStatus ? "bg-bg/20 text-bg" : "bg-surface-raised text-fg-faint"
            }`}>{entries.length}</span>
          </button>

          {availableStatuses.map((status) => {
            const s = STATUS_STYLES[status];
            const isActive = activeStatus === status;
            const count = entries.filter((e) => e.status === status).length;
            return (
              <button
                key={status}
                onClick={() => setActiveStatus(activeStatus === status ? null : status)}
                className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-sm px-3.5 py-1.5 border transition-all duration-150 ${
                  isActive ? s.pillActive : "bg-surface border-border text-fg-faint hover:text-fg"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-white/80" : s.dot}`} />
                {s.label}
                <span className={`text-[10px] font-semibold rounded-sm px-1.5 py-0.5 ${
                  isActive ? "bg-white/20 text-white" : "bg-surface-raised text-fg-faint"
                }`}>{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Cards — the same tilted notes as the blog and the home pile */}
      <ol className="note-desk grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-x-7 sm:gap-y-10 lg:grid-cols-3">
        {filtered.map((entry, i) => {
          const s = STATUS_STYLES[entry.status];
          return (
            <li key={entry.slug} className="flex">
              <Reveal delay={Math.min(i * 70, 350)}>
                <NoteTile
                  href={`/lab/${entry.slug}`}
                  index={i}
                  tags={entry.tech}
                  title={entry.title}
                  description={entry.description}
                  eyebrow={<>Lab{entry.startedAt ? <> · {formatMonth(entry.startedAt)} → {formatMonth(entry.updatedAt)}</> : null}</>}
                  badge={
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-bg/85 px-2.5 py-0.5 font-mono text-[0.6875rem] text-fg-muted backdrop-blur-sm">
                      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                      {s.label}
                    </span>
                  }
                  footer={
                    <span className="min-w-0 truncate font-mono text-[0.6875rem] opacity-70">
                      {entry.tech.slice(0, 3).join(" · ")}
                    </span>
                  }
                />
              </Reveal>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

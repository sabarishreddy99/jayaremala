"use client";

import { useState } from "react";

interface SourceLink { label: string; url: string; }
interface Props {
  title: string;
  description: string;
  tags: string[];
  award?: string;
  note?: string;
  sourceLinks?: SourceLink[];
}

// ── Pipeline step definitions ─────────────────────────────────────────────────

type NormalStep = {
  type?: "normal";
  label: string;
  note: string;
  dot: string;       // bg color class for the dot
  badge?: string;
};

type SplitStep = {
  type: "split";
  left: { label: string; note: string };
  right: { label: string; note: string };
  dot: string;
};

type Step = NormalStep | SplitStep;

const PIPELINE: Step[] = [
  { label: "User Query",       note: "Natural language input",             dot: "bg-indigo-500"  },
  { label: "HyDE Expansion",   note: "3 synthetic variants generated",     dot: "bg-violet-500", badge: "×3" },
  { type: "split",
    left:  { label: "Vector Search", note: "BGE-base · ONNX" },
    right: { label: "BM25 Lexical",  note: "Sparse retrieval"  },
    dot: "bg-blue-500" },
  { label: "RRF Fusion",       note: "Reciprocal Rank → top 20",           dot: "bg-sky-500"     },
  { label: "Graph Expansion",  note: "+2 related docs via entity links",   dot: "bg-teal-500"    },
  { label: "Gemini 2.5 Flash", note: "Context-injected generation",        dot: "bg-amber-500"   },
  { label: "Streamed Response",note: "Token-by-token via SSE",             dot: "bg-green-500"   },
];

// ── Sub-components ─────────────────────────────────────────────────────────────

function Dot({ cls }: { cls: string }) {
  return <span className={`mt-0.5 h-2 w-2 flex-shrink-0 rounded-full ${cls}`} />;
}

function NodeBox({ label, note, dot, badge, delay }: { label: string; note: string; dot: string; badge?: string; delay: number }) {
  return (
    <div
      className="animate-fade-up flex items-start gap-2.5 rounded-lg border border-border bg-surface-raised/60 px-3 py-2"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <Dot cls={dot} />
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold text-fg leading-snug">
          {label}
          {badge && <span className="rounded-full bg-border px-1.5 py-0.5 text-[9px] font-bold text-fg-faint">{badge}</span>}
        </p>
        <p className="mt-0.5 text-[10px] leading-snug text-fg-faint">{note}</p>
      </div>
    </div>
  );
}

function Connector({ delay }: { delay: number }) {
  return (
    <div
      className="animate-fade-up mx-[9px] flex flex-col items-center"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div className="relative h-5 w-px bg-border overflow-hidden">
        <div className="absolute top-0 h-3 w-px animate-[flow_1.4s_ease-in-out_infinite] bg-gradient-to-b from-transparent via-indigo-400 to-transparent" />
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function RagPipelineCard({ title, description, tags, award, note, sourceLinks }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex-1 rounded-2xl border border-border bg-surface p-5 space-y-3 hover:border-indigo-300 dark:hover:border-indigo-700 card-lift transition-all">

      {/* ── Standard card content ── */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-fg text-sm leading-snug">{title}</h3>
        {award && (
          <span className="text-[10px] font-semibold rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-2 py-0.5 whitespace-nowrap flex-shrink-0">
            🏆 {award}
          </span>
        )}
      </div>

      <p className="text-xs leading-5 text-fg-subtle">{description}</p>

      <div className="flex flex-wrap gap-1.5">
        {tags.slice(0, 4).map((t) => (
          <span key={t} className="rounded-full bg-surface-raised px-2 py-0.5 text-[10px] font-medium text-fg-muted">
            {t}
          </span>
        ))}
      </div>

      {note && (
        <p className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-900 rounded-lg px-2.5 py-1.5 leading-relaxed">
          {note}
        </p>
      )}

      {sourceLinks && sourceLinks.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {sourceLinks.map((link) => (
            <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-accent-light border border-indigo-200 dark:border-indigo-800 px-2.5 py-0.5 text-[10px] font-semibold text-accent hover:opacity-80 transition-opacity">
              {link.label}
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
            </a>
          ))}
        </div>
      )}

      {/* ── Pipeline toggle ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 border-t border-border pt-3 text-[10px] font-semibold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
      >
        <svg
          width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6"/>
        </svg>
        {open ? "Hide pipeline" : "View RAG pipeline"}
      </button>

      {/* ── Pipeline diagram ── */}
      {open && (
        <div className="space-y-0.5">
          {PIPELINE.map((step, i) => {
            const baseDelay = i * 60;

            if (step.type === "split") {
              return (
                <div key={i}>
                  <Connector delay={baseDelay} />
                  <div
                    className="animate-fade-up grid grid-cols-2 gap-2"
                    style={{ animationDelay: `${baseDelay + 30}ms`, animationFillMode: "both" }}
                  >
                    <div className="flex items-start gap-2.5 rounded-lg border border-border bg-surface-raised/60 px-3 py-2">
                      <Dot cls={step.dot} />
                      <div>
                        <p className="text-[11px] font-semibold text-fg leading-snug">{step.left.label}</p>
                        <p className="mt-0.5 text-[10px] leading-snug text-fg-faint">{step.left.note}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5 rounded-lg border border-border bg-surface-raised/60 px-3 py-2">
                      <Dot cls={step.dot} />
                      <div>
                        <p className="text-[11px] font-semibold text-fg leading-snug">{step.right.label}</p>
                        <p className="mt-0.5 text-[10px] leading-snug text-fg-faint">{step.right.note}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={i}>
                {i > 0 && <Connector delay={baseDelay} />}
                <NodeBox label={step.label} note={step.note} dot={step.dot} badge={(step as NormalStep).badge} delay={baseDelay + 30} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

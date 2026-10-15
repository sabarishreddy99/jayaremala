"use client";

import { useState } from "react";
import { fmt } from "./StatCard";

type View = "write-blog" | "write-lab" | "blog-api" | "lab" | "now" | "profile" | "sync" | "analytics" | "integrations";

interface Draft { id: string; title: string; savedAt: string }

const FACES = ["skin", "paper", "flesh"] as const;
const TILTS = [-1.6, 1.2, -0.8, 1.4, -1.1, 0.8];

/** The six things the desk is mostly opened for, in the order they happen. */
const TASKS: { view: View; title: string; line: string; route: "GitHub" | "Live" }[] = [
  { view: "write-blog", title: "Write a blog post", line: "Long-form MDX with templates, preview and drafts.", route: "GitHub" },
  { view: "write-lab", title: "Log a lab update", line: "Note what you built, what broke and what you decided.", route: "GitHub" },
  { view: "blog-api", title: "Fix a live post", line: "Typos and quick edits on posts already published.", route: "Live" },
  { view: "now", title: "Update the Now page", line: "One short paragraph on what you are doing this month.", route: "GitHub" },
  { view: "profile", title: "Edit your profile", line: "Bio, links, résumé and the page intros.", route: "GitHub" },
  { view: "sync", title: "Check Avocado is current", line: "See whether the chatbot knows what the site says.", route: "Live" },
];

function readDrafts(key: string): Draft[] {
  try {
    const raw = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(raw) ? raw.filter((d) => d && d.id) : [];
  } catch {
    return [];
  }
}

function ago(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return "";
  const m = Math.round(ms / 60000);
  if (m < 60) return `${Math.max(m, 1)}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

/**
 * The admin's front page: the publishing desk.
 *
 * Built from the same printed Avocado-face cards as the chat prompt deck, so
 * the private side of the site feels like the public one. Each task says how
 * it publishes — "GitHub" (staged, then one commit and a rebuild) or "Live"
 * (saved straight to the content API) — because that difference is the one
 * thing that is easy to get wrong here.
 */
export default function DeskHome({
  onOpen,
  hasPat,
  numbers,
}: {
  onOpen: (view: View) => void;
  hasPat: boolean;
  numbers: { label: string; value: number }[];
}) {
  // The desk renders only after sign-in, on the client, so localStorage is safe here.
  const [drafts] = useState(() => [
    ...readDrafts("avocado_blog_drafts").map((d) => ({ ...d, kind: "Blog" as const, view: "write-blog" as const })),
    ...readDrafts("avocado_lab_drafts").map((d) => ({ ...d, kind: "Lab" as const, view: "write-lab" as const })),
  ].sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1)).slice(0, 4));

  return (
    <div className="space-y-10">
      {/* ── Setup nudge ── */}
      {!hasPat && (
        <div className="flex flex-col gap-3 rounded-card border border-border bg-accent-light p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <p className="text-sm font-semibold text-fg">Connect GitHub once to publish</p>
            <p className="mt-1 text-[0.8125rem] leading-relaxed text-fg-muted">
              Blog, lab and site-content editors save through a GitHub token. Live edits work without it.
            </p>
          </div>
          <button type="button" onClick={() => onOpen("profile")}
            className="btn-avo inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-medium">
            Add a token
          </button>
        </div>
      )}

      {/* ── The deck ── */}
      <section aria-labelledby="desk-tasks">
        <div className="mb-5 flex items-baseline justify-between gap-4">
          <h2 id="desk-tasks" className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-fg-subtle">What are you here to do?</h2>
          <span className="hidden font-mono text-[0.6875rem] text-fg-faint sm:inline">⌘K finds any section</span>
        </div>
        <ul className="grid gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
          {TASKS.map((t, i) => (
            <li key={t.view}>
              <button
                type="button"
                onClick={() => onOpen(t.view)}
                data-face={FACES[i % FACES.length]}
                style={{ "--tilt": `${TILTS[i % TILTS.length]}deg` } as React.CSSProperties}
                className="prompt-card group flex h-full min-h-[9.5rem] w-full flex-col justify-between rounded-card p-5 text-left sm:p-6"
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] opacity-70">{String(i + 1).padStart(2, "0")}</span>
                  <span className="rounded-full border border-current/25 px-2 py-0.5 font-mono text-[0.625rem] uppercase tracking-[0.14em] opacity-80">
                    {t.route}
                  </span>
                </span>
                <span className="mt-5 block">
                  <span className="flex items-end justify-between gap-3">
                    <span className="display-serif text-[1.5rem] leading-tight">{t.title}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden
                      className="mb-1 shrink-0 opacity-60 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100">
                      <path d="M7 17 17 7M7 7h10v10" />
                    </svg>
                  </span>
                  <span className="mt-1.5 block text-[0.8125rem] leading-relaxed opacity-80">{t.line}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-10">
        {/* ── Drafts ── */}
        <section aria-labelledby="desk-drafts">
          <h2 id="desk-drafts" className="mb-4 font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-fg-subtle">Pick up a draft</h2>
          {drafts.length > 0 ? (
            <ul className="border-t border-border-strong">
              {drafts.map((d) => (
                <li key={`${d.kind}-${d.id}`} className="border-b border-border-subtle">
                  <button type="button" onClick={() => onOpen(d.view)} className="group flex w-full items-baseline gap-4 py-3.5 text-left">
                    <span className="w-10 shrink-0 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-subtle">{d.kind}</span>
                    <span className="display-serif min-w-0 flex-1 truncate text-[1.125rem] text-fg-muted transition-colors group-hover:text-fg">
                      {d.title || "Untitled draft"}
                    </span>
                    <span className="shrink-0 font-mono text-[0.6875rem] text-fg-faint">{ago(d.savedAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-card border border-dashed border-border px-5 py-6 text-[0.8125rem] leading-relaxed text-fg-subtle">
              No drafts on this device. Drafts save in the browser as you write, so they show up here to finish later.
            </p>
          )}
        </section>

        {/* ── How publishing works ── */}
        <section aria-labelledby="desk-how" className="rounded-card border border-border bg-surface p-5 sm:p-6">
          <h2 id="desk-how" className="mb-4 font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-fg-subtle">Two ways things go live</h2>
          <dl className="space-y-4 text-[0.8125rem] leading-relaxed">
            <div className="flex gap-3">
              <dt className="w-14 shrink-0"><span className="rounded-full bg-accent px-2 py-0.5 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-accent-fg">GitHub</span></dt>
              <dd className="text-fg-muted">Changes are <strong className="font-semibold text-fg">staged</strong>. &ldquo;Publish all&rdquo; at the bottom commits everything at once and the site rebuilds in a few minutes.</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-14 shrink-0"><span className="rounded-full border border-border-strong px-2 py-0.5 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-fg">Live</span></dt>
              <dd className="text-fg-muted">Saved straight to the content API. Visitors and Avocado see it right away, no rebuild.</dd>
            </div>
          </dl>
          {numbers.length > 0 && (
            <button type="button" onClick={() => onOpen("analytics")}
              className="group mt-6 grid w-full grid-cols-3 gap-px overflow-hidden rounded-xl border border-border bg-border text-left">
              {numbers.map((n) => (
                <span key={n.label} className="bg-surface px-3 py-3 transition-colors group-hover:bg-surface-raised">
                  <span className="block font-mono text-[1.25rem] tabular-nums text-fg">{fmt(n.value)}</span>
                  <span className="mt-0.5 block text-[0.6875rem] text-fg-subtle">{n.label}</span>
                </span>
              ))}
            </button>
          )}
        </section>
      </div>
    </div>
  );
}

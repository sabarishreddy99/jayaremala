"use client";

/** Shared design primitives used by every admin editor */

import { useState } from "react";

// Avocado's index is kept current by the backend: content-API saves re-ingest
// on the server, GitHub edits re-ingest on deploy. Editors do not trigger it.

// ── Base class strings (re-usable in editors that build inputs directly) ──────

export const inputCls =
  "w-full rounded-xl border border-border bg-bg px-3.5 py-3 text-sm text-fg shadow-[inset_0_1px_0_rgb(0_0_0/0.02)] " +
  "placeholder:text-fg-faint hover:border-border-strong focus:outline-none focus:border-accent " +
  "focus:ring-2 focus:ring-accent/15 transition-[border-color,box-shadow,background-color] disabled:cursor-not-allowed disabled:bg-surface-raised disabled:opacity-50";

export const selectCls =
  "w-full rounded-xl border border-border bg-bg px-3.5 py-3 text-sm text-fg " +
  "hover:border-border-strong focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 " +
  "transition-[border-color,box-shadow,background-color] disabled:cursor-not-allowed disabled:bg-surface-raised disabled:opacity-50";

// ── Section card wrapper ───────────────────────────────────────────────────────

export function AdminCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-card border border-border bg-surface p-5 sm:p-7 ${className}`}>
      {children}
    </section>
  );
}

// ── Section header inside a card ──────────────────────────────────────────────

export function SectionHeader({
  title,
  sub,
  actions,
}: {
  title: string;
  sub?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b border-border-subtle">
      <div>
        <h2 className="display-serif text-[1.5rem] leading-tight text-fg">{title}</h2>
        {sub && <p className="text-[0.8125rem] text-fg-subtle mt-1.5 leading-relaxed max-w-2xl">{sub}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}

// ── Field label ───────────────────────────────────────────────────────────────

export function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <p className="mb-2 flex items-center gap-1 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-fg-subtle">
      {children}
      {required && <span className="text-rose-500 normal-case tracking-normal font-normal">*</span>}
    </p>
  );
}

// ── Text input ────────────────────────────────────────────────────────────────

export function TextInput({
  value,
  onChange,
  placeholder = "",
  disabled = false,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={inputCls}
    />
  );
}

// ── Textarea ──────────────────────────────────────────────────────────────────

export function TextArea({
  value,
  onChange,
  placeholder = "",
  rows = 3,
  disabled = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}) {
  return (
    <textarea
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`${inputCls} resize-none`}
    />
  );
}

// ── Toggle pill ───────────────────────────────────────────────────────────────

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className={`inline-flex min-h-9 items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 transition-colors ${
        checked
          ? "bg-accent-light border-accent/50 text-fg"
          : "border-border text-fg-muted hover:border-fg-muted hover:bg-surface-raised"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full transition-colors ${
          checked ? "bg-accent" : "bg-fg-faint"
        }`}
      />
      {label}
    </button>
  );
}

// ── Result banner ─────────────────────────────────────────────────────────────

export function ResultBanner({
  result,
}: {
  result: { ok: boolean; message: string } | null;
}) {
  if (!result) return null;
  return (
    <div
      role={result.ok ? "status" : "alert"}
      className={`flex items-start gap-2.5 rounded-xl px-3.5 py-2.5 text-[0.8125rem] ${
        result.ok
          ? "bg-accent-light text-fg border border-accent/40"
          : "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
      }`}
    >
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="shrink-0 mt-0.5"
      >
        {result.ok ? (
          <path d="M20 6L9 17l-5-5" />
        ) : (
          <>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </>
        )}
      </svg>
      <span className="leading-relaxed">{result.message}</span>
    </div>
  );
}

// ── Dirty badge ───────────────────────────────────────────────────────────────

export function DirtyBadge({ dirty }: { dirty: boolean }) {
  if (!dirty) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--flesh)] px-2.5 py-1 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-[var(--skin-ink)]">
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--pit)]" />
      Unsaved
    </span>
  );
}

// ── GitHub PAT row ────────────────────────────────────────────────────────────
//
// The token is stored once (localStorage) and shared by every editor, so this
// row only asks for it when it is missing; with a token present it collapses
// to a single "Loaded from GitHub" line.

export function GithubPATRow({
  pat,
  patVisible,
  setPatVisible,
  updatePat,
  loading,
  onLoad,
  loaded,
}: {
  pat: string;
  patVisible: boolean;
  setPatVisible: (v: boolean) => void;
  updatePat: (v: string) => void;
  loading: boolean;
  onLoad: () => void;
  loaded: boolean;
}) {
  // Each editor loads its file on arrival when a token is saved, so this row
  // only has to ask for the token when it is missing.
  const [editing, setEditing] = useState(() => !pat);

  if (pat && !editing) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-full border border-border bg-surface px-4 py-2">
        <span className="inline-flex items-center gap-2 text-[0.8125rem] text-fg-muted">
          <span className={`size-2 rounded-full ${loaded ? "bg-accent" : loading ? "bg-[var(--flesh)] animate-pulse" : "bg-[var(--pit)]"}`} />
          {loading ? "Loading from GitHub…" : loaded ? "Loaded from GitHub. Edit below, then stage your changes." : "GitHub token saved."}
        </span>
        <span className="flex items-center gap-1">
          <button type="button" onClick={onLoad} disabled={loading}
            className="rounded-full px-3 py-1 text-xs font-medium text-fg-muted transition-colors hover:bg-surface-raised hover:text-fg disabled:opacity-40">
            {loaded ? "Reload" : "Load"}
          </button>
          <button type="button" onClick={() => setEditing(true)}
            className="rounded-full px-3 py-1 text-xs font-medium text-fg-muted transition-colors hover:bg-surface-raised hover:text-fg">
            Change token
          </button>
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-border bg-accent-light p-4 sm:p-5 space-y-3">
      <div>
        <p className="text-sm font-semibold text-fg">Connect GitHub to edit this</p>
        <p className="mt-1 text-[0.8125rem] leading-relaxed text-fg-muted">
          Paste a fine-grained token with <code className="rounded bg-bg px-1 font-mono text-[0.75rem]">contents:write</code> on the
          repo. It stays in this browser and is reused by every editor.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type={patVisible ? "text" : "password"}
          value={pat}
          onChange={(e) => updatePat(e.target.value)}
          placeholder="github_pat_… or ghp_…"
          aria-label="GitHub token"
          className={`${inputCls} min-w-0 flex-1 font-mono`}
        />
        <div className="flex gap-2">
          <button type="button" onClick={() => setPatVisible(!patVisible)}
            className="btn-avo-ghost shrink-0 rounded-full px-4 py-2 text-xs font-medium">
            {patVisible ? "Hide" : "Show"}
          </button>
          <button type="button"
            onClick={() => { onLoad(); setEditing(false); }}
            disabled={!pat.trim() || loading}
            className="btn-avo shrink-0 rounded-full px-5 py-2 text-xs font-semibold">
            {loading ? "Loading…" : "Connect & load"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Save row ──────────────────────────────────────────────────────────────────

export function SaveRow({
  onSave,
  saving,
  loaded,
  pat,
  dirty = true,
  label = "Stage changes",
}: {
  onSave: () => void;
  saving: boolean;
  loaded: boolean;
  pat: string;
  dirty?: boolean;
  label?: string;
}) {
  const disabled = !pat.trim() || !loaded || saving || !dirty;
  return (
    // Sticks to the bottom of the screen on long forms so saving is always one reach away.
    <div className="sticky bottom-0 z-20 -mx-1 flex flex-wrap items-center gap-3 border-t border-border bg-bg/90 px-1 py-4 backdrop-blur-md">
      <button
        onClick={onSave}
        disabled={disabled}
        className="btn-avo inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
      >
        {saving ? (
          <>
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="animate-spin"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            Staging…
          </>
        ) : (
          <>
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            {label}
          </>
        )}
      </button>

      {!loaded && pat.trim() && (
        <p className="text-[11px] text-fg-faint flex items-center gap-1">
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          Load the current file before editing
        </p>
      )}
      {dirty && loaded && pat.trim() && <DirtyBadge dirty={true} />}
    </div>
  );
}

// ── Move up/down buttons ──────────────────────────────────────────────────────

export function MoveButtons({
  idx,
  total,
  onMove,
}: {
  idx: number;
  total: number;
  onMove: (dir: -1 | 1) => void;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <button
        onClick={() => onMove(-1)}
        disabled={idx === 0}
        className="p-1.5 rounded-full text-fg-faint hover:text-fg hover:bg-surface-raised disabled:opacity-20 transition-all"
        title="Move up"
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M18 15l-6-6-6 6" />
        </svg>
      </button>
      <button
        onClick={() => onMove(1)}
        disabled={idx === total - 1}
        className="p-1.5 rounded-full text-fg-faint hover:text-fg hover:bg-surface-raised disabled:opacity-20 transition-all"
        title="Move down"
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
    </div>
  );
}

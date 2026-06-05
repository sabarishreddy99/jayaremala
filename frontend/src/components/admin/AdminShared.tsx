"use client";

/** Shared primitives used by every admin GitHub editor */

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold uppercase tracking-widest text-fg-faint mb-1">{children}</p>;
}

export function TextInput({
  value, onChange, placeholder = "", disabled = false, type = "text",
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean; type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:border-accent transition-colors disabled:opacity-40"
    />
  );
}

export function TextArea({
  value, onChange, placeholder = "", rows = 3, disabled = false,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; disabled?: boolean;
}) {
  return (
    <textarea
      rows={rows}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full resize-none rounded border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:border-accent transition-colors disabled:opacity-40"
    />
  );
}

export function Toggle({
  checked, onChange, label,
}: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`inline-flex items-center gap-2 rounded-sm px-3 py-1.5 text-xs font-medium border transition-colors ${
        checked
          ? "bg-indigo-500/10 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300"
          : "border-border text-fg-muted hover:border-fg-muted"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${checked ? "bg-indigo-500" : "bg-fg-faint"}`} />
      {label}
    </button>
  );
}

export function ResultBanner({ result }: { result: { ok: boolean; message: string } | null }) {
  if (!result) return null;
  return (
    <p className={`text-xs rounded px-3 py-2 ${
      result.ok
        ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
        : "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
    }`}>
      {result.message}
    </p>
  );
}

export function DirtyBadge({ dirty }: { dirty: boolean }) {
  if (!dirty) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-sm bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
      <span className="w-1 h-1 rounded-full bg-amber-400 inline-block" />
      Unsaved changes
    </span>
  );
}

export function GithubPATRow({
  pat, patVisible, setPatVisible, updatePat, loading, onLoad, loaded,
}: {
  pat: string; patVisible: boolean; setPatVisible: (v: boolean) => void;
  updatePat: (v: string) => void; loading: boolean; onLoad: () => void; loaded: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <FieldLabel>GitHub Token</FieldLabel>
      <div className="flex gap-2">
        <input
          type={patVisible ? "text" : "password"}
          value={pat}
          onChange={e => updatePat(e.target.value)}
          placeholder="ghp_…"
          className="flex-1 rounded border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:border-accent transition-colors"
        />
        <button onClick={() => setPatVisible(!patVisible)}
          className="px-3 py-2 rounded border border-border text-xs text-fg-muted hover:text-fg transition-colors">
          {patVisible ? "Hide" : "Show"}
        </button>
        <button onClick={onLoad} disabled={!pat.trim() || loading}
          className="px-3 py-2 rounded border border-border text-xs text-fg-muted hover:text-fg transition-colors disabled:opacity-40">
          {loading ? "Loading…" : "Load"}
        </button>
      </div>
      <p className="text-[10px] text-fg-faint">Shared with all editors — needs repo write access.</p>
      {loaded && <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">✓ Loaded from GitHub</p>}
    </div>
  );
}

export function SaveRow({
  onSave, saving, loaded, pat, dirty = true, label = "Save & Deploy",
}: {
  onSave: () => void; saving: boolean; loaded: boolean; pat: string; dirty?: boolean; label?: string;
}) {
  return (
    <div className="flex items-center gap-3 flex-wrap pt-2">
      <button
        onClick={onSave}
        disabled={!pat.trim() || !loaded || saving || !dirty}
        className="rounded bg-fg text-bg px-5 py-2 text-sm font-semibold hover:opacity-80 transition-opacity disabled:opacity-40"
      >
        {saving ? "Saving…" : label}
      </button>
      {!loaded && pat.trim() && <p className="text-[11px] text-fg-faint">Click Load first.</p>}
    </div>
  );
}

export function MoveButtons({
  idx, total, onMove,
}: { idx: number; total: number; onMove: (dir: -1 | 1) => void }) {
  return (
    <div className="flex gap-0.5">
      <button onClick={() => onMove(-1)} disabled={idx === 0}
        className="p-1 rounded text-fg-faint hover:text-fg disabled:opacity-30 transition-colors" title="Move up">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 15l-6-6-6 6"/></svg>
      </button>
      <button onClick={() => onMove(1)} disabled={idx === total - 1}
        className="p-1 rounded text-fg-faint hover:text-fg disabled:opacity-30 transition-colors" title="Move down">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
      </button>
    </div>
  );
}

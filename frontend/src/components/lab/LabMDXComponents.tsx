import type { MDXComponents } from "mdx/types";

/* ── Status badge ──────────────────────────────────────────────────── */
const STATUS_STYLES = {
  active:  { dot: "bg-emerald-400", text: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", label: "Active" },
  shipped: { dot: "bg-indigo-400",  text: "text-indigo-700",  bg: "bg-indigo-50 border-indigo-200",   label: "Shipped" },
  paused:  { dot: "bg-amber-400",   text: "text-amber-700",   bg: "bg-amber-50 border-amber-200",     label: "Paused" },
};

export function Status({ status }: { status: "active" | "shipped" | "paused" }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.active;
  return (
    <span className={`not-prose inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${status === "active" ? "animate-pulse" : ""}`} />
      {s.label}
    </span>
  );
}

/* ── Architecture block (used via ```arch fenced code blocks) ──────── */
function ArchBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="not-prose my-6 rounded-xl border border-zinc-200 bg-zinc-950 overflow-x-auto">
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-zinc-800">
        <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
        <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
        <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
        <span className="ml-2 text-[10px] text-zinc-500 font-mono uppercase tracking-widest">architecture</span>
      </div>
      <pre className="px-5 py-4 text-[11px] sm:text-xs text-zinc-300 font-mono leading-relaxed whitespace-pre overflow-x-auto">
        {children}
      </pre>
    </div>
  );
}

/* ── Decision log entry ────────────────────────────────────────────── */
export function Decision({ date, title, children }: { date: string; title: string; children: React.ReactNode }) {
  return (
    <div className="not-prose my-4 flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1 shrink-0" />
        <div className="w-px flex-1 bg-zinc-200 mt-1" />
      </div>
      <div className="pb-6 flex-1 min-w-0">
        <div className="flex flex-wrap items-baseline gap-2 mb-1.5">
          <span className="text-[10px] font-mono text-zinc-400">{date}</span>
          <span className="text-sm font-semibold text-zinc-900">{title}</span>
        </div>
        <div className="text-sm text-zinc-600 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

/* ── Progress update ───────────────────────────────────────────────── */
export function Update({ date, children }: { date: string; children: React.ReactNode }) {
  return (
    <div className="not-prose my-3 flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-2 h-2 rounded-full bg-zinc-300 mt-1 shrink-0" />
        <div className="w-px flex-1 bg-zinc-100 mt-1" />
      </div>
      <div className="pb-5 flex-1 min-w-0">
        <span className="text-[10px] font-mono text-zinc-400 block mb-1">{date}</span>
        <div className="text-sm text-zinc-600 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

/* ── Tech stack row ────────────────────────────────────────────────── */
export function Stack({ items }: { items: string[] }) {
  const list = Array.isArray(items) ? items : String(items).split(",").map((s) => s.trim());
  return (
    <div className="not-prose flex flex-wrap gap-1.5 my-4">
      {list.map((item) => (
        <span key={item} className="px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-600 text-[11px] font-mono font-medium border border-zinc-200">
          {item}
        </span>
      ))}
    </div>
  );
}

/* ── Metric highlight ──────────────────────────────────────────────── */
export function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="not-prose inline-flex flex-col items-center px-4 py-3 rounded-xl border border-zinc-200 bg-white text-center">
      <span className="text-xl font-bold text-zinc-900 leading-none">{value}</span>
      <span className="text-[10px] text-zinc-400 mt-1 font-medium uppercase tracking-wider">{label}</span>
    </div>
  );
}

/* ── Inline code override ──────────────────────────────────────────── */
function InlineCode({ children }: { children?: React.ReactNode }) {
  return (
    <code className="bg-zinc-100 border border-zinc-200 rounded px-1.5 py-0.5 text-[0.83em] font-mono text-fuchsia-700">
      {children}
    </code>
  );
}

/* ── pre override — routes ```arch blocks to ArchBlock ─────────────── */
function Pre({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) {
  const child = children as React.ReactElement<{ className?: string; children?: React.ReactNode }>;
  if (child?.props?.className === "language-arch") {
    return <ArchBlock>{child.props.children}</ArchBlock>;
  }
  return (
    <pre {...props} className="bg-zinc-950 text-zinc-300 text-[0.83em] font-mono rounded-xl p-4 overflow-x-auto my-4">
      {children}
    </pre>
  );
}

/* ── MDX component map ─────────────────────────────────────────────── */
export const labMDXComponents: MDXComponents = {
  pre: Pre,
  code: InlineCode,
  h2: ({ children, id }) => (
    <h2 id={id} className="group relative">
      {children}
      {id && (
        <a href={`#${id}`} className="ml-2 opacity-0 group-hover:opacity-40 text-zinc-400 no-underline text-sm" aria-hidden>#</a>
      )}
    </h2>
  ),
  h3: ({ children, id }) => (
    <h3 id={id} className="group relative">
      {children}
      {id && (
        <a href={`#${id}`} className="ml-2 opacity-0 group-hover:opacity-40 text-zinc-400 no-underline text-sm" aria-hidden>#</a>
      )}
    </h3>
  ),
  Status,
  Decision,
  Update,
  Stack,
  Metric,
};

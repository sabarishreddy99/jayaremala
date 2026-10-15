export function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

export function StatCard({
  label, value, sub, color = "default",
}: { label: string; value: string | number; sub?: string; color?: "default" | "emerald" | "rose" | "indigo" }) {
  const accent = {
    default: "text-fg",
    emerald: "text-emerald-600 dark:text-emerald-400",
    rose: "text-rose-600 dark:text-rose-400",
    indigo: "text-accent ",
  }[color];
  return (
    <div className="min-h-32 border-t border-border-strong px-1 py-4 sm:py-5 flex flex-col gap-2">
      <p className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-fg-subtle">{label}</p>
      <p className={`font-mono text-[2rem] tabular-nums tracking-tight leading-none ${accent}`}>{typeof value === "number" ? fmt(value) : value}</p>
      {sub && <p className="mt-auto text-[11px] text-fg-subtle leading-snug">{sub}</p>}
    </div>
  );
}

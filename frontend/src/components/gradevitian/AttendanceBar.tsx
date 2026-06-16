"use client";

/** Progress bar for attendance %, colour-banded like the old site:
 *  ≥75 green, ≥50 amber, else red. */
export default function AttendanceBar({ pct }: { pct: number }) {
  const clamped = Math.max(0, Math.min(100, pct));
  const color = clamped >= 75 ? "bg-emerald-500" : clamped >= 50 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="mt-3 h-6 w-full overflow-hidden rounded-full bg-surface-sunken">
      <div
        className={`flex h-full items-center justify-end rounded-full px-2 text-xs font-bold text-white transition-all duration-500 ${color}`}
        style={{ width: `${clamped}%` }}
      >
        {clamped > 8 ? `${clamped.toFixed(2)}%` : ""}
      </div>
    </div>
  );
}

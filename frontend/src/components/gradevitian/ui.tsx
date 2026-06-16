"use client";

import type { CalcResult, Tone } from "@/lib/gradevitian/calc";

/** Shared, Apple-grade styled primitives for gradeVITian — all theme-token based so
 *  they inherit the portfolio's light/dark palette and motion automatically. */

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-fg-muted">{label}</span>
      {children}
      {hint ? <span className="text-micro text-fg-subtle">{hint}</span> : null}
    </label>
  );
}

const inputBase =
  "w-full rounded-xl border border-border bg-surface-raised/60 px-3.5 py-2.5 text-fg " +
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none transition-all duration-200 " +
  "focus:border-accent focus:bg-surface-raised focus:ring-4 focus:ring-accent/15 " +
  "placeholder:text-fg-faint disabled:opacity-40 disabled:cursor-not-allowed";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputBase} ${props.className ?? ""}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputBase} cursor-pointer appearance-none ${props.className ?? ""}`} />;
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const styles =
    variant === "primary"
      ? "bg-accent text-accent-fg shadow-sm shadow-accent/25 hover:bg-accent-hover hover:shadow-md hover:shadow-accent/30"
      : "border border-border bg-surface/60 text-fg hover:bg-surface-raised hover:border-border-strong";
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100 ${styles} ${className}`}
    />
  );
}

export function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={`rounded-3xl border border-border-subtle bg-surface/70 p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_30px_-12px_rgba(0,0,0,0.12)] backdrop-blur-xl sm:p-7 ${className}`}
    >
      {children}
    </div>
  );
}

const toneStyles: Record<Tone, string> = {
  success: "border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-700 dark:text-emerald-300",
  warning: "border-amber-500/30 bg-amber-500/[0.08] text-amber-700 dark:text-amber-300",
  danger: "border-rose-500/30 bg-rose-500/[0.08] text-rose-700 dark:text-rose-300",
  neutral: "border-accent/30 bg-accent/[0.07] text-fg",
};

export function ResultCard({ result, children }: { result: CalcResult | null; children?: React.ReactNode }) {
  if (!result) return null;
  return (
    <div
      className={`animate-gv-pop mt-6 rounded-2xl border p-5 ${toneStyles[result.tone]}`}
      role="status"
      aria-live="polite"
    >
      <p className="text-[15px] font-semibold leading-snug">{result.message}</p>
      {result.detail ? <p className="mt-1.5 text-sm opacity-80">{result.detail}</p> : null}
      {children}
    </div>
  );
}

/** Segmented control (tabs) — used by CGPA, Attendance, Grade Predictor. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-2xl border border-border-subtle bg-surface-sunken/60 p-1 text-sm">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-xl px-3.5 py-1.5 font-medium transition-all duration-200 ${
            value === o.value
              ? "bg-surface text-fg shadow-sm"
              : "text-fg-subtle hover:text-fg"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

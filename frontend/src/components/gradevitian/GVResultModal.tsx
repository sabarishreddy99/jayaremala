"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { CalcResult, Tone } from "@/lib/gradevitian/calc";

const toneRing: Record<Tone, string> = {
  success: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 ring-emerald-500/25",
  warning: "bg-amber-500/12 text-amber-600 dark:text-amber-400 ring-amber-500/25",
  danger: "bg-rose-500/12 text-rose-600 dark:text-rose-400 ring-rose-500/25",
  neutral: "bg-accent/12 text-accent ring-accent/25",
};

function ToneIcon({ tone }: { tone: Tone }) {
  const common = { width: 26, height: 26, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (tone === "success") return <svg {...common}><path d="M20 6 9 17l-5-5" /></svg>;
  if (tone === "danger") return <svg {...common}><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>;
  if (tone === "warning") return <svg {...common}><path d="M10.3 3.3 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.3a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></svg>;
  return <svg {...common}><path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4" /></svg>;
}

/** Calculator results shown as a centered popup (replaces the old gradeVITian
 *  result pop-up). Closes on backdrop click, the × button, or Escape. */
export default function GVResultModal({
  result,
  onClose,
  children,
}: {
  result: CalcResult | null;
  onClose: () => void;
  children?: React.ReactNode;
}) {
  useEffect(() => {
    if (!result) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [result, onClose]);

  if (!result || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="animate-gv-fade absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="animate-gv-pop relative w-full max-w-md rounded-3xl border border-border-subtle bg-surface p-7 text-center shadow-2xl">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-fg-subtle transition hover:bg-surface-raised hover:text-fg"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>

        <div className={`mx-auto grid h-14 w-14 place-items-center rounded-2xl ring-1 ring-inset ${toneRing[result.tone]}`}>
          <ToneIcon tone={result.tone} />
        </div>

        <p className="mt-5 text-lg font-bold leading-snug text-fg">{result.message}</p>
        {result.detail ? <p className="mt-2 text-sm text-fg-muted">{result.detail}</p> : null}

        {children ? <div className="mt-5 flex flex-col items-center gap-3">{children}</div> : null}
      </div>
    </div>,
    document.body,
  );
}

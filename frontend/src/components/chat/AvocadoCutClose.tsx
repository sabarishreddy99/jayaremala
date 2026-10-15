"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const BACK_HREF = "/";
const CUT_MS = 950;

// One avocado silhouette, used whole for the button and halved for the cut.
const BODY = "M100 14C70 14 58 52 48 84C34 128 18 150 18 186C18 226 56 248 100 248C144 248 182 226 182 186C182 150 166 128 152 84C142 52 130 14 100 14Z";
const FLESH = "M100 34C77 34 68 66 60 94C48 134 36 154 36 184C36 214 66 232 100 232C134 232 164 214 164 184C164 154 152 134 140 94C132 66 123 34 100 34Z";

function Avocado({ halves = false }: { halves?: boolean }) {
  return (
    <svg viewBox="0 0 200 262" aria-hidden className="h-full w-full overflow-visible">
      {halves && (
        <defs>
          <clipPath id="avo-cut-left"><rect x="-20" y="0" width="120" height="270" /></clipPath>
          <clipPath id="avo-cut-right"><rect x="100" y="0" width="120" height="270" /></clipPath>
        </defs>
      )}
      <g className={halves ? "cut-half is-left" : undefined} clipPath={halves ? "url(#avo-cut-left)" : undefined}>
        <path d={BODY} fill="var(--skin,#3b4320)" />
        <path d={FLESH} fill="var(--flesh,#d8de8a)" />
        {/* The stone stays in one half, the way it does in a real avocado. */}
        <circle cx="100" cy="176" r="34" fill="var(--pit,#7a4a2b)" />
      </g>
      {halves && (
        <g className="cut-half is-right" clipPath="url(#avo-cut-right)">
          <path d={BODY} fill="var(--skin,#3b4320)" />
          <path d={FLESH} fill="var(--flesh,#d8de8a)" />
          <circle cx="100" cy="176" r="34" fill="color-mix(in srgb, var(--flesh,#d8de8a) 80%, var(--pit,#7a4a2b))" />
        </g>
      )}
    </svg>
  );
}

/**
 * Closing the chat: a whole avocado. Click it (or press Esc) and a knife
 * comes down through the middle, the halves fall apart, and the page goes
 * back to where the visitor came from — the previous page on this site, or
 * the home page if they arrived here directly. Under reduced motion it simply
 * closes.
 */
export default function AvocadoCutClose() {
  const router = useRouter();
  const [cutting, setCutting] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const leave = useCallback(() => {
    const sameSite = typeof document !== "undefined" && document.referrer.startsWith(window.location.origin);
    if (sameSite && window.history.length > 1) router.back();
    else router.push(BACK_HREF);
  }, [router]);

  // A ref, not the state, guards re-entry: `close` must stay stable so the
  // key listener effect below does not re-run (and cancel the timer) the
  // moment the cut starts.
  const started = useRef(false);
  const close = useCallback(() => {
    if (started.current) return;
    started.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      leave();
      return;
    }
    setCutting(true);
    timer.current = setTimeout(leave, CUT_MS);
  }, [leave]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  // Only an unmount cancels a pending exit.
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <>
      <button
        type="button"
        onClick={close}
        aria-label="Close chat (Esc)"
        title="Close (Esc)"
        className="group relative grid h-11 w-11 place-items-center rounded-full border border-border bg-surface/80 text-fg backdrop-blur-sm transition-[transform,border-color,background-color] duration-200 hover:border-accent hover:bg-accent-light active:scale-90"
      >
        {/* The × is the universal "close" sign; it turns a quarter on hover
            like a blade. A small avocado sits on the rim as the brand mark. */}
        <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          className="transition-transform duration-300 group-hover:rotate-90">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
        <span aria-hidden className="absolute -bottom-1 -right-1 block h-[17px] w-[14px] transition-transform duration-300 group-hover:rotate-[-14deg]">
          <Avocado />
        </span>
      </button>

      {cutting && (
        <div className="cut-stage fixed inset-0 z-[100] grid place-items-center" role="status" aria-label="Closing chat">
          <div className="relative h-48 w-40">
            <Avocado halves />
            {/* The knife: handle up, blade down, falling through the centre line. */}
            <svg viewBox="0 0 40 200" aria-hidden className="cut-knife absolute left-1/2 top-0 h-[120%] w-8 -translate-x-1/2 overflow-visible">
              <rect x="13" y="0" width="14" height="58" rx="5" fill="var(--pit,#7a4a2b)" />
              <path d="M11 58 L29 58 L29 176 L20 200 L11 186 Z" fill="#e7e5df" stroke="#9a948a" strokeWidth="1" />
            </svg>
            <span aria-hidden className="cut-line absolute left-1/2 top-[5%] h-[90%] w-px -translate-x-1/2 bg-[var(--skin-ink,#23280f)]" />
          </div>
        </div>
      )}
    </>
  );
}

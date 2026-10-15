"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

/**
 * Focus reading mode: the article is lit, everything else drops behind a
 * scrim (see `.reading-mode` in globals.css).
 *
 * The header button is a real toggle — it stays put and reads "Focus" or
 * "Exit" — so the meta row never reflows. While focused, a small bar is
 * portaled to <body> at the bottom centre of the screen, clear of the
 * scroll-to-top button on the left and the chat button on the right. The bar
 * is positioned by a plain wrapper, not by the button, because `.btn-avo`
 * sets `position: relative` and would otherwise win over `fixed`.
 */
export default function ReadingMode() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("reading-mode", active);
    return () => root.classList.remove("reading-mode");
  }, [active]);

  // Esc exits
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setActive(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  const toggle = () => {
    const next = !active;
    setActive(next);
    // Entering focus mid-page: bring the article's top edge into view only
    // if the reader is above it; otherwise keep their place.
    if (next) {
      const article = document.querySelector("article");
      if (article && article.getBoundingClientRect().top > window.innerHeight) {
        article.scrollIntoView({ block: "start" });
      }
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={active}
        aria-label={active ? "Exit focus reading mode (Esc)" : "Enter focus reading mode"}
        className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 font-mono text-[0.6875rem] uppercase tracking-[0.14em]
                    transition-colors duration-200 select-none
                    ${active
                      ? "border-accent bg-accent text-accent-fg"
                      : "border-border bg-surface text-fg-muted hover:border-accent hover:text-fg"}`}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
          {active
            ? <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
            : <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />}
        </svg>
        {active ? "Exit" : "Focus"}
      </button>

      {active && createPortal(
        <div className="focus-bar pointer-events-none fixed inset-x-0 bottom-4 z-[10000] flex justify-center px-4 sm:bottom-6">
          <div className="pointer-events-auto inline-flex items-center gap-3 rounded-full border border-border bg-surface/95 py-1.5 pl-4 pr-1.5 shadow-xl backdrop-blur-md">
            <span className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-muted">
              Focus mode
              <span className="ml-2 hidden text-fg-faint sm:inline">· Esc to exit</span>
            </span>
            <button
              type="button"
              onClick={() => setActive(false)}
              aria-label="Exit focus mode (Esc)"
              className="btn-avo inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-medium"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
              Exit
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

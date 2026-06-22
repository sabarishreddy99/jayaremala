"use client";

import { useEffect, useState } from "react";
import GVSearchModal from "@/components/gradevitian/GVSearchModal";

/** A search-bar trigger that opens the gradeVITian command palette. Also binds ⌘K / Ctrl-K. */
export default function GVSearch() {
  const [open, setOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setInitialQuery("");
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Honour the WebSite SearchAction target (/?q=…): when a visitor arrives from
  // Google's sitelinks search box, open the palette pre-filled with their query.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q && q.trim()) {
      // The search param is only readable on the client, so this mount-time
      // open-from-URL is exactly the case where setState in an effect is correct.
      /* eslint-disable react-hooks/set-state-in-effect */
      setInitialQuery(q);
      setOpen(true);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, []);

  return (
    <>
      <button
        onClick={() => { setInitialQuery(""); setOpen(true); }}
        className="group mx-auto flex w-full max-w-sm items-center gap-2.5 rounded-full border border-border bg-surface/60 px-5 py-2.5 text-sm text-fg-subtle backdrop-blur transition-all duration-200 hover:border-accent/40 hover:text-fg"
        aria-label="Search the site"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
        <span className="flex-1 text-left">Search calculators &amp; pages…</span>
        <kbd className="hidden rounded-md border border-border bg-surface-raised px-1.5 py-0.5 text-[10px] font-medium text-fg-faint sm:block">⌘K</kbd>
      </button>

      {open && <GVSearchModal initialQuery={initialQuery} onClose={() => setOpen(false)} />}
    </>
  );
}

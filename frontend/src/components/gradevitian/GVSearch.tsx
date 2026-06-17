"use client";

import { useEffect, useState } from "react";
import GVSearchModal from "@/components/gradevitian/GVSearchModal";

/** A search-bar trigger that opens the gradeVITian command palette. Also binds ⌘K / Ctrl-K. */
export default function GVSearch() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group mx-auto flex w-full max-w-sm items-center gap-2.5 rounded-full border border-border bg-surface/60 px-5 py-2.5 text-sm text-fg-subtle backdrop-blur transition-all duration-200 hover:border-accent/40 hover:text-fg"
        aria-label="Search the site"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
        <span className="flex-1 text-left">Search calculators &amp; pages…</span>
        <kbd className="hidden rounded-md border border-border bg-surface-raised px-1.5 py-0.5 text-[10px] font-medium text-fg-faint sm:block">⌘K</kbd>
      </button>

      {open && <GVSearchModal onClose={() => setOpen(false)} />}
    </>
  );
}

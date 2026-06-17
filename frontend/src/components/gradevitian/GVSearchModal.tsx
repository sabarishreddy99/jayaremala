"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useGvBase } from "@/lib/gradevitian/useGvBase";
import { useGVAuth } from "@/components/gradevitian/GVAuthProvider";
import { GV_PAGES, searchGV } from "@/lib/gradevitian/searchIndex";

/** Site-wide command/search palette. Rendered only while open (parent unmounts it on
 *  close), so it always starts clean — no open-reset effects, no setState-in-effect. */
export default function GVSearchModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const base = useGvBase();
  const { user } = useGVAuth();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const pool = useMemo(
    () => GV_PAGES.filter((p) => !p.auth || (p.auth === "in" ? !!user : !user)),
    [user],
  );
  const results = useMemo(() => searchGV(query, pool), [query, pool]);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 20);
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      document.body.style.overflow = "";
    };
  }, []);

  const go = (href: string) => {
    onClose();
    router.push(`${base}${href}`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = results[selected];
      if (r) go(r.href);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-start justify-center p-4 pt-[12vh]" role="dialog" aria-modal="true">
      <div className="animate-gv-fade absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="animate-gv-pop relative w-full max-w-lg overflow-hidden rounded-3xl border border-border-subtle bg-surface shadow-2xl" onKeyDown={onKeyDown}>
        <div className="flex items-center gap-2.5 border-b border-border-subtle px-4">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 text-fg-subtle" aria-hidden>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(0);
            }}
            placeholder="Search calculators, pages…"
            aria-label="Search gradeVITian"
            className="w-full bg-transparent py-3.5 text-fg outline-none placeholder:text-fg-faint"
          />
          <kbd className="hidden shrink-0 rounded-md border border-border bg-surface-raised px-1.5 py-0.5 text-[10px] font-medium text-fg-faint sm:block">esc</kbd>
        </div>

        <ul className="max-h-[58vh] overflow-y-auto py-2">
          {results.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-fg-muted">
              No results for <span className="font-medium text-fg">“{query}”</span>.
            </li>
          ) : (
            results.map((r, i) => (
              <li key={`${r.title}-${r.href}`}>
                <button
                  onClick={() => go(r.href)}
                  onMouseEnter={() => setSelected(i)}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors ${
                    i === selected ? "bg-surface-raised" : ""
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-fg">{r.title}</span>
                    <span className="block truncate text-xs text-fg-muted">{r.description}</span>
                  </span>
                  <span className="shrink-0 rounded-md bg-accent-light px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                    {r.category}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>,
    document.body,
  );
}

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ── Types ─────────────────────────────────────────────────

type ResultType = "blog" | "project" | "quote" | "lab" | "skill" | "page";

interface SearchResult {
  type: ResultType;
  title: string;
  description?: string;
  href: string;
  tags?: string[];
}

// ── Type config ────────────────────────────────────────────

const TYPE_STYLES: Record<ResultType, { bg: string; text: string; label: string }> = {
  blog:    { bg: "bg-indigo-50 dark:bg-indigo-950/50",  text: "text-indigo-600 dark:text-indigo-400", label: "Blog"    },
  project: { bg: "bg-blue-50 dark:bg-blue-950/50",      text: "text-blue-600 dark:text-blue-400",     label: "Project" },
  quote:   { bg: "bg-violet-50 dark:bg-violet-950/50",  text: "text-violet-600 dark:text-violet-400", label: "Quote"   },
  lab:     { bg: "bg-emerald-50 dark:bg-emerald-950/50",text: "text-emerald-600 dark:text-emerald-400",label: "Lab"    },
  skill:   { bg: "bg-amber-50 dark:bg-amber-950/50",    text: "text-amber-600 dark:text-amber-400",   label: "Skill"   },
  page:    { bg: "bg-zinc-100 dark:bg-zinc-800",         text: "text-zinc-600 dark:text-zinc-400",     label: "Page"    },
};

// ── Search index builder (server data passed as props) ─────

function buildIndex(data: SearchData): SearchResult[] {
  const results: SearchResult[] = [];

  // Static pages
  results.push(
    { type: "page", title: "Home",         href: "/",            description: "Portfolio homepage" },
    { type: "page", title: "Experience",   href: "/experience",  description: "Work history & roles" },
    { type: "page", title: "Education",    href: "/education",   description: "Degrees & coursework" },
    { type: "page", title: "Projects",     href: "/projects",    description: "Things I've built" },
    { type: "page", title: "Blog",         href: "/blog",        description: "Technical writing" },
    { type: "page", title: "Lab",          href: "/lab",         description: "System design docs" },
    { type: "page", title: "Quotes",       href: "/quotes",      description: "Collected wisdom" },
    { type: "page", title: "Now",          href: "/now",         description: "What I'm working on" },
    { type: "page", title: "Ask Avocado",  href: "/chat",        description: "AI assistant" },
  );

  // Blog posts
  for (const p of data.posts) {
    results.push({
      type: "blog",
      title: p.title,
      description: p.description,
      href: `/blog/${p.slug}`,
      tags: p.tags,
    });
  }

  // Projects
  for (const p of data.projects) {
    results.push({
      type: "project",
      title: p.title,
      description: p.description,
      href: "/projects",
      tags: p.tags,
    });
  }

  // Quotes (top 40 to keep index small)
  for (const q of data.quotes.slice(0, 40)) {
    results.push({
      type: "quote",
      title: `"${q.text.slice(0, 80)}${q.text.length > 80 ? "…" : ""}"`,
      description: `— ${q.author}`,
      href: "/quotes",
      tags: [q.category],
    });
  }

  // Skills
  for (const g of data.skills) {
    results.push({
      type: "skill",
      title: g.category,
      description: g.items.slice(0, 6).join(", "),
      href: "/projects",
    });
  }

  return results;
}

function search(query: string, index: SearchResult[]): SearchResult[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return index
    .filter((r) => {
      const haystack = [r.title, r.description, ...(r.tags ?? [])].join(" ").toLowerCase();
      return haystack.includes(q);
    })
    .slice(0, 12);
}

// ── Data shape ─────────────────────────────────────────────

export interface SearchData {
  posts:     { slug: string; title: string; description: string; tags: string[] }[];
  projects:  { title: string; description: string; tags: string[] }[];
  quotes:    { text: string; author: string; category: string }[];
  skills:    { category: string; items: string[] }[];
}

// ── Modal ─────────────────────────────────────────────────

export default function SearchModal({ data }: { data: SearchData }) {
  const [open, setOpen]       = useState(false);
  const [query, setQuery]     = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef  = useRef<HTMLInputElement>(null);
  const router    = useRouter();

  const index   = useRef(buildIndex(data));
  const results = search(query, index.current);

  const close = useCallback(() => { setOpen(false); setQuery(""); setSelected(0); }, []);

  // Cmd+K / Ctrl+K global shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // Keyboard navigation
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && results[selected]) {
      router.push(results[selected].href);
      close();
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-start justify-center pt-[12vh] px-4"
      onClick={close}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-bg/70 backdrop-blur-sm" aria-hidden />

      {/* Modal */}
      <div
        className="relative w-full max-w-xl bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-fg-faint shrink-0">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
            onKeyDown={onKeyDown}
            placeholder="Search posts, projects, quotes…"
            className="flex-1 bg-transparent text-sm text-fg placeholder:text-fg-faint focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-[10px] font-medium text-fg-faint">
            esc
          </kbd>
        </div>

        {/* Results */}
        {results.length > 0 ? (
          <ul className="max-h-[360px] overflow-y-auto py-2">
            {results.map((r, i) => {
              const cfg = TYPE_STYLES[r.type];
              return (
                <li key={`${r.type}-${r.href}-${i}`}>
                  <Link
                    href={r.href}
                    onClick={close}
                    className={`flex items-start gap-3 px-4 py-2.5 transition-colors ${
                      i === selected ? "bg-surface-raised" : "hover:bg-surface-raised"
                    }`}
                    onMouseEnter={() => setSelected(i)}
                  >
                    <span className={`mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ${cfg.bg} ${cfg.text}`}>
                      {cfg.label}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-fg truncate">{r.title}</p>
                      {r.description && (
                        <p className="text-[11px] text-fg-faint truncate mt-0.5">{r.description}</p>
                      )}
                    </div>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-auto shrink-0 mt-1 text-fg-faint opacity-0 group-hover:opacity-100">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : query.trim() ? (
          <div className="px-4 py-10 text-center text-sm text-fg-faint">
            No results for <strong className="text-fg">&ldquo;{query}&rdquo;</strong>
          </div>
        ) : (
          <div className="px-4 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-fg-faint mb-2">Quick links</p>
            <div className="flex flex-wrap gap-1.5">
              {["/blog", "/projects", "/lab", "/quotes", "/now", "/chat"].map((href) => (
                <Link
                  key={href}
                  href={href}
                  onClick={close}
                  className="rounded-full border border-border bg-surface-raised px-3 py-1 text-xs font-medium text-fg-muted hover:text-fg hover:border-fg-muted transition-colors capitalize"
                >
                  {href.slice(1) || "home"}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-border px-4 py-2 flex items-center gap-3 text-[10px] text-fg-faint">
          <span className="flex items-center gap-1"><kbd className="rounded border border-border px-1 py-0.5 font-mono">↑↓</kbd> navigate</span>
          <span className="flex items-center gap-1"><kbd className="rounded border border-border px-1 py-0.5 font-mono">↵</kbd> open</span>
          <span className="flex items-center gap-1"><kbd className="rounded border border-border px-1 py-0.5 font-mono">esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}

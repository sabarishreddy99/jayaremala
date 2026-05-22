"use client";

import { useState } from "react";

interface SourceLink { label: string; url: string }
interface Project {
  title: string;
  description: string;
  tags: string[];
  featured?: boolean;
  award?: string;
  note?: string;
  sourceLinks?: SourceLink[];
}

export default function ProjectsGrid({ projects }: { projects: Project[] }) {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const q = query.toLowerCase().trim();
  const allTags = Array.from(new Set(projects.flatMap((p) => p.tags))).sort();

  const filtered = projects.filter((p) => {
    const matchesTag = !activeTag || p.tags.includes(activeTag);
    const matchesQuery =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q));
    return matchesTag && matchesQuery;
  });

  return (
    <div>
      {/* Search */}
      <div className="relative mb-5">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-faint"
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          type="search"
          placeholder="Search by title, tech, or keyword…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface pl-9 pr-9 py-2.5 text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:border-accent transition-colors"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-faint hover:text-fg transition-colors"
            aria-label="Clear search"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        )}
      </div>

      {/* Tag filter */}
      {allTags.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveTag(null)}
            className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
              !activeTag
                ? "bg-fg text-bg"
                : "border border-border bg-surface text-fg-muted hover:border-fg-muted hover:text-fg"
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                activeTag === tag
                  ? "bg-accent text-white border border-accent"
                  : "border border-border bg-surface text-fg-muted hover:border-accent hover:text-accent"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-sm text-fg-faint">
            No projects match{query ? ` "${query}"` : ""}{activeTag ? ` in #${activeTag}` : ""}.
          </p>
          <button
            onClick={() => { setQuery(""); setActiveTag(null); }}
            className="mt-3 text-xs text-accent hover:text-accent-hover transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Grid */}
      {filtered.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, i) => (
            <div
              key={i}
              className="group flex flex-col rounded-2xl border border-border bg-surface p-5 sm:p-6 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <h2 className="font-bold text-fg text-sm leading-snug">{p.title}</h2>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {p.award && (
                    <span className="text-[10px] font-semibold rounded-full bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 px-2 py-0.5 whitespace-nowrap">
                      🏆 Winner
                    </span>
                  )}
                  {p.featured && !p.award?.length && (
                    <span className="text-[10px] font-semibold rounded-full bg-accent-light border border-indigo-200 dark:border-indigo-800 text-accent px-2 py-0.5">
                      Featured
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs leading-5 text-fg-subtle flex-1 mb-4">{p.description}</p>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {p.tags.map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTag(activeTag === t ? null : t)}
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors ${
                      activeTag === t
                        ? "bg-accent border-accent text-white"
                        : "bg-surface-raised border-border text-fg-muted hover:border-accent hover:text-accent"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {p.note && (
                <p className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-900 rounded-lg px-3 py-2 mb-3 leading-relaxed">
                  {p.note}
                </p>
              )}

              <div className="flex flex-wrap gap-2 pt-2 border-t border-border-subtle">
                {p.sourceLinks && p.sourceLinks.length > 0 ? (
                  p.sourceLinks.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full bg-accent-light border border-indigo-200 dark:border-indigo-800 px-2.5 py-0.5 text-[10px] font-semibold text-accent hover:opacity-80 transition-opacity"
                    >
                      {link.label}
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M7 17L17 7M17 7H7M17 7v10"/>
                      </svg>
                    </a>
                  ))
                ) : (
                  <span className="text-[11px] text-fg-faint">{p.note ? "" : "In progress"}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

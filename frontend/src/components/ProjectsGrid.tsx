"use client";

import { useState } from "react";
import ScrollReveal from "@/components/ScrollReveal";

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

function onTiltMove(e: React.MouseEvent<HTMLDivElement>) {
  const el = e.currentTarget;
  const { left, top, width, height } = el.getBoundingClientRect();
  const x = (e.clientX - left) / width  - 0.5;
  const y = (e.clientY - top)  / height - 0.5;
  el.style.transform = `perspective(700px) rotateX(${(-y * 7).toFixed(1)}deg) rotateY(${(x * 7).toFixed(1)}deg) scale3d(1.02,1.02,1.02)`;
}

function onTiltLeave(e: React.MouseEvent<HTMLDivElement>) {
  e.currentTarget.style.transform = "perspective(700px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)";
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
          className="w-full rounded-xl border border-border bg-surface pl-9 pr-9 py-2.5 text-base sm:text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:border-accent transition-colors"
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

      {/* Tag filter pills */}
      {allTags.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveTag(null)}
            className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-3.5 py-1.5 border transition-all duration-150 ${
              !activeTag
                ? "bg-fg text-bg border-fg shadow-sm"
                : "bg-surface border-border text-fg-faint hover:text-fg"
            }`}
          >
            All
            <span className={`text-[10px] font-semibold rounded-full px-1.5 py-0.5 ${
              !activeTag ? "bg-bg/20 text-bg" : "bg-surface-raised text-fg-faint"
            }`}>{projects.length}</span>
          </button>
          {allTags.map((tag) => {
            const isActive = activeTag === tag;
            const count = projects.filter((p) => p.tags.includes(tag)).length;
            return (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-3.5 py-1.5 border transition-all duration-150 ${
                  isActive
                    ? "bg-accent text-white border-accent shadow-sm"
                    : "bg-surface border-border text-fg-faint hover:text-fg hover:border-accent/50"
                }`}
              >
                {tag}
                <span className={`text-[10px] font-semibold rounded-full px-1.5 py-0.5 ${
                  isActive ? "bg-white/20 text-white" : "bg-surface-raised text-fg-faint"
                }`}>{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-sm text-fg-faint">
            No projects match{query ? ` "${query}"` : ""}{activeTag ? ` tagged "${activeTag}"` : ""}.
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
          {filtered.map((p, i) => {
            const isAward = Boolean(p.award);
            const sweepClass = isAward
              ? "from-amber-500 to-orange-500"
              : p.featured
              ? "from-blue-500 to-cyan-500"
              : "from-indigo-500 to-violet-500";

            return (
              <ScrollReveal key={i} delay={Math.min((i % 3) * 80, 160)} className="flex">
                <div
                  className="group relative flex flex-col flex-1 rounded-2xl border border-border bg-surface p-5 sm:p-6 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all overflow-hidden"
                  onMouseMove={onTiltMove}
                  onMouseLeave={onTiltLeave}
                  style={{ transition: "transform 0.2s cubic-bezier(0.16,1,0.3,1), border-color 0.2s, box-shadow 0.2s", willChange: "transform" }}
                >
                  {/* Hover sweep */}
                  <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${sweepClass} origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300`} />

                  {/* Title + badges */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h2 className="font-bold text-fg text-sm leading-snug group-hover:text-accent transition-colors">
                      {p.title}
                    </h2>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {isAward && (
                        <span className="text-[10px] font-semibold rounded-full bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 px-2 py-0.5 whitespace-nowrap">
                          🏆 Winner
                        </span>
                      )}
                      {p.featured && !isAward && (
                        <span className="text-[10px] font-semibold rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 px-2 py-0.5">
                          Featured
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs leading-5 text-fg-subtle flex-1 mb-4">{p.description}</p>

                  {/* Tag chips */}
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

                  {/* Source links */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-border-subtle">
                    {p.sourceLinks && p.sourceLinks.length > 0 ? (
                      p.sourceLinks.map((link) => (
                        <a
                          key={link.url}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full bg-accent-light border border-indigo-200 dark:border-indigo-800 px-2.5 py-0.5 text-[10px] font-semibold text-accent hover:opacity-80 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
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
              </ScrollReveal>
            );
          })}
        </div>
      )}
    </div>
  );
}

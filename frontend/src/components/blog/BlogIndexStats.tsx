"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api/client";

interface Summary {
  total_claps: number;
  total_views: number;
  posts: { slug: string; views: number; claps: number }[];
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

export function BlogIndexStats() {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/blog/stats/summary`)
      .then((r) => r.json())
      .then(setSummary)
      .catch(() => {});
  }, []);

  if (!summary || (summary.total_claps === 0 && summary.total_views === 0)) return null;

  return (
    <div className="flex items-center gap-4 mt-4">
      {summary.total_claps > 0 && (
        <div className="flex items-center gap-1.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-fg-faint">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z"/>
            <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
          </svg>
          <span className="text-sm font-semibold text-fg-muted">{formatCount(summary.total_claps)}</span>
          <span className="text-xs text-fg-faint">total claps</span>
        </div>
      )}
      {summary.total_claps > 0 && summary.total_views > 0 && (
        <span className="text-border">·</span>
      )}
      {summary.total_views > 0 && (
        <div className="flex items-center gap-1.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-fg-faint">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <span className="text-sm font-semibold text-fg-muted">{formatCount(summary.total_views)}</span>
          <span className="text-xs text-fg-faint">total views</span>
        </div>
      )}
    </div>
  );
}

export function BlogPostStats({ slug, slugMap }: { slug: string; slugMap: Summary["posts"] }) {
  const post = slugMap.find((p) => p.slug === slug);
  if (!post) return null;

  return (
    <div className="flex items-center gap-3 mt-2 shrink-0">
      {post.views > 0 && (
        <div className="flex items-center gap-1">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-fg-faint">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <span className="text-[10px] text-fg-faint">{formatCount(post.views)}</span>
        </div>
      )}
      {post.claps > 0 && (
        <div className="flex items-center gap-1">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-fg-faint">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z"/>
            <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
          </svg>
          <span className="text-[10px] text-fg-faint">{formatCount(post.claps)}</span>
        </div>
      )}
    </div>
  );
}

interface PostMeta {
  slug: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
  readingTime?: number;
}

export function BlogPostList({ posts }: { posts: PostMeta[] }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/blog/stats/summary`)
      .then((r) => r.json())
      .then(setSummary)
      .catch(() => {});
  }, []);

  const q = query.toLowerCase().trim();
  const allTags = Array.from(new Set(posts.flatMap((p) => p.tags))).sort();
  const filtered = posts.filter((p) => {
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
          placeholder="Search posts…"
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
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-sm text-fg-faint">
            No posts match{query ? ` "${query}"` : ""}{activeTag ? ` in #${activeTag}` : ""}.
          </p>
          <button
            onClick={() => { setQuery(""); setActiveTag(null); }}
            className="mt-3 text-xs text-accent hover:text-accent-hover transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}

    {filtered.length > 0 && <ol className="space-y-4">
      {filtered.map((p) => {
        const postStats = summary?.posts.find((s) => s.slug === p.slug);
        return (
          <li key={p.slug}>
            <Link
              href={`/blog/${p.slug}`}
              className="group block rounded-2xl border border-border bg-surface p-5 sm:p-6 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <h2 className="text-base font-bold text-fg group-hover:text-accent transition-colors leading-snug">
                  {p.title}
                </h2>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="text-[11px] text-fg-faint">{p.date}</span>
                  {p.readingTime && (
                    <span className="text-[10px] text-fg-faint">{p.readingTime} min read</span>
                  )}
                  {postStats && (postStats.views > 0 || postStats.claps > 0) && (
                    <div className="flex items-center gap-2.5">
                      {postStats.views > 0 && (
                        <div className="flex items-center gap-1">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-fg-faint">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                          </svg>
                          <span className="text-[10px] text-fg-faint">{formatCount(postStats.views)}</span>
                        </div>
                      )}
                      {postStats.claps > 0 && (
                        <div className="flex items-center gap-1">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-fg-faint">
                            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z"/>
                            <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                          </svg>
                          <span className="text-[10px] text-fg-faint">{formatCount(postStats.claps)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <p className="text-sm text-fg-subtle leading-relaxed mb-3">{p.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {p.tags.map((t) => (
                  <span key={t} className="rounded-full bg-surface-raised px-2 py-0.5 text-[10px] font-medium text-fg-subtle">
                    #{t}
                  </span>
                ))}
              </div>
            </Link>
          </li>
        );
      })}
    </ol>}
    </div>
  );
}

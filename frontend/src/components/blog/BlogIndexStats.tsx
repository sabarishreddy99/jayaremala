"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import NoteTile, { formatNoteDate } from "@/components/portfolio/NoteTile";

const SITE_URL = "https://jayaremala.com";

function Reveal({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.06 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-[opacity,transform] duration-500 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      } ${className}`}
    >
      {children}
    </div>
  );
}

function CardShareButton({ slug, title }: { slug: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const share = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${SITE_URL}/blog/${slug}`;
    if (navigator.share) {
      try { await navigator.share({ title, url }); } catch { /* cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch { /* blocked */ }
    }
  }, [slug, title]);

  return (
    <button
      onClick={share}
      aria-label={copied ? "Link copied!" : "Share post"}
      title={copied ? "Link copied!" : "Share post"}
      className="flex items-center gap-1 shrink-0 rounded-full px-2 py-1
                 text-current opacity-90 hover:opacity-100 hover:bg-current/10
                 transition-colors font-mono text-[0.6875rem]"
    >
      {copied ? (
        <>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          <span>Copied!</span>
        </>
      ) : (
        <>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
            <polyline points="16 6 12 2 8 6"/>
            <line x1="12" y1="2" x2="12" y2="15"/>
          </svg>
          <span>Share</span>
        </>
      )}
    </button>
  );
}
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

export function BlogIndexStats({ summary }: { summary: Summary | null }) {
  if (!summary || (summary.total_claps === 0 && summary.total_views === 0)) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mt-4 mb-8">
      {summary.total_views > 0 && (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-fg-muted bg-surface border border-border rounded-full px-3 py-1">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-fg-faint">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
          </svg>
          {formatCount(summary.total_views)} views
        </span>
      )}
      {summary.total_claps > 0 && (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-fg-muted bg-surface border border-border rounded-full px-3 py-1">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-fg-faint">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z"/>
            <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
          </svg>
          {formatCount(summary.total_claps)} claps
        </span>
      )}
      <span className="inline-flex items-center text-[11px] font-medium text-fg-muted bg-surface border border-border rounded-full px-3 py-1">
        {summary.posts.length} posts
      </span>
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
  publishedAt?: string;
  description: string;
  tags: string[];
  readingTime?: number;
  image?: string;
}

type SortMode = "latest" | "oldest" | "popular";

export function BlogPostList({ posts, summary }: { posts: PostMeta[]; summary: Summary | null }) {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [sort, setSort] = useState<SortMode>("latest");

  const q = query.toLowerCase().trim();
  const allTags = Array.from(new Set(posts.flatMap((p) => p.tags))).sort();
  // Search, three sort modes and a tag row are an archive's apparatus. Under a
  // handful of posts they cost ~230px in front of the content on a page whose
  // job is to get someone reading. They return on their own as the archive grows.
  const showFilters = posts.length >= 8;
  const filtered = posts.filter((p) => {
    const matchesTag = !activeTag || p.tags.includes(activeTag);
    const matchesQuery =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q));
    return matchesTag && matchesQuery;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "oldest") {
      const aD = a.publishedAt ?? a.date, bD = b.publishedAt ?? b.date;
      return aD < bD ? -1 : aD > bD ? 1 : 0;
    }
    if (sort === "popular") {
      const aS = summary?.posts.find((s) => s.slug === a.slug);
      const bS = summary?.posts.find((s) => s.slug === b.slug);
      const aScore = (aS?.views ?? 0) + (aS?.claps ?? 0) * 3;
      const bScore = (bS?.views ?? 0) + (bS?.claps ?? 0) * 3;
      if (bScore !== aScore) return bScore - aScore;
    }
    // latest (default) — descending publishedAt
    const aD = a.publishedAt ?? a.date, bD = b.publishedAt ?? b.date;
    return aD < bD ? 1 : aD > bD ? -1 : 0;
  });

  return (
    <div>
      {/* Search */}
      {showFilters && (
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
          className="w-full rounded border border-border bg-surface pl-9 pr-9 py-2.5 text-base sm:text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:border-accent transition-colors"
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

      )}

      {/* Sort controls */}
      {showFilters && (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-fg-faint shrink-0">Sort</span>
        <div className="flex flex-wrap gap-1.5">
          {([
            { key: "latest"  as const, label: "Latest",  icon: (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                <path d="M12 5v14M5 12l7 7 7-7"/>
              </svg>
            )},
            { key: "oldest"  as const, label: "Oldest",  icon: (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                <path d="M12 19V5M5 12l7-7 7 7"/>
              </svg>
            )},
            { key: "popular" as const, label: "Popular", icon: (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            )},
          ]).map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setSort(key)}
              aria-pressed={sort === key}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
                sort === key
                  ? "bg-accent text-accent-fg"
                  : "border border-border bg-surface text-fg-muted hover:border-fg-muted hover:text-fg"
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>

      )}

      {/* Tag filter — horizontal scroll on mobile, wraps on sm+ */}
      {showFilters && allTags.length > 1 && (
        <div className="flex flex-nowrap sm:flex-wrap overflow-x-auto sm:overflow-x-visible gap-2 mb-8 pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTag(null)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
              !activeTag
                ? "bg-accent text-accent-fg"
                : "border border-border bg-surface text-fg-muted hover:border-fg-muted hover:text-fg"
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
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
      {sorted.length === 0 && (
        <div className="rounded border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-sm text-fg-faint">
            No posts match{query ? ` "${query}"` : ""}{activeTag ? ` in #${activeTag}` : ""}.
          </p>
          <button
            onClick={() => { setQuery(""); setActiveTag(null); setSort("latest"); }}
            className="mt-3 text-xs text-accent hover:text-accent-hover transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}

    {sorted.length > 0 && (
      <ul className="note-desk grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-x-7 sm:gap-y-10 lg:grid-cols-3">
        {sorted.map((p, i) => {
          const postStats = summary?.posts.find((s) => s.slug === p.slug);
          return (
            <li key={p.slug} className="flex">
              <Reveal delay={Math.min(i * 60, 300)} className="flex-1 flex">
                <NoteTile
                  href={`/blog/${p.slug}`}
                  index={i}
                  image={p.image}
                  tags={p.tags}
                  title={p.title}
                  description={p.description}
                  eyebrow={<>Blog · {formatNoteDate(p.publishedAt ?? p.date)}{p.readingTime ? <> · {p.readingTime} min read</> : null}</>}
                  footer={
                    <span className="relative z-10 flex shrink-0 items-center gap-2.5 font-mono text-[0.6875rem] opacity-75">
                      {postStats && postStats.views > 0 && (
                        <span className="flex items-center gap-1" title="Views">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                          </svg>
                          {formatCount(postStats.views)}
                        </span>
                      )}
                      {postStats && postStats.claps > 0 && (
                        <span className="flex items-center gap-1" title="Claps">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z"/>
                            <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                          </svg>
                          {formatCount(postStats.claps)}
                        </span>
                      )}
                      <CardShareButton slug={p.slug} title={p.title} />
                    </span>
                  }
                />
              </Reveal>
            </li>
          );
        })}
      </ul>
    )}
    </div>
  );
}

export function BlogSection({ posts }: { posts: PostMeta[] }) {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/blog/stats/summary`)
      .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then(setSummary)
      .catch(() => {});
  }, []);

  return (
    <>
      <BlogIndexStats summary={summary} />
      <BlogPostList posts={posts} summary={summary} />
    </>
  );
}

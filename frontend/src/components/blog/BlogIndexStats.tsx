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
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z"/>
            <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
          </svg>
          <span className="text-sm font-semibold text-zinc-700">{formatCount(summary.total_claps)}</span>
          <span className="text-xs text-zinc-400">total claps</span>
        </div>
      )}
      {summary.total_claps > 0 && summary.total_views > 0 && (
        <span className="text-zinc-200">·</span>
      )}
      {summary.total_views > 0 && (
        <div className="flex items-center gap-1.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <span className="text-sm font-semibold text-zinc-700">{formatCount(summary.total_views)}</span>
          <span className="text-xs text-zinc-400">total views</span>
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
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <span className="text-[10px] text-zinc-400">{formatCount(post.views)}</span>
        </div>
      )}
      {post.claps > 0 && (
        <div className="flex items-center gap-1">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z"/>
            <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
          </svg>
          <span className="text-[10px] text-zinc-400">{formatCount(post.claps)}</span>
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
}

export function BlogPostList({ posts }: { posts: PostMeta[] }) {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/blog/stats/summary`)
      .then((r) => r.json())
      .then(setSummary)
      .catch(() => {});
  }, []);

  return (
    <ol className="space-y-4">
      {posts.map((p) => {
        const postStats = summary?.posts.find((s) => s.slug === p.slug);
        return (
          <li key={p.slug}>
            <Link
              href={`/blog/${p.slug}`}
              className="group block rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 hover:border-indigo-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <h2 className="text-base font-bold text-zinc-950 group-hover:text-indigo-700 transition-colors leading-snug">
                  {p.title}
                </h2>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="text-[11px] text-zinc-400">{p.date}</span>
                  {postStats && (postStats.views > 0 || postStats.claps > 0) && (
                    <div className="flex items-center gap-2.5">
                      {postStats.views > 0 && (
                        <div className="flex items-center gap-1">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-300">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                          </svg>
                          <span className="text-[10px] text-zinc-400">{formatCount(postStats.views)}</span>
                        </div>
                      )}
                      {postStats.claps > 0 && (
                        <div className="flex items-center gap-1">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-300">
                            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z"/>
                            <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                          </svg>
                          <span className="text-[10px] text-zinc-400">{formatCount(postStats.claps)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed mb-3">{p.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {p.tags.map((t) => (
                  <span key={t} className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                    #{t}
                  </span>
                ))}
              </div>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

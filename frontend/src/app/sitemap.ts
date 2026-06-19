import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";
import { getAllLabEntries } from "@/lib/lab";

// Revalidate every hour so admin-published content appears without a rebuild
export const revalidate = 3600;

const BASE = "https://jayaremala.com";
const API  = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

/* ── API fetchers (silent on failure — MDX posts are the fallback) ─── */

async function fetchApiBlogPosts(): Promise<{ slug: string; published_at: string }[]> {
  try {
    const res = await fetch(`${API}/content/blog`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const posts = await res.json();
    // only published posts belong in the sitemap
    return (posts as { slug: string; published_at: string; published?: boolean }[])
      .filter((p) => p.published !== false);
  } catch { return []; }
}

async function fetchApiLabEntries(): Promise<{ slug: string; updated_at: string }[]> {
  try {
    const res = await fetch(`${API}/content/lab`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // MDX filesystem posts (always available at build time)
  const mdxPosts = getAllPosts();
  const mdxLab   = getAllLabEntries();

  // API posts (admin-published, may not exist in MDX)
  const [apiPosts, apiLab] = await Promise.all([
    fetchApiBlogPosts(),
    fetchApiLabEntries(),
  ]);

  // Merge blog posts: MDX wins for date precision; API adds any extra slugs
  const blogSlugMap = new Map<string, string>();
  for (const p of mdxPosts) {
    blogSlugMap.set(p.slug, p.publishedAt ?? p.date);
  }
  for (const p of apiPosts) {
    if (!blogSlugMap.has(p.slug)) blogSlugMap.set(p.slug, p.published_at);
  }

  // Merge lab entries the same way
  const labSlugMap = new Map<string, string>();
  for (const e of mdxLab) {
    labSlugMap.set(e.slug, e.updatedAt);
  }
  for (const e of apiLab) {
    if (!labSlugMap.has(e.slug)) labSlugMap.set(e.slug, e.updated_at);
  }

  // Blog tag pages (from MDX only — API posts may not have tags indexed)
  const allTags = [...new Set(mdxPosts.flatMap((p) => p.tags))];

  /* ── Static routes ─────────────────────────────────────────────── */
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`,           lastModified: new Date(), changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE}/portfolio`,  lastModified: new Date(), changeFrequency: "weekly",  priority: 0.95 },
    { url: `${BASE}/experience`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/education`,  lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/projects`,   lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/apps`,       lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/blog`,       lastModified: new Date(), changeFrequency: "weekly",  priority: 0.9 },
    { url: `${BASE}/lab`,        lastModified: new Date(), changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE}/gallery`,    lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/now`,        lastModified: new Date(), changeFrequency: "weekly",  priority: 0.6 },
    { url: `${BASE}/quotes`,     lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    // gradeVITian lives on its own subdomain (with its own full sitemap at
    // gradevitian.jayaremala.com/sitemap.xml); list the home here as a discovery hint.
    { url: "https://gradevitian.jayaremala.com/", lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  ];

  const blogRoutes: MetadataRoute.Sitemap = [...blogSlugMap.entries()].map(([slug, date]) => ({
    url: `${BASE}/blog/${slug}`,
    lastModified: new Date(date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const labRoutes: MetadataRoute.Sitemap = [...labSlugMap.entries()].map(([slug, date]) => ({
    url: `${BASE}/lab/${slug}`,
    lastModified: new Date(date),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const tagRoutes: MetadataRoute.Sitemap = allTags.map((tag) => ({
    url: `${BASE}/blog/tag/${encodeURIComponent(tag)}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [...staticRoutes, ...blogRoutes, ...labRoutes, ...tagRoutes];
}

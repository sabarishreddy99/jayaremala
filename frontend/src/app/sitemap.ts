import type { MetadataRoute } from "next";

export const dynamic = "force-static";
import { getAllPosts } from "@/lib/blog";
import { getAllLabEntries } from "@/lib/lab";

const BASE = "https://jayaremala.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();
  const labEntries = getAllLabEntries();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`,           lastModified: new Date(), changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE}/experience`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/education`,  lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/projects`,   lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/blog`,       lastModified: new Date(), changeFrequency: "weekly",  priority: 0.9 },
    { url: `${BASE}/lab`,        lastModified: new Date(), changeFrequency: "weekly",  priority: 0.7 },
  ];

  const blogRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${BASE}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt ?? post.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const labRoutes: MetadataRoute.Sitemap = labEntries.map((entry) => ({
    url: `${BASE}/lab/${entry.slug}`,
    lastModified: entry.updatedAt ? new Date(entry.updatedAt) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...blogRoutes, ...labRoutes];
}

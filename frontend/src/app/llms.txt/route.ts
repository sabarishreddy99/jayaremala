import { getAllPosts } from "@/lib/blog";
import { getAllLabEntries } from "@/lib/lab";
import { profile } from "@/data/profile";

// Revalidate hourly — picks up admin-published content without a rebuild.
// Mirrors the sitemap / feed.xml cadence.
export const revalidate = 3600;

const BASE = "https://jayaremala.com";
const API  = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

interface Entry {
  slug: string;
  title: string;
  description: string;
  /** Sort key — newest first. */
  sortKey: string;
}

/* ── API fetchers (silent on failure — MDX is the fallback) ───────────── */

async function fetchApiBlogPosts(): Promise<Entry[]> {
  try {
    const res = await fetch(`${API}/content/blog`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const posts = await res.json() as {
      slug: string; title: string; description: string;
      published_at: string; published?: boolean;
    }[];
    return posts
      .filter((p) => p.published !== false)
      .map((p) => ({
        slug: p.slug,
        title: p.title,
        description: p.description ?? "",
        sortKey: p.published_at ?? "",
      }));
  } catch { return []; }
}

async function fetchApiLabEntries(): Promise<Entry[]> {
  try {
    const res = await fetch(`${API}/content/lab`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const entries = await res.json() as {
      slug: string; title: string; description: string; updated_at: string;
    }[];
    return entries.map((e) => ({
      slug: e.slug,
      title: e.title,
      description: e.description ?? "",
      sortKey: e.updated_at ?? "",
    }));
  } catch { return []; }
}

/** Merge MDX + API entries, MDX winning on slug collision, newest first. */
function merge(mdx: Entry[], api: Entry[]): Entry[] {
  const bySlug = new Map<string, Entry>();
  for (const e of mdx) bySlug.set(e.slug, e);
  for (const e of api) if (!bySlug.has(e.slug)) bySlug.set(e.slug, e);
  return [...bySlug.values()].sort((a, b) => (a.sortKey < b.sortKey ? 1 : -1));
}

function bullet(base: string, e: Entry): string {
  const desc = e.description ? `: ${e.description}` : "";
  return `- [${e.title}](${base}/${e.slug})${desc}`;
}

export async function GET() {
  // MDX filesystem content (always available at build time)
  const mdxPosts: Entry[] = getAllPosts().map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    sortKey: p.publishedAt ?? p.date,
  }));
  const mdxLab: Entry[] = getAllLabEntries().map((e) => ({
    slug: e.slug,
    title: e.title,
    description: e.description,
    sortKey: e.updatedAt,
  }));

  // API-published content (admin panel)
  const [apiPosts, apiLab] = await Promise.all([
    fetchApiBlogPosts(),
    fetchApiLabEntries(),
  ]);

  const posts = merge(mdxPosts, apiPosts);
  const lab   = merge(mdxLab, apiLab);

  const keyPages = [
    `- [Portfolio](${BASE}/portfolio): hero, featured projects, skills, testimonials, contact`,
    `- [Experience](${BASE}/experience): work history timeline`,
    `- [Education](${BASE}/education): degrees and highlights`,
    `- [Projects](${BASE}/projects): production systems, hackathon winners, and side projects`,
    `- [Lab](${BASE}/lab): live designs and progress logs for in-flight projects`,
    `- [Now](${BASE}/now): what I'm focused on right now`,
    `- [Gallery](${BASE}/gallery): visual log of achievements and milestones`,
    `- [Quotes](${BASE}/quotes): words that shaped how I think and build`,
    `- [Chat with Avocado](${BASE}/chat): RAG chatbot that answers recruiter questions about my work`,
  ].join("\n");

  const blogSection = posts.length
    ? posts.map((p) => bullet(`${BASE}/blog`, p)).join("\n")
    : "- (no posts yet)";

  const labSection = lab.length
    ? lab.map((e) => bullet(`${BASE}/lab`, e)).join("\n")
    : "- (no entries yet)";

  const body = `# ${profile.name}

> ${profile.tagline}

${profile.bio} Based in ${profile.location}.
Contact: ${profile.email} · GitHub: ${profile.github} · LinkedIn: ${profile.linkedin} · Résumé: ${profile.resume}

Interested in: ${profile.interested_domain}.

## Key pages

${keyPages}

## Blog

${blogSection}

## Lab notes

${labSection}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

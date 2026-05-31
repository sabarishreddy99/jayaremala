import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import type { Options as PrettyCodeOptions } from "rehype-pretty-code";
import { getAllPosts, getAllSlugs, getPostBySlug } from "@/lib/blog";
import Link from "next/link";
import { mdxComponents } from "@/components/blog/MDXComponents";
import BlogEngagement from "@/components/blog/BlogEngagement";
import ShareButtons from "@/components/blog/ShareButtons";
import ReadingMode from "@/components/blog/ReadingMode";
import { TableOfContents, MobileTOC } from "@/components/blog/TableOfContents";
import type { Heading } from "@/components/blog/TableOfContents";
import BlogPostMarkdown from "@/components/blog/BlogPostMarkdown";
import type { ApiBlogPost } from "@/lib/api/content";

const prettyCodeOptions: PrettyCodeOptions = {
  theme: { light: "github-light", dark: "github-dark-dimmed" },
  keepBackground: false,
  defaultLang: "plaintext",
};

const SITE_URL = "https://jayaremala.com";

type Props = { params: Promise<{ slug: string }> };

/** Render a blog post sourced from the content API (no MDX, plain markdown). */
function BlogPostApiView({ post }: { post: ApiBlogPost }) {
  return (
    <div className="mx-auto w-full max-w-3xl lg:max-w-[68rem] px-4 sm:px-6 py-12 sm:py-16">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-hover transition-colors mb-10"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        All posts
      </Link>

      <article>
        <header className="mb-10 pb-8 border-b border-border">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-fg leading-tight mb-3 font-[family-name:var(--font-blog)]">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-fg-faint">{post.date}</span>
            {post.tags.map((t) => (
              <span key={t} className="rounded-full bg-surface-raised px-2 py-0.5 text-[10px] font-medium text-fg-subtle">
                #{t}
              </span>
            ))}
          </div>
          <ShareButtons slug={post.slug} title={post.title} />
        </header>

        <div className="prose font-[family-name:var(--font-blog)] text-[1.0625rem] leading-[1.85]">
          <BlogPostMarkdown content={post.content} />
        </div>

        <BlogEngagement slug={post.slug} />
      </article>

      <div className="mt-16 pt-8 border-t border-border">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-hover transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to all posts
        </Link>
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  // Filesystem slugs (MDX files) — always available
  const fsslugs = new Set(getAllSlugs());

  // Also try to fetch slugs from the content API at build time so that posts
  // published via the admin panel before this build get static HTML too.
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
    const res = await fetch(`${apiUrl}/content/blog`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const apiPosts: { slug: string }[] = await res.json();
      for (const p of apiPosts) fsslugs.add(p.slug);
    }
  } catch {
    // API not available during build — that's fine, filesystem slugs are the baseline
  }

  return Array.from(fsslugs).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  // Try filesystem first, then API
  const post = getPostBySlug(slug);
  const title = post?.title ?? slug;
  const description = post?.description ?? "";
  const tags = post?.tags ?? [];
  const image = post?.image;
  const publishedAt = post ? (post.publishedAt ?? post.date) : "";

  if (!post) {
    // Try to get metadata from API
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
      const res = await fetch(`${apiUrl}/content/blog/${slug}`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const apiPost = await res.json();
        const url = `${SITE_URL}/blog/${slug}`;
        return {
          title: apiPost.title,
          description: apiPost.description,
          keywords: apiPost.tags,
          alternates: { canonical: url },
          openGraph: {
            type: "article" as const,
            url,
            title: apiPost.title,
            description: apiPost.description,
            siteName: "Jaya Sabarish Reddy Remala",
            publishedTime: apiPost.published_at,
            authors: ["Jaya Sabarish Reddy Remala"],
            tags: apiPost.tags,
            images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: apiPost.title }],
          },
        };
      }
    } catch { /* silent */ }
    return {};
  }

  const url = `${SITE_URL}/blog/${slug}`;
  return {
    title,
    description,
    keywords: tags,
    alternates: { canonical: url },
    openGraph: {
      type: "article" as const,
      url,
      title,
      description,
      siteName: "Jaya Sabarish Reddy Remala",
      publishedTime: publishedAt,
      authors: ["Jaya Sabarish Reddy Remala"],
      tags,
      images: [{ url: image ? `${SITE_URL}${image}` : `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      images: [image ? `${SITE_URL}${image}` : `${SITE_URL}/og-image.png`],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  // If post not found in filesystem, check content API (admin-published post)
  if (!post) {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
      const res = await fetch(`${apiUrl}/content/blog/${slug}`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const apiPost = await res.json();
        return <BlogPostApiView post={apiPost} />;
      }
    } catch { /* fall through to notFound */ }
    notFound();
  }

  // Extract h2/h3 headings for TOC
  const headings: Heading[] = [...post.content.matchAll(/^(#{2,3})\s+(.+)$/gm)].map(
    ([, hashes, text]) => ({
      level: hashes.length as 2 | 3,
      text: text.trim(),
      id: text.trim().toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-"),
    })
  );

  // Related posts — up to 2 by shared tags
  const related = getAllPosts()
    .filter((p) => p.slug !== slug)
    .map((p) => ({ ...p, score: p.tags.filter((t) => post.tags.includes(t)).length }))
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  const publishedAt = post.publishedAt ?? post.date;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    url: `${SITE_URL}/blog/${slug}`,
    datePublished: publishedAt,
    dateModified: post.date ?? publishedAt,
    author: { "@type": "Person", name: "Jaya Sabarish Reddy Remala", url: SITE_URL },
    publisher: { "@type": "Person", name: "Jaya Sabarish Reddy Remala", url: SITE_URL },
    keywords: post.tags?.join(", "),
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/blog/${slug}` },
  };

  return (
    <div className="mx-auto w-full max-w-3xl lg:max-w-[68rem] px-4 sm:px-6 py-12 sm:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-hover transition-colors mb-10"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        All posts
      </Link>

      <div className="lg:flex lg:gap-14 lg:items-start">
        <div className="flex-1 min-w-0">
          <article>
            <header className="mb-10 pb-8 border-b border-border">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-fg leading-tight mb-3 font-[family-name:var(--font-blog)]">
                {post.title}
              </h1>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-fg-faint">{post.date}</span>
                  <span className="text-sm text-fg-faint">{post.readingTime} min read</span>
                  {post.tags.map((t) => (
                    <Link
                      key={t}
                      href={`/blog/tag/${encodeURIComponent(t)}`}
                      className="rounded-full bg-surface-raised px-2 py-0.5 text-[10px] font-medium text-fg-subtle hover:text-accent transition-colors"
                    >
                      #{t}
                    </Link>
                  ))}
                </div>
                <ReadingMode />
              </div>
              <ShareButtons slug={post.slug} title={post.title} />
            </header>

            {/* Mobile TOC — inline before content */}
            <MobileTOC headings={headings} />

            <div className="prose font-[family-name:var(--font-blog)] text-[1.0625rem] leading-[1.85]">
              <MDXRemote
                source={post.content}
                components={mdxComponents}
                options={{ mdxOptions: { rehypePlugins: [[rehypePrettyCode, prettyCodeOptions]] } }}
              />
            </div>

            <BlogEngagement slug={post.slug} />
          </article>

          {/* Related posts */}
          {related.length > 0 && (
            <div className="mt-12 pt-8 border-t border-border">
              <p className="text-[10px] font-bold uppercase tracking-widest text-fg-faint mb-4">You might also like</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {related.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/blog/${p.slug}`}
                    className="group block rounded-xl border border-border bg-surface p-4 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm transition-all"
                  >
                    <h3 className="text-sm font-semibold text-fg group-hover:text-accent transition-colors leading-snug mb-1.5">
                      {p.title}
                    </h3>
                    <p className="text-[11px] text-fg-faint mb-2">{p.date}</p>
                    <div className="flex flex-wrap gap-1">
                      {p.tags.slice(0, 3).map((t) => (
                        <span key={t} className="rounded-full bg-surface-raised px-2 py-0.5 text-[10px] font-medium text-fg-subtle">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-16 pt-8 border-t border-border">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-hover transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back to all posts
            </Link>
          </div>
        </div>

        {/* Desktop TOC sidebar */}
        {headings.length >= 2 && (
          <aside className="hidden lg:block w-52 shrink-0 sticky top-24 self-start">
            <TableOfContents headings={headings} />
          </aside>
        )}
      </div>
    </div>
  );
}

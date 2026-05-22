import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllSlugs, getPostBySlug } from "@/lib/blog";
import Link from "next/link";
import { mdxComponents } from "@/components/blog/MDXComponents";
import BlogEngagement from "@/components/blog/BlogEngagement";
import ShareButtons from "@/components/blog/ShareButtons";

const SITE_URL = "https://jayaremala.com";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  const title = `${post.title} — Jaya Sabarish Reddy Remala`;
  const url = `${SITE_URL}/blog/${slug}`;
  return {
    title,
    description: post.description,
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.description,
      siteName: "Jaya Sabarish Reddy Remala",
      authors: ["Jaya Sabarish Reddy Remala"],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-12 sm:py-16">
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

          <div className="prose max-w-none font-[family-name:var(--font-blog)] text-[1.0625rem] leading-[1.85]">
            <MDXRemote source={post.content} components={mdxComponents} />
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

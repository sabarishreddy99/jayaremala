import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllSlugs, getPostBySlug } from "@/lib/blog";
import Link from "next/link";
import { mdxComponents } from "@/components/blog/MDXComponents";
import BlogGuideDrawer from "@/components/blog/BlogGuideDrawer";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  return post ? { title: `${post.title} — Jaya Sabarish Reddy Remala` } : {};
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-12 sm:py-16">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors mb-10"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        All posts
      </Link>

      <article>
        <header className="mb-10 pb-8 border-b border-zinc-200">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-950 leading-tight mb-3 font-[family-name:var(--font-blog)]">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-zinc-400">{post.date}</span>
            {post.tags.map((t) => (
              <span key={t} className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                #{t}
              </span>
            ))}
          </div>
        </header>

        <div className="prose max-w-none font-[family-name:var(--font-blog)] text-[1.0625rem] leading-[1.85]">
          <MDXRemote source={post.content} components={mdxComponents} />
        </div>
      </article>

      <div className="mt-16 pt-8 border-t border-zinc-200">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to all posts
        </Link>
      </div>

      <BlogGuideDrawer />
    </div>
  );
}

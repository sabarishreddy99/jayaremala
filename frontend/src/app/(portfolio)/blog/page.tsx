import { getAllPosts } from "@/lib/blog";
import { BlogIndexStats, BlogPostList } from "@/components/blog/BlogIndexStats";

export const metadata = {
  title: "Blog",
  description:
    "Technical writing on AI systems, ML infrastructure, distributed computing, and software craft by Jaya Sabarish Reddy Remala. Notes on building things that actually work.",
  alternates: { canonical: "https://jayaremala.com/blog" },
  openGraph: {
    type: "website" as const,
    url: "https://jayaremala.com/blog",
    title: "Blog — Jaya Sabarish Reddy Remala",
    description: "Notes on AI systems, ML infrastructure, distributed computing, and software craft.",
  },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-12 sm:py-16">
      <header className="mb-12 sm:mb-16">
        <p className="text-[11px] font-bold uppercase tracking-widest text-fg-faint mb-2">Writing | Decoding WHY&apos;s?</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-fg">My Scratchpad</h1>
        <p className="text-sm text-accent">Inspire <i className="text-fg-faint">n</i> [One]</p>
        <p className="mt-2 text-sm text-fg-subtle">
          Notes on building AI systems, Machine Learning, distributed infrastructure, software craft, navigating life, chaos and more!
        </p>
        <BlogIndexStats />
      </header>

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-sm text-fg-faint">No posts yet — check back soon.</p>
        </div>
      ) : (
        <BlogPostList posts={posts} />
      )}

    </div>
  );
}

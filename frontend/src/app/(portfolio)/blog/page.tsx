import { getAllPosts } from "@/lib/blog";
import BlogGuideDrawer from "@/components/blog/BlogGuideDrawer";
import { BlogIndexStats, BlogPostList } from "@/components/blog/BlogIndexStats";

export const metadata = { title: "Blog — Jaya Sabarish Reddy Remala" };

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-12 sm:py-16">
      <header className="mb-12 sm:mb-16">
        <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Writing | Decoding WHY&apos;s?</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950">My Scratchpad</h1>
        <p className="text-sm text-indigo-700">Inspire <i className="text-zinc-400">n</i> [One]</p>
        <p className="mt-2 text-sm text-zinc-500">
          Notes on building AI systems, Machine Learning, distributed infrastructure, software craft, navigating life, chaos and more!
        </p>
        <BlogIndexStats />
      </header>

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
          <p className="text-sm text-zinc-400">No posts yet — check back soon.</p>
        </div>
      ) : (
        <BlogPostList posts={posts} />
      )}

      <BlogGuideDrawer />
    </div>
  );
}

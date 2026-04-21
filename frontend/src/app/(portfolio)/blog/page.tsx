import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import BlogGuideDrawer from "@/components/blog/BlogGuideDrawer";

export const metadata = { title: "Blog — Jaya Sabarish Reddy Remala" };

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-12 sm:py-16">
      <header className="mb-12 sm:mb-16">
        <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Writing | Decoding WHY's?</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950">My Scratchpad</h1>
        <p className="text-sm text-indigo-700">Inspire <i className="text-zinc-400">n</i> [One]</p>
        <p className="mt-2 text-sm text-zinc-500">
         Notes on building AI systems, Machine Learning, distributed infrastructure, software craft, navigating life, chaos and more!
        </p>
      </header>

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
          <p className="text-sm text-zinc-400">No posts yet — check back soon.</p>
        </div>
      ) : (
        <ol className="space-y-4">
          {posts.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/blog/${p.slug}`}
                className="group block rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 hover:border-indigo-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h2 className="text-base font-bold text-zinc-950 group-hover:text-indigo-700 transition-colors leading-snug">
                    {p.title}
                  </h2>
                  <span className="flex-shrink-0 text-[11px] text-zinc-400 pt-0.5">{p.date}</span>
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
          ))}
        </ol>
      )}

      <BlogGuideDrawer />
    </div>
  );
}

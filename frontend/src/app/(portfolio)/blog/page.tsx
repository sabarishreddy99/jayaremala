import { getAllPosts } from "@/lib/blog";
import BlogSectionDynamic from "@/components/blog/BlogSectionDynamic";

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
  // Build-time MDX posts — used as fallback if the API is unreachable
  const staticPosts = getAllPosts();

  return (
    <div className="mx-auto w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl px-4 sm:px-6 xl:px-8 py-12 sm:py-16">
      <header className="mb-12 sm:mb-16 relative">
        {/* Decorative background bloom */}
        <div
          className="absolute -top-8 -right-8 w-72 h-72 rounded-full blur-3xl pointer-events-none -z-10"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.06) 60%, transparent 100%)" }}
          aria-hidden
        />

        <p className="text-[11px] font-bold uppercase tracking-widest text-fg-faint mb-3">
          Writing · Decoding WHY&apos;s
        </p>

        {/* Title with gradient glyph */}
        <div className="flex items-baseline gap-4 mb-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-fg">My Scratchpad</h1>
          <span
            className="text-2xl sm:text-3xl select-none"
            style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
            aria-hidden
          >
            ✦
          </span>
        </div>

        <p className="text-sm font-medium text-accent mb-3">
          Inspire <em className="not-italic text-fg-faint">n</em> [One]
        </p>

        <p className="text-sm text-fg-subtle max-w-xl leading-relaxed">
          Notes on building AI systems, Machine Learning, distributed infrastructure,
          software craft, navigating life, chaos and more.
        </p>

      </header>

      {/* BlogSectionDynamic fetches from API on the client; falls back to staticPosts */}
      <BlogSectionDynamic staticPosts={staticPosts} />

    </div>
  );
}

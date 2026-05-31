import Link from "next/link";
import { profile } from "@/data/profile";

export const metadata = {
  title: "Now — Jaya Sabarish Reddy Remala",
  description: "What I'm building, learning, and reading right now.",
};

const items = [
  {
    label: "Building",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>
      </svg>
    ),
    key: "building" as const,
    color: "text-indigo-500",
    border: "border-indigo-200 dark:border-indigo-800",
    bg: "bg-indigo-50/50 dark:bg-indigo-950/20",
  },
  {
    label: "Learning",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
      </svg>
    ),
    key: "learning" as const,
    color: "text-violet-500",
    border: "border-violet-200 dark:border-violet-800",
    bg: "bg-violet-50/50 dark:bg-violet-950/20",
  },
  {
    label: "Reading",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
    key: "reading" as const,
    color: "text-emerald-500",
    border: "border-emerald-200 dark:border-emerald-800",
    bg: "bg-emerald-50/50 dark:bg-emerald-950/20",
  },
];

export default function NowPage() {
  const now = profile.now;

  const updated = now?.updated
    ? new Date(now.updated).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 py-16 sm:py-20">

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-0.5 h-3.5 rounded-full bg-gradient-to-b from-indigo-500 to-violet-500 shrink-0" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-fg-faint">Now</h2>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-fg mb-3">What I&apos;m up to</h1>
        <p className="text-sm text-fg-subtle leading-relaxed">
          A snapshot of what I&apos;m focused on, building, and thinking about. Inspired by{" "}
          <a href="https://nownownow.com/about" target="_blank" rel="noopener noreferrer"
            className="text-accent hover:text-accent-hover underline underline-offset-2">
            the /now movement
          </a>.
        </p>
        {updated && (
          <p className="mt-2 text-[11px] text-fg-faint">
            Last updated{" "}
            <span className="font-medium text-fg-subtle">{updated}</span>
            {now?.location && (
              <> · <span className="font-medium text-fg-subtle">{now.location}</span></>
            )}
          </p>
        )}
      </div>

      {/* Cards */}
      {now ? (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.key}
              className={`flex items-start gap-4 rounded-2xl border ${item.border} ${item.bg} px-5 py-4`}
            >
              <span className={`mt-0.5 shrink-0 ${item.color}`}>{item.icon}</span>
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${item.color}`}>
                  {item.label}
                </p>
                <p className="text-sm text-fg leading-relaxed">{now[item.key]}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-fg-subtle">Nothing here yet — check back soon.</p>
      )}

      {/* Footer links */}
      <div className="mt-12 pt-8 border-t border-border flex flex-wrap gap-x-4 gap-y-2 sm:gap-x-6 text-xs text-fg-faint">
        <Link href="/" className="hover:text-fg-subtle transition-colors">← Portfolio</Link>
        <Link href="/blog" className="hover:text-fg-subtle transition-colors">Blog</Link>
        <Link href="/projects" className="hover:text-fg-subtle transition-colors">Projects</Link>
        <Link href="/chat" className="hover:text-fg-subtle transition-colors">Ask Avocado</Link>
      </div>
    </div>
  );
}

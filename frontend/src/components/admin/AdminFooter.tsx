import Link from "next/link";
import SeedAvatar from "@/components/chat/SeedAvatar";

const STEPS = ["Edit", "Stage", "Publish all"];

const LINKS = [
  { href: "/", label: "Live site" },
  { href: "/blog", label: "Blog" },
  { href: "/lab", label: "Lab" },
  { href: "/system", label: "System status" },
  { href: "/mcp", label: "MCP" },
];

/**
 * The desk's back page: the same perforated Skin band as the public site's
 * footer, run edge to edge across the working area. It closes every view with
 * the publishing workflow, the outward links, and whether this browser can
 * publish right now.
 */
export default function AdminFooter({ githubReady }: { githubReady: boolean }) {
  return (
    <footer className="back-page relative mt-auto bg-fg text-bg" aria-label="Admin workspace footer">
      <span aria-hidden className="back-page-perf" />
      <div className="grid gap-8 px-5 pt-10 pb-8 sm:px-8 md:grid-cols-[minmax(0,1.3fr)_minmax(0,0.8fr)_minmax(0,1fr)] md:gap-10 lg:px-10">
        {/* Identity + workflow */}
        <div>
          <div className="flex items-center gap-3">
            <SeedAvatar size={34} />
            <div>
              <p className="display-serif text-[1.375rem] leading-none">Avocado</p>
              <p className="mt-1 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-bg/60">Publishing desk</p>
            </div>
          </div>
          <ol className="mt-6 flex flex-wrap items-center gap-2" aria-label="Publishing workflow">
            {STEPS.map((step, i) => (
              <li key={step} className="flex items-center gap-2">
                <span className={`rounded-full px-3 py-1 font-mono text-[0.6875rem] uppercase tracking-[0.12em] ${
                  i === STEPS.length - 1 ? "bg-accent text-[var(--skin-ink)]" : "border border-bg/25 text-bg/85"
                }`}>
                  {step}
                </span>
                {i < STEPS.length - 1 && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className="text-bg/45">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                )}
              </li>
            ))}
          </ol>
          <p className="mt-4 max-w-[46ch] text-[0.8125rem] leading-relaxed text-bg/70">
            GitHub edits wait in one batch and ship as a single commit. Live edits save the moment you hit save.
          </p>
        </div>

        {/* Outward links */}
        <nav aria-label="Leave the desk">
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-bg/55">Go to</p>
          <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5 md:grid-cols-1">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="group inline-flex items-center gap-1.5 text-sm text-bg/85 transition-colors hover:text-accent">
                  {l.label}
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden
                    className="opacity-0 transition-opacity group-hover:opacity-100"><path d="M7 17 17 7M7 7h10v10" /></svg>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Status */}
        <div>
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-bg/55">This browser</p>
          <dl className="mt-4 space-y-3 text-[0.8125rem]">
            <div className="flex items-center gap-2.5">
              <span aria-hidden className={`size-2 shrink-0 rounded-full ${githubReady ? "bg-accent" : "bg-[#e0a77e]"}`} />
              <dt className="sr-only">Publishing</dt>
              <dd className="text-bg/85">{githubReady ? "GitHub connected, ready to publish" : "No GitHub token yet, live edits only"}</dd>
            </div>
            <div className="flex items-center gap-2.5">
              <span aria-hidden className="size-2 shrink-0 rounded-full border border-bg/50" />
              <dt className="sr-only">Session</dt>
              <dd className="text-bg/70">Signed-in sessions end after four hours</dd>
            </div>
          </dl>
          <p className="mt-5 text-[0.8125rem] text-bg/70">
            <kbd className="rounded-md border border-bg/30 px-1.5 py-0.5 font-mono text-[0.6875rem] text-bg">⌘ K</kbd> finds any section
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-bg/15 px-5 py-4 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-bg/50 sm:px-8 lg:px-10">
        <span>jayaremala.com · private</span>
        <span>© {process.env.NEXT_PUBLIC_BUILD_YEAR}</span>
      </div>
    </footer>
  );
}

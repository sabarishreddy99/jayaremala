import Link from "next/link";
import { getAllLabEntries, LabStatus } from "@/lib/lab";
import BlogGuideDrawer from "@/components/blog/BlogGuideDrawer";

export const metadata = { title: "Lab — Jaya Sabarish Reddy Remala" };

const STATUS_STYLES: Record<LabStatus, { dot: string; text: string; bg: string; label: string }> = {
  active:  { dot: "bg-emerald-400 animate-pulse", text: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", label: "Active" },
  shipped: { dot: "bg-indigo-400",                text: "text-indigo-700",  bg: "bg-indigo-50 border-indigo-200",   label: "Shipped" },
  paused:  { dot: "bg-amber-400",                 text: "text-amber-700",   bg: "bg-amber-50 border-amber-200",     label: "Paused" },
};

export default function LabPage() {
  const entries = getAllLabEntries();

  return (
    <>
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-12 sm:py-16">
      <header className="mb-12 sm:mb-16">
        <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Build Log | In the Open</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950">Lab</h1>
        <p className="text-sm text-indigo-700">Building in public</p>
        <p className="mt-2 text-sm text-zinc-500 max-w-xl">
          Live system designs, technical decisions, and progress logs for projects I&apos;m actively working on.
          Updated as things evolve — not a polished writeup, a working document.
        </p>
      </header>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
          <p className="text-sm text-zinc-400">Nothing here yet — check back soon.</p>
        </div>
      ) : (
        <ol className="space-y-4">
          {entries.map((entry) => {
            const s = STATUS_STYLES[entry.status];
            return (
              <li key={entry.slug}>
                <Link
                  href={`/lab/${entry.slug}`}
                  className="group block rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 hover:border-indigo-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <h2 className="text-base font-bold text-zinc-950 group-hover:text-indigo-700 transition-colors leading-snug truncate">
                        {entry.title}
                      </h2>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold ${s.bg} ${s.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {s.label}
                      </span>
                      <span className="text-[10px] text-zinc-400">updated {entry.updatedAt}</span>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-500 leading-relaxed mb-3">{entry.description}</p>

                  <div className="flex flex-wrap gap-1.5">
                    {entry.tech.map((t) => (
                      <span key={t} className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-mono font-medium text-zinc-500 border border-zinc-200">
                        {t}
                      </span>
                    ))}
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
    <BlogGuideDrawer />
    </>
  );
}

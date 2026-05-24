import { getAllLabEntries } from "@/lib/lab";
import LabList from "@/components/LabList";

export const metadata = { title: "Lab — Jaya Sabarish Reddy Remala" };

export default function LabPage() {
  const entries = getAllLabEntries();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-12 sm:py-16">
      <header className="mb-12 sm:mb-16">
        <p className="text-[11px] font-bold uppercase tracking-widest text-fg-faint mb-2">Build Log | In the Open</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-fg">Lab</h1>
        <p className="text-sm text-accent">Building in public</p>
        <p className="mt-2 text-sm text-fg-subtle max-w-xl">
          Live system designs, technical decisions, and progress logs for projects I&apos;m actively working on.
          Updated as things evolve — not a polished writeup, a working document.
        </p>
      </header>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-sm text-fg-faint">Nothing here yet — check back soon.</p>
        </div>
      ) : (
        <LabList entries={entries} />
      )}
    </div>
  );
}

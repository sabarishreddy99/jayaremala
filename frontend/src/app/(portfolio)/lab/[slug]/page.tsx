import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";
import { getAllLabEntries, getAllLabSlugs, getLabEntryBySlug, LabStatus } from "@/lib/lab";
import { labMDXComponents } from "@/components/lab/LabMDXComponents";

type Props = { params: Promise<{ slug: string }> };

const STATUS_STYLES: Record<LabStatus, { dot: string; text: string; bg: string; label: string }> = {
  active:  { dot: "bg-emerald-400 animate-pulse", text: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800", label: "Active" },
  shipped: { dot: "bg-indigo-400",                text: "text-indigo-700 dark:text-indigo-400",   bg: "bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800",   label: "Shipped" },
  paused:  { dot: "bg-amber-400",                 text: "text-amber-700 dark:text-amber-400",     bg: "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800",     label: "Paused" },
};

export async function generateStaticParams() {
  return getAllLabSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const entry = getLabEntryBySlug(slug);
  return entry ? { title: `${entry.title} — Lab — Jaya Sabarish Reddy Remala` } : {};
}

export default async function LabEntryPage({ params }: Props) {
  const { slug } = await params;
  const entry = getLabEntryBySlug(slug);
  if (!entry) notFound();

  const allEntries = getAllLabEntries();
  const idx = allEntries.findIndex((e) => e.slug === slug);
  const prev = allEntries[idx + 1] ?? null;
  const next = allEntries[idx - 1] ?? null;

  const s = STATUS_STYLES[entry.status];

  return (
    <>
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-12 sm:py-16">
      <Link
        href="/lab"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-hover transition-colors mb-10"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Lab
      </Link>

      <article>
        <header className="mb-10 pb-8 border-b border-border">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold ${s.bg} ${s.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              {s.label}
            </span>
            <span className="text-[11px] text-fg-faint">started {entry.startedAt}</span>
            <span className="text-fg-faint">·</span>
            <span className="text-[11px] text-fg-faint">last updated {entry.updatedAt}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-fg leading-tight mb-3">
            {entry.title}
          </h1>
          <p className="text-sm text-fg-subtle leading-relaxed mb-4">{entry.description}</p>

          <div className="flex flex-wrap gap-1.5">
            {entry.tech.map((t) => (
              <span key={t} className="rounded-md bg-surface-raised px-2.5 py-1 text-[11px] font-mono font-medium text-fg-muted border border-border">
                {t}
              </span>
            ))}
            {entry.links?.map((link) => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 px-2.5 py-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors inline-flex items-center gap-1"
              >
                {link.label}
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M7 17L17 7M17 7H7M17 7v10"/>
                </svg>
              </a>
            ))}
          </div>
        </header>

        <div className="prose max-w-none text-[1.0rem] leading-[1.85]">
          <MDXRemote source={entry.content} components={labMDXComponents} />
        </div>
      </article>

      <div className="flex items-center justify-between mt-16 pt-8 border-t border-border text-xs font-medium gap-4">
        {prev ? (
          <Link href={`/lab/${prev.slug}`} className="inline-flex items-center gap-1.5 text-fg-muted hover:text-fg transition-colors min-w-0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span className="truncate">{prev.title}</span>
          </Link>
        ) : <div />}

        <Link href="/lab" className="text-accent hover:text-accent-hover transition-colors shrink-0">
          All entries
        </Link>

        {next ? (
          <Link href={`/lab/${next.slug}`} className="inline-flex items-center gap-1.5 text-fg-muted hover:text-fg transition-colors min-w-0 text-right">
            <span className="truncate">{next.title}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        ) : <div />}
      </div>
    </div>
    </>
  );
}

import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";
import { getAllLabSlugs, getLabEntryBySlug, LabStatus } from "@/lib/lab";
import { labMDXComponents } from "@/components/lab/LabMDXComponents";
import BlogGuideDrawer from "@/components/blog/BlogGuideDrawer";

type Props = { params: Promise<{ slug: string }> };

const STATUS_STYLES: Record<LabStatus, { dot: string; text: string; bg: string; label: string }> = {
  active:  { dot: "bg-emerald-400 animate-pulse", text: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", label: "Active" },
  shipped: { dot: "bg-indigo-400",                text: "text-indigo-700",  bg: "bg-indigo-50 border-indigo-200",   label: "Shipped" },
  paused:  { dot: "bg-amber-400",                 text: "text-amber-700",   bg: "bg-amber-50 border-amber-200",     label: "Paused" },
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

  const s = STATUS_STYLES[entry.status];

  return (
    <>
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-12 sm:py-16">
      <Link
        href="/lab"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors mb-10"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Lab
      </Link>

      <article>
        <header className="mb-10 pb-8 border-b border-zinc-200">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold ${s.bg} ${s.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              {s.label}
            </span>
            <span className="text-[11px] text-zinc-400">started {entry.startedAt}</span>
            <span className="text-zinc-200">·</span>
            <span className="text-[11px] text-zinc-400">last updated {entry.updatedAt}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 leading-tight mb-3">
            {entry.title}
          </h1>
          <p className="text-sm text-zinc-500 leading-relaxed mb-4">{entry.description}</p>

          <div className="flex flex-wrap gap-1.5">
            {entry.tech.map((t) => (
              <span key={t} className="rounded-md bg-zinc-100 px-2.5 py-1 text-[11px] font-mono font-medium text-zinc-600 border border-zinc-200">
                {t}
              </span>
            ))}
          </div>
        </header>

        <div className="prose max-w-none text-[1.0rem] leading-[1.85]">
          <MDXRemote source={entry.content} components={labMDXComponents} />
        </div>
      </article>

      <div className="mt-16 pt-8 border-t border-zinc-200">
        <Link
          href="/lab"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Lab
        </Link>
      </div>
    </div>
    <BlogGuideDrawer />
    </>
  );
}

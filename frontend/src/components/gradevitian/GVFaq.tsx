import GVJsonLd from "@/components/gradevitian/GVJsonLd";
import { faqLd } from "@/lib/gradevitian/seo";

export interface FaqItem {
  q: string;
  a: string;
}

/**
 * Accessible FAQ accordion (native <details> — no JS) that ALSO emits matching
 * FAQPage JSON-LD. Keeping the visible Q&A and the structured data in one place
 * satisfies Google's rule that FAQ rich-result content must be visible on the page,
 * and targets long-tail / "People also ask" queries.
 */
export default function GVFaq({
  items,
  title = "Frequently asked questions",
}: {
  items: FaqItem[];
  title?: string;
}) {
  if (!items.length) return null;
  return (
    <section className="mt-16" aria-label="Frequently asked questions">
      <h2 className="text-center text-xs font-bold uppercase tracking-widest text-fg-subtle">{title}</h2>
      <div className="mx-auto mt-6 max-w-2xl divide-y divide-border-subtle overflow-hidden rounded-2xl border border-border-subtle bg-surface/50">
        {items.map((it) => (
          <details key={it.q} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-fg">
              {it.q}
              <svg
                className="shrink-0 text-fg-subtle transition-transform duration-200 group-open:rotate-180"
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </summary>
            <p className="mt-2.5 text-sm leading-relaxed text-fg-muted">{it.a}</p>
          </details>
        ))}
      </div>
      <GVJsonLd data={faqLd(items)} />
    </section>
  );
}

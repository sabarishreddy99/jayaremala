import { caseStudies } from "@/data/case-studies";
import { profile } from "@/data/profile";
import ScrollReveal from "@/components/ui/ScrollReveal";

export const metadata = {
  title: "Case Studies",
  description:
    "Long-form product and systems case studies — the brief, the research, the root causes, the solution and how I would ship it. Each one ships with a working prototype.",
  alternates: { canonical: "https://jayaremala.com/case-studies" },
  openGraph: {
    type: "website" as const,
    url: "https://jayaremala.com/case-studies",
    title: "Case Studies | Jaya Sabarish Reddy Remala",
    description:
      "Long-form product and systems case studies, each with a working prototype.",
  },
};

/** Icon per link kind — the deck is the primary read, everything else is secondary. */
function LinkIcon({ kind }: { kind?: string }) {
  if (kind === "prototype") {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
        <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
      </svg>
    );
  }
  if (kind === "repo") {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden className="shrink-0">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
      </svg>
    );
  }
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

export default function CaseStudiesPage() {
  const withPrototype = caseStudies.filter((c) =>
    c.links?.some((l) => l.kind === "prototype"),
  ).length;

  return (
    <div className="mx-auto w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl px-4 sm:px-6 xl:px-8 py-12 sm:py-16">

      {/* Header */}
      <header className="mb-12 sm:mb-16 relative">
        <div
          className="absolute -top-8 -right-8 w-72 h-72 rounded-full blur-3xl pointer-events-none -z-10"
          style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--accent) 10%, transparent) 0%, transparent 70%)" }}
          aria-hidden
        />

        <p className="text-[11px] font-medium tracking-wide text-fg-subtle mb-3">Writing · Long form</p>

        <div className="flex items-baseline gap-3 mb-2">
          <h1 className="display-serif display-md text-fg">Case Studies</h1>
        </div>

        <p className="text-sm text-fg-subtle max-w-xl leading-relaxed mb-4">
          {profile.page_case_studies ??
            "Briefs worked end to end: the problem, the research, the root causes, the solution, and how I would ship it. Each one comes with a working prototype."}
        </p>

        <div className="flex flex-wrap gap-2 mt-4">
          <span className="inline-flex items-center text-[11px] font-medium text-fg-muted bg-surface border border-border rounded-full px-3 py-1">
            {caseStudies.length} case stud{caseStudies.length === 1 ? "y" : "ies"}
          </span>
          {withPrototype > 0 && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-accent bg-accent-light border border-accent/30 rounded-full px-3 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              {withPrototype} with a live prototype
            </span>
          )}
        </div>
      </header>

      {/* The list — newest first, numbered so the order is explicit */}
      <ol className="space-y-10 sm:space-y-12">
        {caseStudies.map((cs, i) => {
          const primary = cs.links?.find((l) => l.kind === "deck") ?? cs.links?.[0];
          const others  = (cs.links ?? []).filter((l) => l !== primary);

          return (
            <ScrollReveal key={cs.slug} delay={Math.min(i * 80, 240)}>
              <li className="group relative rounded-card border border-border bg-surface overflow-hidden transition-colors hover:border-border-strong card-lift">
                <div className="absolute inset-x-0 top-0 h-px bg-accent origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />

                {/* flex-col below lg, not a bare block: `order` is a flex/grid
                    property, and without it the cover drops to the bottom of
                    the card on a phone, under the CTAs. */}
                <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
                  {/* ── Body ─────────────────────────────────────────── */}
                  <div className="order-2 p-6 sm:p-8 lg:order-1">
                    <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <span className="font-mono text-[0.6875rem] tabular-nums text-fg-faint">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="h-3 w-px bg-border" aria-hidden />
                      <span className="text-[11px] font-medium text-accent">{cs.context}</span>
                    </div>

                    <h2 className="display-serif text-xl sm:text-2xl leading-tight text-fg">
                      {cs.title}
                    </h2>
                    <p className="mt-1.5 text-sm font-medium leading-snug text-fg-muted text-pretty">
                      {cs.headline}
                    </p>

                    {/* Dateline */}
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.6875rem] tabular-nums text-fg-faint">
                      {cs.role && <span>{cs.role}</span>}
                      {cs.role && <span aria-hidden>·</span>}
                      <span>{cs.date}</span>
                      {cs.readingTime && <><span aria-hidden>·</span><span>{cs.readingTime}</span></>}
                    </div>

                    <p className="mt-4 max-w-[70ch] text-sm leading-relaxed text-fg-muted">
                      {cs.summary}
                    </p>

                    {/* The deck's own act structure — this is the "ordered" part:
                        a reader sees the shape of the argument before opening it. */}
                    {cs.sections && cs.sections.length > 0 && (
                      <ol className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-border-subtle pt-4">
                        {cs.sections.map((s, j) => (
                          <li key={s} className="flex items-baseline gap-1.5 text-[0.6875rem] text-fg-subtle">
                            <span className="font-mono tabular-nums text-fg-faint">{j + 1}</span>
                            {s}
                          </li>
                        ))}
                      </ol>
                    )}

                    {cs.tags && cs.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {cs.tags.map((t) => (
                          <span key={t} className="rounded-full border border-border px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-fg-subtle">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* CTAs. These are plain <a>, not next/link: each target is a
                        standalone HTML file in public/, not a Next route, so the
                        router must not try to client-navigate to it. */}
                    <div className="mt-6 flex flex-wrap items-center gap-2.5">
                      {primary && (
                        <a
                          href={primary.href}
                          className="group/cta inline-flex items-center gap-2 rounded-full bg-fg px-5 py-2.5 text-sm font-medium text-bg transition-opacity hover:opacity-80"
                        >
                          {primary.label}
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden
                            className="shrink-0 transition-transform duration-200 group-hover/cta:translate-x-0.5">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </a>
                      )}
                      {others.map((l) => (
                        <a
                          key={l.href}
                          href={l.href}
                          className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-medium text-fg transition-colors hover:border-border-strong hover:bg-surface-raised"
                        >
                          <LinkIcon kind={l.kind} />
                          {l.label}
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* ── Cover ────────────────────────────────────────── */}
                  {cs.cover && (
                    <a
                      href={primary?.href ?? "#"}
                      tabIndex={-1}
                      aria-hidden
                      className="relative order-1 block overflow-hidden border-b border-border bg-surface-raised lg:order-2 lg:border-b-0 lg:border-l"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={cs.cover}
                        alt={cs.coverAlt ?? ""}
                        loading="lazy"
                        decoding="async"
                        className="h-44 w-full object-cover object-left-top transition-transform duration-500 group-hover:scale-[1.03] sm:h-56 lg:h-full lg:min-h-[19rem]"
                      />
                    </a>
                  )}
                </div>
              </li>
            </ScrollReveal>
          );
        })}
      </ol>

      {/* Footer note — says out loud that the list is meant to grow. */}
      <p className="mt-14 border-t border-border pt-6 text-[0.6875rem] leading-relaxed text-fg-faint">
        More case studies get added here as I work through new briefs. Each one is a
        self-contained deck with a working prototype, written to be read in one sitting.
      </p>
    </div>
  );
}

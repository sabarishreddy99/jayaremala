import AvocadoMark from "@/components/portfolio/AvocadoMark";
import ScrollReveal from "@/components/ui/ScrollReveal";

/**
 * Shared inner-content constraint. Lives here rather than in page.tsx because
 * Chapter and the homepage both need it.
 */
export function Inner({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    // The wider right padding at xl reserves a lane for SectionIndicator,
    // which is `fixed right-7` and appears at exactly this breakpoint. Between
    // ~1280 and ~1344 the max-w-7xl container fills the viewport, so a plain
    // px-8 left the content edge 32px in and the rail's dots 28px in — the
    // rail sat on top of the text. Above ~1360 the container is centred and
    // the gutter is already wide enough, so this padding has no visible effect
    // there.
    <div
      className={`mx-auto w-full max-w-6xl xl:max-w-7xl 2xl:max-w-[90rem] px-4 sm:px-6 md:px-8 xl:pl-8 xl:pr-16 ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * A numbered chapter in the homepage narrative.
 *
 * This replaces the old `Chapter` + `StackSection` pairing. The page used to
 * deal seven pinned, z-stacked cards whose inner content scrubbed under a fixed
 * viewport window — an effect that only existed at >=768px, because below that
 * StackSection detached itself entirely and phones fell back to a plain stacked
 * document nobody had designed. This is one continuous column instead, with a
 * single DOM tree and no JS-driven layout branch, so every viewport reads the
 * same story.
 *
 * The chapter's identity is unchanged: the same ghost numeral, the same
 * AvocadoMark bullet, the same mono numeral, the same hairline and deck. Only
 * the geometry moved — from a horizontal band above the content to a rail
 * beside it. The ghost numeral gets promoted in the process: it used to be
 * decoration cropped by an `overflow-hidden` pinned card, and is now the
 * chapter's typographic anchor, set in Garamond at display size.
 *
 * `lg:sticky` on the rail does what the pin used to do — the chapter's identity
 * stays with you while its body scrolls past — but in pure CSS. No matchMedia,
 * no ResizeObserver, no spacer element, no scroll handler, and it degrades to a
 * normal stacked block below `lg` on its own.
 *
 * StackSection itself is untouched and still used by gradeVITian's GVHome.
 */
export default function Chapter({
  n,
  label,
  deck,
  place,
  year,
  measure,
  id,
  rail = true,
  className = "",
  nextHref,
  nextLabel,
  children,
}: {
  n: string;
  label: string;
  /** One line of scent: what this chapter argues. */
  deck?: string;
  /**
   * Field-notes dateline. A chapter that records a real deployment names the
   * place and the year it shipped, the way a field note is filed. Chapters
   * that argue rather than record leave it unset and read exactly as before.
   */
  place?: string;
  year?: string;
  /** The measurement that site cost or produced. Machine voice, so mono. */
  measure?: string;
  id: string;
  /**
   * `false` drops the two-column grid so the body spans the full measure.
   * Used by chapters whose content is already a full-width composition
   * (the testimonials carousel, the contact form).
   */
  rail?: boolean;
  className?: string;
  nextHref?: string;
  nextLabel?: string;
  children: React.ReactNode;
}) {
  const header = (
    <header
      className={
        rail
          ? "chapter-rail relative lg:sticky lg:self-start"
          : // No `chapter-rail` here. That class exists only to give the
            // STICKY rail its top offset, and `top` displaces a relatively
            // positioned box just as readily as a sticky one — on the
            // non-rail chapters it pushed the whole heading 78px down out of
            // flow, opening dead space above it and closing the gap below.
            "relative"
      }
    >
      {/* The chapter's typographic anchor. Sits behind the label, bleeding
          slightly out of the rail so it reads as a printed folio rather than
          a UI element. */}
      <span
        aria-hidden
        className="chapter-ghost pointer-events-none absolute -top-6 -left-2 select-none text-fg/[0.05] dark:text-fg/[0.06]"
        style={{ fontSize: "clamp(4rem, 8vw, 8.5rem)" }}
      >
        {n}
      </span>

      {/* The mono numeral that used to sit here printed the same number as the
          ghost numeral it was physically sitting on top of, and it put a third
          line above every heading. The ghost carries the count; the dateline
          below carries the filing. The mark stays as the rail's bullet. */}
      <div className="relative flex items-baseline gap-3">
        <AvocadoMark className="chapter-avo h-[15px] w-[15px] translate-y-[2px] shrink-0" />
        {/* While the header is a full-width band the hairline fills the
            leftover measure, the way it did in the old horizontal header.
            For a rail chapter that stops at lg, where the header becomes a
            narrow column and the rule below takes over the job. A non-rail
            chapter is a band at every width, so it keeps the hairline. */}
        <div
          className={`h-px flex-1 bg-linear-to-r from-border to-transparent ${
            rail ? "lg:hidden" : ""
          }`}
          aria-hidden
        />
      </div>

      {place && (
        <p className="relative mt-2 flex flex-wrap items-baseline gap-x-2 font-mono text-[11px] uppercase tracking-[0.16em] text-fg-subtle">
          <span className="text-fg-muted">{place}</span>
          {year && (
            <>
              <span className="text-fg-faint" aria-hidden>/</span>
              <span className="tabular-nums">{year}</span>
            </>
          )}
        </p>
      )}

      <h2 className={`display-serif display-md relative text-fg ${place ? "mt-1.5" : "mt-2"}`}>{label}</h2>

      <div className="chapter-rule ink-rule mt-4 lg:mt-5" aria-hidden />

      {deck && (
        <p className="relative mt-4 max-w-[46ch] text-sm leading-relaxed text-fg-subtle text-pretty">
          {deck}
        </p>
      )}

      {/* What the site cost or produced — the machine reporting, so mono. */}
      {measure && (
        <p className="relative mt-4 border-t border-border-subtle pt-3 font-mono text-[11px] leading-relaxed text-fg-subtle">
          {measure}
        </p>
      )}
    </header>
  );

  return (
    <section id={id} className={`chapter relative ${className}`}>
      <Inner className="pt-14 pb-10 sm:pt-16 sm:pb-12 md:pt-20 md:pb-14 lg:pt-24 lg:pb-16 xl:pt-28 xl:pb-20">
        {rail ? (
          <div
            className="grid gap-8 md:gap-10
                       lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-14
                       xl:grid-cols-[15rem_minmax(0,1fr)] xl:gap-20
                       2xl:grid-cols-[17rem_minmax(0,1fr)]"
          >
            <ScrollReveal direction="right">{header}</ScrollReveal>
            <div className="min-w-0">{children}</div>
          </div>
        ) : (
          <>
            <ScrollReveal direction="right">
              <div className="mb-10 md:mb-12 max-w-3xl">{header}</div>
            </ScrollReveal>
            <div className="min-w-0">{children}</div>
          </>
        )}

        {nextHref && (
          <div className="mt-10 flex items-center justify-end border-t border-border pt-4">
            <a
              href={nextHref}
              className="group -mr-3 inline-flex items-center gap-1.5 rounded-chip px-3 py-2.5 text-[11px] text-fg-faint transition-colors hover:text-fg"
            >
              {nextLabel}
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="transition-transform duration-200 group-hover:translate-y-0.5"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </a>
          </div>
        )}
      </Inner>
    </section>
  );
}

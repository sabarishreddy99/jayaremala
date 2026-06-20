import ScrollReveal from "@/components/ScrollReveal";

// Same editorial display face as the gradeVITian home — Cormorant Garamond — so
// every tool/content page speaks in one calm, premium voice.
const SERIF = "var(--font-cormorant), Georgia, serif";

/** Consistent page header for gradeVITian tool/content pages: a small eyebrow
 *  label, a Cormorant serif display title, and a thin (font-light) lead subtitle —
 *  mirroring the home page's design language. */
export default function GVPageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <ScrollReveal>
      <p className="text-nano font-semibold uppercase tracking-[0.22em] text-accent">{eyebrow}</p>
      <h1
        style={{ fontFamily: SERIF, fontWeight: 600, lineHeight: 1.05, letterSpacing: "0.005em" }}
        className="mt-3 text-balance text-[clamp(2.25rem,6vw,3.25rem)] text-fg"
      >
        {title}
      </h1>
      <p className="mt-4 max-w-xl text-pretty text-lg font-light leading-relaxed text-fg-muted sm:text-xl">
        {subtitle}
      </p>
    </ScrollReveal>
  );
}

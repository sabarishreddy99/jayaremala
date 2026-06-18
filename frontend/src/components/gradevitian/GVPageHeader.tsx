import ScrollReveal from "@/components/ScrollReveal";

/** Consistent page header for gradeVITian tool/content pages: a small eyebrow label,
 *  a Playfair display title (inherited from the base h1 style), and a lead subtitle. */
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
      <p className="text-nano font-semibold uppercase tracking-[0.18em] text-accent">{eyebrow}</p>
      <h1 className="mt-2.5 text-balance text-4xl font-bold tracking-[-0.02em] text-fg sm:text-[2.75rem]">{title}</h1>
      <p className="mt-3.5 max-w-xl text-pretty text-lead leading-relaxed text-fg-muted">{subtitle}</p>
    </ScrollReveal>
  );
}

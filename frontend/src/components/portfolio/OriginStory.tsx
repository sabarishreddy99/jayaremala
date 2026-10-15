import ScrollReveal from "@/components/ui/ScrollReveal";
import { projects } from "@/data/projects";
import type { WhyBlock } from "@/data/profile";

/**
 * The origin chapter — why he builds. Three declarative sentences and a
 * technical conclusion; the emotion is carried by the artifact card's tag list
 * and its attribution line, not by adjectives.
 *
 * (It used to be constrained to one viewport so the pinned StackSection
 * rendered no scrub spacer. The homepage is a continuous scroll now, so the
 * length constraint is gone, but the restraint is still the point.)
 */
export default function OriginStory({ why }: { why: WhyBlock }) {
  const artifact = why.artifact;
  const project = artifact
    ? projects.find((p) => p.title === artifact.projectTitle)
    : undefined;
  const link = project?.sourceLinks?.[0];

  return (
    // Two columns only once there is room for a 56ch measure plus the card.
    // Below that the artifact sits under the story rather than squeezing it.
    // The story column is capped at its reading measure, so on wide screens the
    // artifact column takes the slack instead of leaving a dead gutter.
    <div className="grid gap-8 md:gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,19rem)] lg:gap-14 xl:grid-cols-[minmax(0,1fr)_minmax(0,23rem)] xl:gap-16 2xl:grid-cols-[minmax(0,1fr)_minmax(0,27rem)]">
      {/* ── The story ── */}
      <div className="max-w-[56ch] space-y-5">
        {why.paragraphs.map((p, i) => (
          <ScrollReveal key={i} delay={i * 90} direction="right">
            <p
              className="voice-serif text-fg-muted"
              style={{ fontSize: "clamp(1.0625rem, 1.5vw, 1.25rem)", lineHeight: 1.75 }}
            >
              {p}
            </p>
          </ScrollReveal>
        ))}

        {why.pullQuote && (
          <ScrollReveal delay={why.paragraphs.length * 90} direction="right">
            <p className="hanging-quote voice-serif mt-8 max-w-[62ch] border-l border-border-strong pl-5 text-[15px] leading-relaxed text-fg-subtle">
              {why.pullQuote}
            </p>
          </ScrollReveal>
        )}
      </div>

      {/* ── The artifact ── deliberately plain. Everything else on this page
           animates; the one object that matters most is already there. */}
      {artifact && (
        <aside className="lg:pt-1">
          {/* On tablet this becomes a wide strip rather than a tall narrow card,
              so it reads as an artifact label instead of dead space. */}
          <div className="rounded-panel border border-border bg-surface-sunken p-5 md:grid md:grid-cols-[auto_minmax(0,1fr)] md:gap-x-8 md:gap-y-3 lg:block">
            <div className="md:col-span-2 lg:mb-0">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-fg-faint">
                {artifact.year} · {artifact.projectTitle}
              </p>
            </div>

            <div className="my-4 h-px bg-border md:hidden lg:my-4 lg:block" aria-hidden />

            <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-[11px] text-fg-subtle md:grid-cols-1 lg:grid-cols-2">
              {(project?.tags ?? []).map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>

            <div className="my-4 h-px bg-border md:hidden lg:my-4 lg:block" aria-hidden />

            <p className="text-[13px] leading-relaxed text-fg-muted md:self-center">{artifact.caption}</p>

            {link && (
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1 text-[11px] font-medium text-fg-faint transition-colors hover:text-accent md:col-start-2 md:mt-0 lg:mt-4"
              >
                {link.label} ↗
              </a>
            )}
          </div>

          {/* The business is real and predates the website by six years. Naming
              the owner and the town is what separates this from an anecdote,
              and it appeared nowhere on the homepage before. */}
          {artifact.attribution && (
            <p className="mt-3 px-1 text-[11px] leading-relaxed text-fg-faint">
              {artifact.attribution}
            </p>
          )}
        </aside>
      )}
    </div>
  );
}

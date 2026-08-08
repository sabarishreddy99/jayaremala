import ScrollReveal from "@/components/ScrollReveal";
import { projects } from "@/data/projects";
import type { WhyBlock } from "@/data/profile";

/**
 * Chapter 01 — why he builds. Three declarative sentences and a technical
 * conclusion; the emotion is carried by the artifact card's tag list, not by
 * adjectives. Deliberately short — it must fit the viewport so the pinned
 * section renders no scrub spacer.
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
            <p className="hanging-quote mt-8 border-l-2 border-border-strong pl-5 text-[15px] leading-relaxed text-fg-subtle">
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
          <div className="rounded-panel border border-border bg-surface-sunken p-5 md:flex md:items-center md:gap-8 lg:block">
            <div className="md:shrink-0 lg:mb-0">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-fg-faint">
                {artifact.year} · {artifact.projectTitle}
              </p>
            </div>

            <div className="my-4 h-px bg-border md:my-0 md:h-10 md:w-px lg:my-4 lg:h-px lg:w-auto" aria-hidden />

            <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-[11px] text-fg-subtle md:flex md:flex-wrap md:gap-x-4 lg:grid lg:grid-cols-2">
              {(project?.tags ?? []).map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>

            <div className="my-4 h-px bg-border md:my-0 md:h-10 md:w-px lg:my-4 lg:h-px lg:w-auto" aria-hidden />

            <p className="text-[13px] leading-relaxed text-fg-muted md:flex-1">{artifact.caption}</p>

            {link && (
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1 text-[11px] font-medium text-fg-faint transition-colors hover:text-accent md:mt-0 md:shrink-0 lg:mt-4"
              >
                {link.label} ↗
              </a>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}

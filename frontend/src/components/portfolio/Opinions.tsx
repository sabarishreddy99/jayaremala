import type { Opinion, OpinionsBlock } from "@/data/profile";

/**
 * The stances chapter: what the work is for, and what it refuses to do.
 *
 * This is the hinge in the narrative — it turns the page from a record of what
 * got shipped into an argument about how it gets built. It is also the one
 * section written in the second person of a job interview, which is why the
 * evidence matters: every `line` in profile.json is quoted from something
 * already built (the origin story, the hope-molecules creed, the VRF Bricks
 * rebuild, the Tailorbird agent design), never authored as a slogan.
 *
 * The "won't do" column strikes the TERM only, never the explanation. Striking
 * a whole sentence costs more legibility than the tone is worth, and screen
 * readers handle long struck passages badly.
 */
function Column({
  heading,
  items,
  tone,
}: {
  heading: string;
  items: Opinion[];
  tone: "for" | "against";
}) {
  const isFor = tone === "for";
  // Two printed panels: "for" on Skin, "won't" on paper. Text inherits the
  // panel's ink and steps down by opacity, so the same markup reads on both.
  return (
    <div data-face={isFor ? "skin" : "paper"} className="stance-panel min-w-0 rounded-card p-6 sm:p-8">
      <div className="mb-6 flex items-center gap-2.5">
        <span
          aria-hidden
          className={`h-2 w-2 shrink-0 rounded-full ${isFor ? "bg-[var(--flesh)]" : "bg-[var(--pit)]"}`}
        />
        <h3 className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] opacity-75">
          {heading}
        </h3>
      </div>

      <ul className="space-y-6 sm:space-y-7">
        {items.map((o) => (
          <li key={o.term} className="min-w-0">
            <p
              className={`display-serif text-[1.35rem] leading-snug sm:text-[1.5rem] ${
                isFor ? "stance-term" : "opinion-against"
              }`}
            >
              {o.term}
            </p>
            <p className="voice-serif mt-1.5 max-w-[46ch] text-[0.9375rem] leading-relaxed opacity-80">
              {o.line}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Opinions({ data }: { data: OpinionsBlock }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 md:gap-5">
      <Column heading={data.forLabel} items={data.for} tone="for" />
      <Column heading={data.againstLabel} items={data.against} tone="against" />
    </div>
  );
}

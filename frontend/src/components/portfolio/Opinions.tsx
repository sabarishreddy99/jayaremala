import type { Opinion, OpinionsBlock } from "@/data/profile";

/**
 * "How I work": the principles the work is executed by, and the don'ts that
 * keep them honest.
 *
 * This is the hinge in the narrative — it turns the page from a record of what
 * got shipped into an argument about how it gets built. Where a principle has
 * evidence, the `line` in profile.json points at something already shipped
 * (the origin story, the VRF Bricks rebuild, the Tailorbird agent design).
 *
 * Principles are numbered on the Skin panel; each don't is set as "Don't …"
 * behind a pit cross on the paper panel. Nothing is struck through: a struck
 * sentence costs legibility, and screen readers handle it badly.
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
  // Two printed panels laid a little off square, like the rest of the desk.
  // Text inherits the panel's ink and steps down by opacity.
  return (
    <div
      data-face={isFor ? "skin" : "paper"}
      style={{ "--tilt": isFor ? "-0.8deg" : "0.9deg" } as React.CSSProperties}
      className="stance-panel min-w-0 rounded-card p-6 sm:p-8"
    >
      <div className="mb-6 flex items-center gap-2.5">
        <span
          aria-hidden
          className={`h-2 w-2 shrink-0 rounded-full ${isFor ? "bg-[var(--flesh)]" : "bg-[var(--pit)]"}`}
        />
        <h3 className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] opacity-75">
          {heading}
        </h3>
      </div>

      <ol className="space-y-6 sm:space-y-7">
        {items.map((o, i) => (
          <li key={o.term} className="flex min-w-0 gap-4">
            {isFor ? (
              <span aria-hidden className="stance-term w-6 shrink-0 pt-1.5 font-mono text-[0.6875rem] tabular-nums opacity-80">
                {String(i + 1).padStart(2, "0")}
              </span>
            ) : (
              <span aria-hidden className="mt-1.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--pit)] text-[#f4f2e6]">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </span>
            )}
            <div className="min-w-0">
              <p className={`display-serif text-[1.35rem] leading-snug sm:text-[1.5rem] ${isFor ? "stance-term" : ""}`}>
                {!isFor && <span className="opacity-55">Don&rsquo;t </span>}
                {isFor ? o.term : o.term.charAt(0).toLowerCase() + o.term.slice(1)}
              </p>
              <p className="voice-serif mt-1.5 max-w-[46ch] text-[0.9375rem] leading-relaxed opacity-80">
                {o.line}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function Opinions({ data }: { data: OpinionsBlock }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 md:gap-7">
      <Column heading={data.forLabel} items={data.for} tone="for" />
      <Column heading={data.againstLabel} items={data.against} tone="against" />
    </div>
  );
}

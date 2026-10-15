import Link from "next/link";
import type { ReactNode } from "react";

/** The same three printed faces and tilts the home note pile and the chat
 *  prompt deck use, so writing looks like one set of cards across the site. */
export const NOTE_FACES = ["paper", "skin", "flesh"] as const;
export const NOTE_TILTS = [-1.6, 1.2, -0.8, 1.8, -1.2, 0.9];

/** "2026-06-08" → "Jun 8, 2026"; anything unparseable is returned as is. */
export function formatNoteDate(iso: string) {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

interface Props {
  href: string;
  /** Position in the list: picks the face and the tilt. */
  index: number;
  eyebrow: ReactNode;
  title: string;
  description: string;
  tags: string[];
  image?: string;
  /** Top-right of the cover band, e.g. a reading time or lab status. */
  badge?: ReactNode;
  /** Bottom row. Interactive children need `relative z-10` to sit above the card link. */
  footer?: ReactNode;
}

/**
 * One note from the pile, laid flat on the desk: a tilted printed card that
 * straightens and lifts on hover. Used by the blog and lab indexes.
 *
 * The title link stretches over the whole card, so the card is one big tap
 * target without nesting buttons (share, etc.) inside an anchor.
 */
export default function NoteTile({ href, index, eyebrow, title, description, tags, image, badge, footer }: Props) {
  return (
    <article
      data-face={NOTE_FACES[index % NOTE_FACES.length]}
      style={{ "--tilt": `${NOTE_TILTS[index % NOTE_TILTS.length]}deg` } as React.CSSProperties}
      className="note-card note-tile group relative flex h-full w-full flex-col overflow-hidden rounded-card"
    >
      <div className="relative shrink-0">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" loading="lazy" className="h-40 w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03] sm:h-44" />
        ) : (
          <div aria-hidden className="note-band flex h-24 items-end px-6 pb-3 sm:px-7">
            <span className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] opacity-70">
              {tags.slice(0, 2).map((t) => `#${t}`).join("  ")}
            </span>
          </div>
        )}
        {badge && <div className="absolute right-3 top-3">{badge}</div>}
      </div>

      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] opacity-75">{eyebrow}</p>
        <h2 className="display-serif mt-3 text-[1.6rem] leading-[1.12]">
          <Link
            href={href}
            className="outline-none after:absolute after:inset-0 after:rounded-card after:content-[''] focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-accent"
          >
            {title}
          </Link>
        </h2>
        <p className="mt-3 line-clamp-3 text-[0.9375rem] leading-relaxed opacity-80">{description}</p>
        <span className="flex-1" />
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-current/15 pt-4">
          <span aria-hidden className="note-read inline-flex shrink-0 items-center whitespace-nowrap gap-1.5 text-sm font-semibold underline decoration-current/30 underline-offset-4 transition-colors group-hover:decoration-current">
            Read it
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden
              className="transition-transform duration-300 group-hover:translate-x-0.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </span>
          {footer}
        </div>
      </div>
    </article>
  );
}

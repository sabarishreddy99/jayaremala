import caseStudiesJson from "@/data/knowledge/case-studies.json";

/** A link out of a case study — the deck itself, a prototype, a repo, a doc. */
export interface CaseStudyLink {
  label: string;
  href: string;
  /** Drives the icon and button weight on the index card. */
  kind?: "deck" | "prototype" | "repo" | "external";
}

/**
 * A long-form case study.
 *
 * Unlike blog and lab entries, the body of a case study is NOT MDX — each one
 * is a self-contained HTML deck with its own typography and interactions,
 * served straight out of `frontend/public/case-studies/<slug>/`. This file
 * carries only the metadata the index page needs to list and order them.
 *
 * To add the next one:
 *   1. drop its files in `frontend/public/case-studies/<slug>/`
 *   2. append an entry here in `backend/data/knowledge/case-studies.json`
 *   3. run `npm run sync` from `frontend/`
 * Nothing else — the index page, the nav, the sitemap and Cmd+K all read from
 * this list.
 */
export interface CaseStudy {
  slug: string;
  title: string;
  /** The one-line thesis, usually the deck's own opening headline. */
  headline: string;
  summary: string;
  /** Who it was for, e.g. "Wio Bank · Associate home task, Option 2". */
  context: string;
  /** The prompt in a few words, e.g. "Reducing manual payment investigations". */
  brief?: string;
  role?: string;
  /** Display date, e.g. "October 2026". */
  date: string;
  /** Immutable sort key (ISO). Newest first on the index — set once, never change. */
  publishedAt: string;
  readingTime?: string;
  /** The deck's own act structure, rendered as a numbered outline on the card. */
  sections?: string[];
  tags?: string[];
  cover?: string;
  coverAlt?: string;
  links?: CaseStudyLink[];
  featured?: boolean;
}

/** Newest first. `publishedAt` is the sort key so display dates stay editable. */
export const caseStudies = (caseStudiesJson as CaseStudy[])
  .slice()
  .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

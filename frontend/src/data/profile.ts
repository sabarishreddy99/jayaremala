import profileJson from "@/data/knowledge/profile.json";

export interface Availability {
  open: boolean;
  label: string;
  types: string[];
  locations: string[];
}

export interface HeroStat {
  value: number;
  suffix: string;
  label: string;
  sub: string;
}

export interface NowBlock {
  building: string;
  learning: string;
  reading: string;
  location: string;
  updated: string;
}

/** Hero copy — the voice of the page, kept in data so it can be edited without a deploy. */
export interface HeroCopy {
  headline: string;
  /** The scannable positioning line. The headline is written for voice and
   *  deliberately says "things"; this is the line that answers "what does he
   *  actually do" inside the six seconds a reviewer gives the first screen. */
  discipline?: string;
  /** Where the work happened — the same facts as `previous` and `award`,
   *  trimmed to chip length. Credibility, above the fold. */
  proof?: string[];
  lead: string;
  sub?: string;
  signature?: string;
  avocadoNote?: string;
}

export interface WhyArtifact {
  /** Matches a `Project.title` — the card pulls tags and links from that entry. */
  projectTitle: string;
  year: string;
  caption: string;
  /**
   * Who the business actually belongs to. The origin story is about a real
   * family business, and naming it is the difference between an anecdote and
   * a fact. Kept here rather than parsed out of the apps.json prose.
   */
  attribution?: string;
}

/** Chapter 01 — the origin story. */
export interface WhyBlock {
  label: string;
  paragraphs: string[];
  pullQuote?: string;
  artifact?: WhyArtifact;
}

/** The hero's belief panel. Fills the right column on wide screens and says
 *  why any of the work matters. */
export interface HopeMolecules {
  eyebrow?: string;
  term: string;
  definition: string;
  belief: string;
  closing?: string;
  footnote?: string;
}

/** One stance in the opinions chapter. `term` is the claim, `line` the evidence.
 *  Every line is quoted from work already shipped, never written as a slogan. */
export interface Opinion {
  term: string;
  line: string;
}

/** Chapter 05 — the love/hate block. The hinge between what was shipped and how
 *  it gets built. Kept in data so the stances stay editable via /admin. */
export interface OpinionsBlock {
  label: string;
  deck?: string;
  forLabel: string;
  againstLabel: string;
  for: Opinion[];
  against: Opinion[];
}

/** One row of the "Still running" ledger. */
export interface ShippedThing {
  name: string;
  /** What it does, in plain words. */
  what: string;
  /** Who it serves — the human column. */
  who: string;
  /** ISO date, month granularity (YYYY-MM-01). Drives the live uptime counter. */
  shippedAt: string;
  /** Human-readable fallback, e.g. "since Aug 2020". Shown for archived rows. */
  sinceLabel?: string;
  url: string;
  /** `live` rows tick; `archived` rows show `sinceLabel` and make no uptime claim. */
  status: "live" | "archived";
}

export interface Profile {
  name: string;
  tagline: string;
  bio: string;
  summary: string;
  obsession: string;
  previous: string;
  /** Single recognisable award. Feeds both the hero proof row and the
   *  schema.org Person block, which used to hardcode it. */
  award?: string;
  prev_domain: string;
  interested_domain: string;
  location: string;
  email: string;
  phone: string;
  github: string;
  linkedin: string;
  resume: string;
  booking_url?: string;
  page_experience?: string;
  page_education?: string;
  page_projects?: string;
  contact_description?: string;
  page_blog?: string;
  page_case_studies?: string;
  page_lab?: string;
  page_gallery?: string;
  page_quotes?: string;
  currently?: string;
  now?: NowBlock;
  availability?: Availability;
  heroStats?: HeroStat[];
  /** Label above the hero-stats band in the projects chapter. */
  heroStatsLabel?: string;
  hero?: HeroCopy;
  hopeMolecules?: HopeMolecules;
  why?: WhyBlock;
  opinions?: OpinionsBlock;
  shipped?: ShippedThing[];
  shippedLabel?: string;
  shippedNote?: string;
}

export const profile = profileJson as Profile;

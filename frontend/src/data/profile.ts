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
  shipped?: ShippedThing[];
  shippedLabel?: string;
  shippedNote?: string;
}

export const profile = profileJson as Profile;

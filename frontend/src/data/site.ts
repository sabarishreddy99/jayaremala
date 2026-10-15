import siteJson from "./knowledge/site.json";

/** One page of the site, as the admin's "Site copy" editor describes it. */
export interface SitePage {
  href: string;
  label: string;
  group: string;
  desc: string;
  /** What is on the page, in a sentence. Avocado reads this to point people there. */
  about?: string;
}

/** Copy for one home-page chapter. Missing keys fall back to the data block it belongs to. */
export interface ChapterCopy {
  label?: string;
  deck?: string;
  place?: string;
  year?: string;
  /** Label on the "next chapter" link at the foot of the chapter. */
  next?: string;
}

interface SiteData {
  url: string;
  pages: SitePage[];
  home: { chapters: Record<string, ChapterCopy> };
}

export const site = siteJson as SiteData;

const byHref = new Map(site.pages.map((p) => [p.href, p]));

/** Page copy by href — the menu, footer and page map read names from here. */
export function sitePage(href: string): SitePage | undefined {
  return byHref.get(href);
}

/** Home chapter copy by chapter id ("projects", "testimonials", …). */
export function chapter(id: string): ChapterCopy {
  return site.home?.chapters?.[id] ?? {};
}

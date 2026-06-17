/**
 * Search/index types + scoring. The actual page list is the single source of truth in
 * `src/data/gradevitian/pages.json`, consumed BOTH here (search) and by
 * `scripts/gen-gv-sitemap.mjs` (subdomain sitemap). Add a page there once and it's
 * searchable AND in the sitemap — no second list to maintain.
 */
import pagesData from "@/data/gradevitian/pages.json";

export type GVCategory = "Calculator" | "Account" | "Info" | "Page";

export interface GVSearchItem {
  title: string;
  description: string;
  href: string; // clean path (the mount-aware prefix is applied at navigation time)
  category: GVCategory;
  keywords?: string[];
  /** Only show when logged in / logged out, respectively. */
  auth?: "in" | "out";
}

export const GV_PAGES: GVSearchItem[] = pagesData as GVSearchItem[];

/** Token-AND scoring: all query words must match somewhere; title/keyword hits rank higher. */
export function searchGV(query: string, items: GVSearchItem[]): GVSearchItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  const tokens = q.split(/\s+/);

  return items
    .map((it) => {
      const title = it.title.toLowerCase();
      const kw = (it.keywords ?? []).join(" ").toLowerCase();
      const hay = `${title} ${it.description.toLowerCase()} ${kw} ${it.category.toLowerCase()}`;
      let score = 0;
      for (const t of tokens) {
        if (!hay.includes(t)) return { it, score: -1 };
        if (title.startsWith(t)) score += 6;
        if (title.includes(t)) score += 4;
        if (kw.includes(t)) score += 3;
        if (it.description.toLowerCase().includes(t)) score += 1;
      }
      return { it, score };
    })
    .filter((s) => s.score >= 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.it);
}

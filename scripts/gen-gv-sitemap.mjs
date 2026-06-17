#!/usr/bin/env node
/**
 * Generates the gradeVITian subdomain sitemap from the single page list in
 * frontend/src/data/gradevitian/pages.json (the same source the search modal uses).
 * Output: frontend/public/gradevitian/sitemap.xml — served at the subdomain root by
 * nginx. Run automatically via the frontend prebuild/predev hooks.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pagesPath = resolve(root, "frontend/src/data/gradevitian/pages.json");
const outPath = resolve(root, "frontend/public/gradevitian/sitemap.xml");
const BASE = "https://gradevitian.jayaremala.com";

const pages = JSON.parse(readFileSync(pagesPath, "utf8"));

const seen = new Set();
const entries = [];
for (const p of pages) {
  if (p.auth === "in") continue;        // private pages aren't indexed (e.g. /account)
  if (seen.has(p.href)) continue;       // dedupe shared hrefs (e.g. Weightage → /grade-predictor)
  seen.add(p.href);

  const loc = p.href === "/" ? `${BASE}/` : `${BASE}${p.href}/`; // trailingSlash: true
  let priority = 0.5;
  let changefreq = "yearly";
  if (p.href === "/") { priority = 1.0; changefreq = "weekly"; }
  else if (p.category === "Calculator") { priority = 0.9; changefreq = "monthly"; }
  else if (p.href === "/feedback") { priority = 0.5; changefreq = "monthly"; }

  entries.push({ loc, priority, changefreq });
}

const body = entries
  .map((e) => `  <url>\n    <loc>${e.loc}</loc>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority.toFixed(1)}</priority>\n  </url>`)
  .join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;

writeFileSync(outPath, xml);
console.log(`gv-sitemap: wrote ${entries.length} URLs → frontend/public/gradevitian/sitemap.xml`);

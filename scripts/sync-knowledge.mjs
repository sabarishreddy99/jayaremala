#!/usr/bin/env node
// Syncs backend/data/knowledge/ → frontend/src/data/knowledge/
// Converts MDX blog posts → backend/data/knowledge/blog.json
// Converts MDX lab entries → backend/data/knowledge/lab.json
//
// Run:  node scripts/sync-knowledge.mjs   (from repo root)
//       npm run sync                       (from frontend/)

import { readFileSync, writeFileSync, readdirSync, copyFileSync, mkdirSync, existsSync } from "fs";
import { join, basename, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKEND_KNOWLEDGE = join(__dirname, "../backend/data/knowledge");
const FRONTEND_KNOWLEDGE = join(__dirname, "../frontend/src/data/knowledge");
const BLOG_DIR = join(__dirname, "../frontend/src/content/blog");
const LAB_DIR  = join(__dirname, "../frontend/src/content/lab");

mkdirSync(FRONTEND_KNOWLEDGE, { recursive: true });

// ── Shared helpers ─────────────────────────────────────────────────────────────

function parseFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return { meta: {}, body: content };
  const meta = {};
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i === -1) continue;
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim();
    if (val.startsWith("[") && val.endsWith("]")) {
      val = val.slice(1, -1).split(",").map(s => s.trim().replace(/^['"]|['"]$/g, ""));
    } else {
      val = val.replace(/^['"]|['"]$/g, "");
    }
    meta[key] = val;
  }
  return { meta, body: m[2] };
}

// MDX → plain text for Avocado's knowledge base and the MCP get_blog/get_lab
// tools. Keeps everything a reader could learn from: headings stay as "## "
// lines (ingest splits sections on them), text inside components such as
// <Callout> survives, image captions become "[Image: …]", tables become
// "a · b · c" rows, and plain-text diagrams are kept. Only real source code is
// reduced to a one-line marker. Nothing is truncated — ingest chunks it.
const TEXT_FENCES = new Set(["", "text", "txt", "plaintext", "ascii", "diagram", "arch", "mermaid"]);

function stripMdx(text) {
  return text
    .replace(/```([\w+-]*)[^\n]*\n([\s\S]*?)```/g, (_, lang, body) =>
      TEXT_FENCES.has(lang.toLowerCase()) ? `\n${body.trim()}\n` : `\n[${lang} code example]\n`)
    .replace(/<[A-Z]\w*\b[^>]*?\b(?:caption|alt)="([^"]+)"[^>]*\/>/g, "[Image: $1]") // captioned components
    .replace(/<\/?[A-Z]\w*\b[^>]*>/g, "")         // other component tags — keep their inner text
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, (_, alt) => (alt ? `[Image: ${alt}]` : ""))
    .replace(/^\s*\|?\s*:?-{3,}.*$/gm, "")         // table separator rows
    .replace(/^\|(.*)\|\s*$/gm, (_, row) => row.split("|").map((c) => c.trim()).filter(Boolean).join(" · "))
    .replace(/^-{3,}$/gm, "")                      // horizontal rules
    .replace(/^(#{1,6})\s+/gm, "## ")              // normalise headings to "## "
    .replace(/\*\*(.*?)\*\*/g, "$1")               // bold
    .replace(/(^|[^*])\*(?!\s)(.*?)\*/g, "$1$2")   // italic
    .replace(/`([^`]*)`/g, "$1")                   // inline code — keep the words
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")       // links
    .replace(/^>\s?/gm, "")                        // blockquotes
    .replace(/^\s*[-*+]\s+/gm, "- ")               // bullets
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ── 1. Generate blog.json from MDX posts ──────────────────────────────────────

const mdxBlogFiles = readdirSync(BLOG_DIR)
  .filter(f => f.endsWith(".mdx") && !f.toUpperCase().startsWith("BLOG"));

const posts = [];
for (const file of mdxBlogFiles) {
  const slug = basename(file, ".mdx");
  const raw = readFileSync(join(BLOG_DIR, file), "utf8");
  const { meta, body } = parseFrontmatter(raw);
  posts.push({
    slug,
    title:       meta.title || slug,
    date:        meta.date || "",
    description: meta.description || "",
    tags:        Array.isArray(meta.tags) ? meta.tags : [],
    content:     stripMdx(body),
  });
}

writeFileSync(join(BACKEND_KNOWLEDGE, "blog.json"), JSON.stringify(posts, null, 2));
console.log(`sync: generated blog.json (${posts.length} post(s))`);

// ── 2. Generate lab.json from MDX lab entries ──────────────────────────────────

const labEntries = [];
if (existsSync(LAB_DIR)) {
  const mdxLabFiles = readdirSync(LAB_DIR).filter(f => f.endsWith(".mdx"));
  for (const file of mdxLabFiles) {
    const slug = basename(file, ".mdx");
    const raw = readFileSync(join(LAB_DIR, file), "utf8");
    const { meta, body } = parseFrontmatter(raw);
    labEntries.push({
      slug,
      title:       meta.title || slug,
      status:      meta.status || "active",
      description: meta.description || "",
      startedAt:   meta.startedAt || "",
      updatedAt:   meta.updatedAt || "",
      tech:        Array.isArray(meta.tech) ? meta.tech : [],
      content:     stripMdx(body),
    });
  }
}

writeFileSync(join(BACKEND_KNOWLEDGE, "lab.json"), JSON.stringify(labEntries, null, 2));
console.log(`sync: generated lab.json (${labEntries.length} entr${labEntries.length === 1 ? "y" : "ies"})`);

// ── 2a. Index of what exists as MDX ──────────────────────────────────────────
// The backend rewrites blog.json / lab.json from its database (which also holds
// live-created posts), so it cannot tell from them which entries have a file in
// the repo. This list can: an entry with an MDX file is repo-owned — its page
// renders the file — so the backend syncs it from MDX and refuses live edits.
writeFileSync(
  join(BACKEND_KNOWLEDGE, "mdx-index.json"),
  JSON.stringify({ blog: posts.map((p) => p.slug), lab: labEntries.map((e) => e.slug) }, null, 2),
);
console.log("sync: generated mdx-index.json");

// ── 2b. Extract case-study deck text → case-study-text.json ──────────────────
// Case studies are self-contained HTML decks in frontend/public/, which the
// backend image does not ship. Their readable text is pulled out here (scripts
// and styles dropped, slide headings kept as "## " lines) so Avocado and MCP can
// answer from the whole study, not just its card. Generated — do not edit.
const PUBLIC_DIR = join(__dirname, "../frontend/public");
const decodeEntities = (t) => t
  .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"').replace(/&#39;|&rsquo;|&lsquo;/g, "'").replace(/&ldquo;|&rdquo;/g, '"')
  .replace(/&mdash;/g, "—").replace(/&ndash;/g, "–").replace(/&middot;/g, "·").replace(/&hellip;/g, "…")
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
function htmlToText(html) {
  return decodeEntities(
    html
      .replace(/<(script|style|svg|noscript)[\s\S]*?<\/\1>/gi, "")
      .replace(/<h[1-3][^>]*>/gi, "\n## ")
      .replace(/<\/(h[1-6]|p|li|div|section|tr|blockquote)>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
const caseStudiesPath = join(BACKEND_KNOWLEDGE, "case-studies.json");
const caseText = [];
if (existsSync(caseStudiesPath)) {
  for (const cs of JSON.parse(readFileSync(caseStudiesPath, "utf8"))) {
    const deck = (cs.links || []).find((l) => l.kind === "deck" && l.href?.startsWith("/"));
    const file = deck && join(PUBLIC_DIR, deck.href.replace(/^\//, ""));
    if (file && existsSync(file)) {
      caseText.push({ slug: cs.slug, title: cs.title, text: htmlToText(readFileSync(file, "utf8")) });
    }
  }
}
writeFileSync(join(BACKEND_KNOWLEDGE, "case-study-text.json"), JSON.stringify(caseText, null, 2));
console.log(`sync: generated case-study-text.json (${caseText.length} deck(s))`);

// ── 3. Copy all JSON files from backend → frontend ────────────────────────────

const jsonFiles = readdirSync(BACKEND_KNOWLEDGE).filter(f => f.endsWith(".json"));
for (const file of jsonFiles) {
  // Validate before overwriting the frontend copy: an empty or malformed source
  // JSON must fail the sync loudly, not silently ship a broken file that breaks
  // the Next build (Turbopack can't import invalid JSON). See quotes.json regression.
  const content = readFileSync(join(BACKEND_KNOWLEDGE, file), "utf8");
  if (!content.trim()) {
    throw new Error(`sync: backend/data/knowledge/${file} is empty — refusing to overwrite frontend copy`);
  }
  try {
    JSON.parse(content);
  } catch (err) {
    throw new Error(`sync: backend/data/knowledge/${file} is not valid JSON — ${err.message}`);
  }
  // The frontend only reads titles/slugs/counts from blog.json and lab.json;
  // the full bodies are for Avocado and MCP, so they stay out of the bundle.
  if (file === "case-study-text.json" || file === "mdx-index.json") continue; // backend-only
  if (file === "blog.json" || file === "lab.json") {
    const lean = JSON.parse(content).map(({ content: _body, ...meta }) => meta);
    writeFileSync(join(FRONTEND_KNOWLEDGE, file), JSON.stringify(lean, null, 2));
    continue;
  }
  writeFileSync(join(FRONTEND_KNOWLEDGE, file), content);
}
console.log(`sync: copied ${jsonFiles.length} JSON file(s) → frontend/src/data/knowledge/`);

// ── 4. Copy curated gradeVITian regulations (structured rules only) ───────────
// regulation_chunks.json is server-only (assistant retrieval) and is intentionally
// NOT shipped to the frontend bundle.
const GV_BACKEND = join(__dirname, "../backend/data/gradevitian");
const GV_FRONTEND = join(__dirname, "../frontend/src/data/gradevitian");
const GV_REGS = "regulations.json";
if (existsSync(join(GV_BACKEND, GV_REGS))) {
  mkdirSync(GV_FRONTEND, { recursive: true });
  copyFileSync(join(GV_BACKEND, GV_REGS), join(GV_FRONTEND, GV_REGS));
  console.log(`sync: copied ${GV_REGS} → frontend/src/data/gradevitian/`);
}

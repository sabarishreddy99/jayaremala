#!/usr/bin/env node
// Syncs backend/data/knowledge/ → frontend/src/data/knowledge/
// Also converts MDX blog posts → backend/data/knowledge/blog.json (and copies to frontend)
//
// Run:  node scripts/sync-knowledge.mjs   (from repo root)
//       npm run sync                       (from frontend/)

import { readFileSync, writeFileSync, readdirSync, copyFileSync, mkdirSync } from "fs";
import { join, basename, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKEND_KNOWLEDGE = join(__dirname, "../backend/data/knowledge");
const FRONTEND_KNOWLEDGE = join(__dirname, "../frontend/src/data/knowledge");
const BLOG_DIR = join(__dirname, "../frontend/src/content/blog");

mkdirSync(FRONTEND_KNOWLEDGE, { recursive: true });

// ── 1. Generate blog.json from MDX posts ──────────────────────────────────────

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

function stripMdx(text) {
  return text
    .replace(/<[A-Z][^>]*>[\s\S]*?<\/[A-Z][^>]*>/g, "")
    .replace(/<[A-Z][^/]*\/>/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^[>*-]\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const mdxFiles = readdirSync(BLOG_DIR)
  .filter(f => f.endsWith(".mdx") && !f.toUpperCase().startsWith("BLOG"));

const posts = [];
for (const file of mdxFiles) {
  const slug = basename(file, ".mdx");
  const raw = readFileSync(join(BLOG_DIR, file), "utf8");
  const { meta, body } = parseFrontmatter(raw);
  posts.push({
    slug,
    title: meta.title || slug,
    date: meta.date || "",
    description: meta.description || "",
    tags: Array.isArray(meta.tags) ? meta.tags : [],
    content: stripMdx(body).slice(0, 2000),
  });
}

const blogJson = JSON.stringify(posts, null, 2);
writeFileSync(join(BACKEND_KNOWLEDGE, "blog.json"), blogJson);
console.log(`sync: generated blog.json (${posts.length} post(s))`);

// ── 2. Copy all JSON files from backend → frontend ────────────────────────────

const jsonFiles = readdirSync(BACKEND_KNOWLEDGE).filter(f => f.endsWith(".json"));
for (const file of jsonFiles) {
  copyFileSync(join(BACKEND_KNOWLEDGE, file), join(FRONTEND_KNOWLEDGE, file));
}
console.log(`sync: copied ${jsonFiles.length} JSON file(s) → frontend/src/data/knowledge/`);

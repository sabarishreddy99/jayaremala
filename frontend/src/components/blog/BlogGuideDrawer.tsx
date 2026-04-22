"use client";

import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api/client";

interface PeriodSiteStats {
  total_responses: number;
  unique_visitors: number;
}

interface PeriodBlogStats {
  total_claps: number;
  total_views: number;
  posts: { slug: string; views: number; claps: number }[];
}

interface Overview {
  site: Record<string, PeriodSiteStats>;
  blog: Record<string, PeriodBlogStats>;
}

const SECTIONS = [
  {
    heading: "New post frontmatter",
    code: `---
title: Your Title
date: "2026-04-21"
publishedAt: "2026-04-21"
description: One-line summary shown on index.
tags: [tag1, tag2]
---`,
    note: "publishedAt = immutable publish date used for sort order. date = display date (update freely). Filename becomes the URL slug: my-post.mdx → /blog/my-post",
  },
  {
    heading: "Headings",
    code: `## Section      ← large, border below
### Sub-section ← medium, no border
#### Label      ← uppercase small caps`,
  },
  {
    heading: "Text formatting",
    code: `**bold**        *italic*
\`inline code\`   ~~strikethrough~~

> blockquote pull quote

<Divider />   ← decorative section break`,
  },
  {
    heading: "Links & lists",
    code: `[link text](https://example.com)
[internal](/blog/my-post)

- bullet item
- another item
  - nested item

1. numbered item
2. second item`,
  },
  {
    heading: "Images",
    code: `<!-- basic -->
![alt text](/blog/file.jpg)

<!-- with caption -->
![alt text](/blog/file.jpg "Caption text")

<!-- component -->
<BlogImage
  src="/blog/file.jpg"
  alt="description"
  caption="optional caption"
/>`,
    note: "Put image files in frontend/public/blog/",
  },
  {
    heading: "Callout boxes",
    code: `<Callout type="info" title="Title">text</Callout>
<Callout type="tip" title="Title">text</Callout>
<Callout type="warning" title="Title">text</Callout>
<Callout type="quote" title="Title">text</Callout>`,
    note: "All MDX components (Callout, BlogImage, Divider) are auto-imported — no import statement needed.",
  },
  {
    heading: "Code blocks",
    code: "```python\ndef hello(): return 'hi'\n```\n\nSupported: python typescript javascript\nbash json yaml sql go rust",
  },
  {
    heading: "Table",
    code: `| Col A | Col B |
|---|---|
| val   | val   |`,
  },
];

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

export default function BlogGuideDrawer() {
  const [open, setOpen] = useState(false);
  const [overview, setOverview] = useState<Overview | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/stats/overview`).then(r => r.json()).then(setOverview).catch(() => {});
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen(true)}
        title="Blog writing guide"
        className="fixed bottom-6 right-5 z-40 flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white/80 backdrop-blur px-3 py-1.5 text-[10px] font-semibold text-zinc-300 shadow-sm hover:text-indigo-500 hover:border-indigo-200 transition-all duration-300 select-none"
      >
        <span className="text-[11px]">✦</span>
        <span className="hidden sm:inline">Guide</span>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-white shadow-2xl border-l border-zinc-200 flex flex-col transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Reference</p>
            <h2 className="text-sm font-bold text-zinc-950 mt-0.5">Blog Writing Guide</h2>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-7 h-7 flex items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {SECTIONS.map((s) => (
            <div key={s.heading}>
              <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 mb-2">{s.heading}</p>
              {s.note && (
                <p className="text-[11px] text-zinc-400 mb-1.5 italic">{s.note}</p>
              )}
              <pre className="bg-zinc-950 text-zinc-300 text-[11px] leading-relaxed rounded-xl p-3.5 overflow-x-auto font-mono whitespace-pre-wrap break-words">
                {s.code}
              </pre>
            </div>
          ))}

          {/* Appendix — Project Maintenance */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 space-y-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">Appendix</p>
              <h3 className="text-sm font-bold text-zinc-950">Project Maintenance</h3>
              <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">Everything you need to keep the site up to date — data, blog posts, and deployments.</p>
            </div>

            {/* Live Stats Dashboard */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Live Stats</span>
                <div className="flex-1 h-px bg-zinc-100" />
                {overview && <span className="text-[9px] text-emerald-400 uppercase tracking-widest font-semibold">● live</span>}
              </div>

              {!overview ? (
                <p className="text-[10px] text-zinc-300 italic">Fetching stats…</p>
              ) : (
                <>
                  {/* Period table — site + blog metrics */}
                  <table className="w-full text-[10px] border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-100">
                        <th className="text-left py-1.5 text-zinc-400 font-semibold w-[40%]">Metric</th>
                        <th className="text-right py-1.5 text-zinc-300 font-semibold">7d</th>
                        <th className="text-right py-1.5 text-zinc-300 font-semibold">30d</th>
                        <th className="text-right py-1.5 text-zinc-300 font-semibold">1y</th>
                        <th className="text-right py-1.5 text-zinc-500 font-semibold">All</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {[
                        {
                          label: "Unique visitors",
                          values: (["week","month","year","all"] as const).map(p => fmt(overview.site[p].unique_visitors)),
                        },
                        {
                          label: "Avocado responses",
                          values: (["week","month","year","all"] as const).map(p => fmt(overview.site[p].total_responses)),
                        },
                        {
                          label: "Blog views",
                          values: (["week","month","year","all"] as const).map(p => fmt(overview.blog[p].total_views)),
                        },
                        {
                          label: "Blog claps",
                          values: (["week","month","year","all"] as const).map(p => fmt(overview.blog[p].total_claps)),
                        },
                      ].map(({ label, values }) => (
                        <tr key={label}>
                          <td className="py-1.5 text-zinc-600">{label}</td>
                          {values.map((v, i) => (
                            <td key={i} className={`py-1.5 text-right font-semibold ${i === 3 ? "text-zinc-800" : "text-zinc-500"}`}>{v}</td>
                          ))}
                        </tr>
                      ))}
                      <tr className="border-t border-zinc-200">
                        <td className="py-1.5 text-zinc-400">Posts published</td>
                        <td colSpan={3} />
                        <td className="py-1.5 text-right font-semibold text-zinc-800">
                          {overview.blog["all"].posts.length}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Per-post breakdown */}
                  {overview.blog["all"].posts.length > 0 && (
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">Per-post (all time)</p>
                      <table className="w-full text-[10px] border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-100">
                            <th className="text-left py-1 text-zinc-400 font-semibold">Post</th>
                            <th className="text-right py-1 text-zinc-400 font-semibold">Views</th>
                            <th className="text-right py-1 text-zinc-400 font-semibold">Claps</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                          {[...overview.blog["all"].posts]
                            .sort((a, b) => b.views - a.views)
                            .map((post) => (
                              <tr key={post.slug}>
                                <td className="py-1 text-zinc-500 font-mono text-[9px] truncate max-w-[130px]">{post.slug}</td>
                                <td className="py-1 text-right text-zinc-700">{fmt(post.views)}</td>
                                <td className="py-1 text-right text-zinc-700">{fmt(post.claps)}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Section 1 — Portfolio Data */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">1 · Portfolio Data</span>
                <div className="flex-1 h-px bg-zinc-100" />
              </div>
              <p className="text-[10px] text-zinc-400 leading-relaxed">
                Edit only in <span className="font-mono bg-zinc-100 px-1 rounded">backend/data/knowledge/</span> — these are the single source of truth for both the website UI and the Avocado chatbot knowledge base.
                After any edit, run <span className="font-mono bg-zinc-100 px-1 rounded">npm run sync</span> from <span className="font-mono bg-zinc-100 px-1 rounded">frontend/</span> (or just restart <span className="font-mono bg-zinc-100 px-1 rounded">npm run dev</span>).
                Never edit <span className="font-mono bg-zinc-100 px-1 rounded">frontend/src/data/knowledge/</span> directly — those files are auto-overwritten.
              </p>
              {[
                {
                  what: "Name, bio, tagline, location, contact",
                  file: "backend/data/knowledge/profile.json",
                  fields: "name, tagline, bio, obsession, previous, prev_domain, interested_domain, location, email, phone, github, linkedin, resume",
                },
                {
                  what: "Work experience — roles, companies, bullet points",
                  file: "backend/data/knowledge/experience.json",
                  fields: "role, company, location, start, end, description, bullets[]",
                },
                {
                  what: "Education — degrees, institutions, highlights",
                  file: "backend/data/knowledge/education.json",
                  fields: "institution, school, degree, field, location, start, end, gpa, highlights[]",
                },
                {
                  what: "Projects — title, description, tags, links",
                  file: "backend/data/knowledge/projects.json",
                  fields: "title, description, tags[], featured, award, sourceLinks[{label,url}], note",
                },
                {
                  what: "Skills & tools — categories and items",
                  file: "backend/data/knowledge/skills.json",
                  fields: "category, items[]",
                },
                {
                  what: "Testimonials — name, role, company, quote",
                  file: "backend/data/knowledge/testimonials.json",
                  fields: "name, designation, company, linkedin, description, givenAt, source",
                },
              ].map(({ what, file, fields }) => (
                <div key={file} className="border border-zinc-100 rounded-lg p-2.5 space-y-1">
                  <p className="text-[11px] font-semibold text-zinc-700">{what}</p>
                  <p className="font-mono text-[10px] text-indigo-600 break-all">{file}</p>
                  <p className="text-[10px] text-zinc-400 leading-relaxed">{fields}</p>
                </div>
              ))}
            </div>

            {/* Section 2 — Blog Posts */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">2 · Blog Posts</span>
                <div className="flex-1 h-px bg-zinc-100" />
              </div>
              <p className="text-[10px] text-zinc-400 leading-relaxed">
                Create a new <span className="font-mono bg-zinc-100 px-1 rounded">.mdx</span> file — the filename becomes the URL slug.
                No sync needed; GitHub Actions auto-generates <span className="font-mono bg-zinc-100 px-1 rounded">blog.json</span> on push so the chatbot indexes the new post automatically.
              </p>
              {[
                {
                  what: "New post file",
                  file: "frontend/src/content/blog/my-post.mdx",
                  fields: "Filename → URL slug. Required frontmatter: title, date, publishedAt, description, tags[]",
                },
                {
                  what: "Post images",
                  file: "frontend/public/blog/",
                  fields: "Place image files here. Reference as /blog/filename.jpg in MDX.",
                },
                {
                  what: "Auto-generated chatbot index",
                  file: "backend/data/knowledge/blog.json",
                  fields: "Do not edit — auto-generated by GH Actions on every push. Railway re-ingests on deploy.",
                },
              ].map(({ what, file, fields }) => (
                <div key={file} className="border border-zinc-100 rounded-lg p-2.5 space-y-1">
                  <p className="text-[11px] font-semibold text-zinc-700">{what}</p>
                  <p className="font-mono text-[10px] text-indigo-600 break-all">{file}</p>
                  <p className="text-[10px] text-zinc-400 leading-relaxed">{fields}</p>
                </div>
              ))}
              <div className="border border-amber-100 bg-amber-50 rounded-lg p-2.5 space-y-1">
                <p className="text-[11px] font-semibold text-amber-700">publishedAt vs date</p>
                <p className="text-[10px] text-amber-600 leading-relaxed">
                  <span className="font-mono">publishedAt</span> is the sort key — set it once and never change it.
                  <span className="font-mono"> date</span> is the display date — update freely (e.g. after a major revision).
                </p>
              </div>
            </div>

            {/* Section 3 — Deploy Pipeline */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">3 · Deploy Pipeline</span>
                <div className="flex-1 h-px bg-zinc-100" />
              </div>
              <p className="text-[10px] text-zinc-400 leading-relaxed">Everything is automated — just commit and push.</p>
              {[
                {
                  what: "Update portfolio data",
                  detail: "Edit any backend/data/knowledge/*.json → commit + push → Railway redeploys → chatbot re-indexes automatically (hash-based detection).",
                },
                {
                  what: "Publish a new blog post",
                  detail: "Write MDX → commit + push → GH Actions runs sync-blog script → commits blog.json → Railway redeploys → chatbot indexes the new post.",
                },
                {
                  what: "GH Actions auto-commit",
                  detail: "Workflow has contents: write permission. Commits synced files with [skip ci] tag to prevent infinite loops.",
                },
                {
                  what: "Chatbot re-ingest (hash-based)",
                  detail: "Backend computes SHA-256 of all knowledge JSON files at startup. Re-ingests only when the hash changes — fast startup if nothing changed.",
                },
              ].map(({ what, detail }) => (
                <div key={what} className="border border-zinc-100 rounded-lg p-2.5 space-y-0.5">
                  <p className="text-[11px] font-semibold text-zinc-700">{what}</p>
                  <p className="text-[10px] text-zinc-400 leading-relaxed">{detail}</p>
                </div>
              ))}
            </div>

            {/* Section 4 — Blog Engagement */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">4 · Blog Engagement</span>
                <div className="flex-1 h-px bg-zinc-100" />
              </div>
              <p className="text-[10px] text-zinc-400 leading-relaxed">Tracked automatically. No config needed for new posts — engagement starts recording as soon as a reader opens the post.</p>
              {[
                {
                  what: "Views — unique per visitor per post",
                  detail: "Auto-recorded when a reader opens a post. One view per IP address. Shown on the post page and blog index.",
                },
                {
                  what: "Claps — up to 50 per visitor per post",
                  detail: "Reader clicks the 👏 button. Clicks batch with a 1.5s debounce before saving. Total shown on index card and post page.",
                },
                {
                  what: "Storage — SQLite analytics.db",
                  detail: "Stored in chroma_db/analytics.db. IPs are SHA-256 hashed — never stored raw. On Railway: set ANALYTICS_DB_PATH=/data/analytics.db with a persistent volume so counts survive redeploys.",
                },
                {
                  what: "Persistence on Railway",
                  detail: "Without a volume, counts reset on every deploy. Add a Volume (Pro plan) mounted at /data and set ANALYTICS_DB_PATH=/data/analytics.db in backend environment variables.",
                },
                {
                  what: "API endpoints",
                  detail: "POST /blog/{slug}/view · POST /blog/{slug}/clap (body: {count}) · GET /blog/{slug}/stats · GET /blog/stats/summary",
                },
              ].map(({ what, detail }) => (
                <div key={what} className="border border-zinc-100 rounded-lg p-2.5 space-y-0.5">
                  <p className="text-[11px] font-semibold text-zinc-700">{what}</p>
                  <p className="text-[10px] text-zinc-400 leading-relaxed">{detail}</p>
                </div>
              ))}
            </div>

            {/* Section 5 — Avocado Chatbot */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">5 · Avocado Chatbot</span>
                <div className="flex-1 h-px bg-zinc-100" />
              </div>
              {[
                {
                  what: "Response count & unique visitors",
                  detail: "Tracked on every chat response. Shown in chatbot footer. Stored in the same analytics.db — subject to same Railway persistence note above.",
                },
                {
                  what: "Model indicator badge",
                  detail: "Green pill shows which Gemini model answered (e.g. gemini-2.5-flash). Updates automatically if a fallback was used.",
                },
                {
                  what: "Swap the AI model",
                  detail: "Change GEMINI_MODEL in Railway environment variables. No code change needed.",
                },
                {
                  what: "Model fallback chain",
                  detail: "Primary: GEMINI_MODEL. Fallbacks: GEMINI_FALLBACK_MODELS (comma-separated). Auto-retries on 503/429 capacity errors in order.",
                },
                {
                  what: "Knowledge base location",
                  detail: "ChromaDB persists to chroma_db/. Also needs a Railway volume at /data if you want it to survive redeploys without re-indexing on every start.",
                },
              ].map(({ what, detail }) => (
                <div key={what} className="border border-zinc-100 rounded-lg p-2.5 space-y-0.5">
                  <p className="text-[11px] font-semibold text-zinc-700">{what}</p>
                  <p className="text-[10px] text-zinc-400 leading-relaxed">{detail}</p>
                </div>
              ))}
            </div>

            {/* Section 6 — Environment Variables */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">6 · Environment Variables</span>
                <div className="flex-1 h-px bg-zinc-100" />
              </div>
              <p className="text-[10px] text-zinc-400 mb-1">Set these in Railway → your backend service → Variables.</p>
              {[
                { key: "GOOGLE_API_KEY", detail: "Required. Google AI API key for Gemini." },
                { key: "GEMINI_MODEL", detail: "Primary model. Default: gemini-2.5-flash" },
                { key: "GEMINI_FALLBACK_MODELS", detail: "Comma-separated fallbacks. Default: gemini-2.0-flash,gemini-2.0-flash-lite,gemini-flash-latest" },
                { key: "ANALYTICS_DB_PATH", detail: "Path to SQLite file. Set to /data/analytics.db when using a Railway persistent volume." },
                { key: "FRONTEND_ORIGIN", detail: "CORS allowed origin. Set to your production frontend URL." },
              ].map(({ key, detail }) => (
                <div key={key} className="border border-zinc-100 rounded-lg p-2.5 space-y-0.5">
                  <p className="font-mono text-[11px] font-semibold text-indigo-600">{key}</p>
                  <p className="text-[10px] text-zinc-400 leading-relaxed">{detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick card */}
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-3">Quick card</p>
            <div className="space-y-1.5 font-mono text-[10px] text-zinc-600">
              {[
                ["Image",       "![alt](/blog/f.jpg)"],
                ["Caption",     "![alt](/blog/f.jpg \"cap\")"],
                ["Link",        "[text](https://url)"],
                ["Bold",        "**text**"],
                ["Italic",      "*text*"],
                ["Code",        "`code`"],
                ["Strike",      "~~text~~"],
                ["Quote",       "> text"],
                ["Bullet",      "- item"],
                ["Numbered",    "1. item"],
                ["Divider",     "<Divider />"],
                ["Info box",    "<Callout type=\"info\">"],
                ["Tip box",     "<Callout type=\"tip\">"],
                ["Warn box",    "<Callout type=\"warning\">"],
                ["Quote box",   "<Callout type=\"quote\">"],
              ].map(([label, syntax]) => (
                <div key={label} className="flex gap-2">
                  <span className="text-zinc-400 w-20 shrink-0">{label}</span>
                  <span className="text-zinc-700">{syntax}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

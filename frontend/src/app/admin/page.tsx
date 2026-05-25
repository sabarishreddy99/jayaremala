"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api/client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PeriodStats    { total_responses: number; unique_visitors: number; sessions: number }
interface SiteVisitStats { total_visits: number; unique_visitors: number }
interface Feedback        { total: number; positive: number; negative: number; satisfaction_pct: number }
interface Question        { text: string; count: number }
interface BlogPost         { slug: string; views: number; claps: number }
interface BlogSummary      { total_views: number; total_claps: number; posts: BlogPost[] }
interface ExperienceSummary{ total: number; average: number; distribution: Record<string, number> }
interface LocationStat     { country: string; visits: number; unique_visitors: number }
interface PageStat         { page: string; sessions: number; unique_visitors: number }
interface BlogEngPost      { slug: string; unique_readers: number; total_opens: number; revisiting_readers: number; revisit_rate: number }
interface BlogEngagement   { total_opens: number; posts: BlogEngPost[] }

type ByPeriod<T> = { week: T; month: T; all: T };

interface AdminStats {
  conversations:   ByPeriod<PeriodStats>;
  feedback:        ByPeriod<Feedback>;
  top_questions:   ByPeriod<Question[]>;
  experience:      ByPeriod<ExperienceSummary>;
  blog:            BlogSummary;
  site_visitors:   ByPeriod<SiteVisitStats>;
  blog_engagement: ByPeriod<BlogEngagement>;
  location: {
    site: ByPeriod<LocationStat[]>;
    chat: ByPeriod<LocationStat[]>;
  };
  pages: ByPeriod<PageStat[]>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, color = "default",
}: { label: string; value: string | number; sub?: string; color?: "default" | "emerald" | "rose" | "indigo" }) {
  const accent = {
    default: "text-fg",
    emerald: "text-emerald-600 dark:text-emerald-400",
    rose: "text-rose-600 dark:text-rose-400",
    indigo: "text-indigo-600 dark:text-indigo-400",
  }[color];
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 flex flex-col gap-1">
      <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-fg-faint">{label}</p>
      <p className={`text-2xl sm:text-3xl font-bold tabular-nums ${accent}`}>{typeof value === "number" ? fmt(value) : value}</p>
      {sub && <p className="text-[10px] sm:text-[11px] text-fg-faint leading-snug">{sub}</p>}
    </div>
  );
}

function SatisfactionBar({ positive, negative }: { positive: number; negative: number }) {
  const total = positive + negative;
  if (total === 0) return <p className="text-xs text-fg-faint">No feedback yet</p>;
  const pct = Math.round((positive / total) * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-emerald-600 dark:text-emerald-400 font-medium">👍 {positive} positive</span>
        <span className="text-rose-600 dark:text-rose-400 font-medium">{negative} negative 👎</span>
      </div>
      <div className="h-2 rounded-full bg-surface-raised overflow-hidden">
        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[10px] text-fg-faint text-center">{pct}% satisfaction from {total} rated responses</p>
    </div>
  );
}

// ── Login ─────────────────────────────────────────────────────────────────────

function LoginForm({ onAuth }: { onAuth: (token: string) => void }) {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/stats/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { onAuth(token); }
      else { setError("Invalid token — check your ADMIN_TOKEN env var."); }
    } catch {
      setError("Could not reach the backend.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-fg-faint">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span className="text-sm font-semibold text-fg">Avocado Admin</span>
        </div>
        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-surface p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-fg-muted mb-1.5">Admin token</label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter ADMIN_TOKEN"
              className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:border-accent transition-colors"
              autoFocus
            />
          </div>
          {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
          <button
            type="submit"
            disabled={!token || loading}
            className="w-full rounded-xl bg-fg text-bg py-2 text-sm font-semibold hover:opacity-80 transition-opacity disabled:opacity-40"
          >
            {loading ? "Verifying…" : "Sign in"}
          </button>
          <Link
            href="/"
            className="flex items-center justify-center gap-1.5 text-xs text-fg-faint hover:text-fg-muted transition-colors pt-1"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Back to portfolio
          </Link>
        </form>
      </div>
    </div>
  );
}

// ── Site Guide ────────────────────────────────────────────────────────────────

const GUIDE_SECTIONS = [
  {
    heading: "New post frontmatter",
    code: `---\ntitle: Your Title\ndate: "2026-04-21"\npublishedAt: "2026-04-21"\ndescription: One-line summary shown on index.\ntags: [tag1, tag2]\n---`,
    note: "publishedAt = immutable publish date used for sort order. date = display date (update freely). Filename becomes the URL slug: my-post.mdx → /blog/my-post",
  },
  {
    heading: "Headings",
    code: `## Section      ← large, border below\n### Sub-section ← medium, no border\n#### Label      ← uppercase small caps`,
  },
  {
    heading: "Text formatting",
    code: "**bold**        *italic*\n`inline code`   ~~strikethrough~~\n\n> blockquote pull quote\n\n<Divider />   ← decorative section break",
  },
  {
    heading: "Links & lists",
    code: `[link text](https://example.com)\n[internal](/blog/my-post)\n\n- bullet item\n- another item\n  - nested item\n\n1. numbered item\n2. second item`,
  },
  {
    heading: "Images",
    code: `<!-- basic -->\n![alt text](/blog/file.jpg)\n\n<!-- with caption -->\n![alt text](/blog/file.jpg "Caption text")\n\n<!-- component -->\n<BlogImage\n  src="/blog/file.jpg"\n  alt="description"\n  caption="optional caption"\n/>`,
    note: "Put image files in frontend/public/blog/",
  },
  {
    heading: "Callout boxes",
    code: `<Callout type="info" title="Title">text</Callout>\n<Callout type="tip" title="Title">text</Callout>\n<Callout type="warning" title="Title">text</Callout>\n<Callout type="quote" title="Title">text</Callout>`,
    note: "All MDX components (Callout, BlogImage, Divider) are auto-imported — no import statement needed.",
  },
  {
    heading: "Code blocks (Shiki — syntax highlighted)",
    code: "```python\n# basic — language only\ndef hello(): return 'hi'\n```\n\n```python title=\"main.py\"\n# with filename tab\ndef hello(): return 'hi'\n```\n\n```python {2,4-5}\n# line highlighting — {lines} after language\ndef process():\n    result = compute()  # ← highlighted\n    log(result)\n    return result        # ← highlighted\n    # and 5 too         # ← highlighted\n```\n\n```python /return/\n# word/token highlighting — /pattern/ after language\ndef hello(): return 'hi'\ndef world(): return 'world'\n```",
    note: "Copy button appears on hover. title=\"file.py\" adds a filename tab. {1,3-5} highlights specific lines (indigo accent). /word/ highlights every occurrence of that token. 200+ languages: python typescript javascript bash json yaml sql go rust + more.",
  },
  {
    heading: "Table",
    code: `| Col A | Col B |\n|---|---|\n| val   | val   |`,
  },
];

function SiteGuide() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-surface-raised transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-fg-faint">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
          </svg>
          <h2 className="text-xs font-bold uppercase tracking-widest text-fg-faint">Site Guide &amp; Maintenance</h2>
        </div>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`text-fg-faint transition-transform ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className="border-t border-border px-5 py-6 space-y-8">

          {/* MDX Syntax Reference */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-fg-faint mb-4">MDX Syntax Reference</p>
            <div className="space-y-5">
              {GUIDE_SECTIONS.map((s) => (
                <div key={s.heading}>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-accent mb-1.5">{s.heading}</p>
                  {s.note && <p className="text-[11px] text-fg-faint mb-1.5 italic">{s.note}</p>}
                  <pre className="bg-zinc-950 text-zinc-300 text-[11px] leading-relaxed rounded-xl p-3.5 overflow-x-auto font-mono whitespace-pre-wrap break-words">
                    {s.code}
                  </pre>
                </div>
              ))}
            </div>
          </div>

          {/* Quick card */}
          <div className="rounded-xl border border-border bg-surface-raised p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-fg-faint mb-3">Quick card</p>
            <div className="space-y-1.5 font-mono text-[10px] text-fg-muted">
              {[
                ["Image",     "![alt](/blog/f.jpg)"],
                ["Caption",   '![alt](/blog/f.jpg "cap")'],
                ["Link",      "[text](https://url)"],
                ["Bold",      "**text**"],
                ["Italic",    "*text*"],
                ["Code",      "`code`"],
                ["Strike",    "~~text~~"],
                ["Quote",     "> text"],
                ["Bullet",    "- item"],
                ["Numbered",  "1. item"],
                ["Divider",   "<Divider />"],
                ["Info box",  '<Callout type="info">'],
                ["Tip box",   '<Callout type="tip">'],
                ["Warn box",  '<Callout type="warning">'],
                ["Quote box", '<Callout type="quote">'],
              ].map(([label, syntax]) => (
                <div key={label} className="flex gap-2">
                  <span className="text-fg-faint w-20 shrink-0">{label}</span>
                  <span className="text-fg-muted">{syntax}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Appendix */}
          <div className="rounded-xl border border-border bg-surface p-5 space-y-8">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-fg-faint mb-0.5">Appendix</p>
              <h3 className="text-sm font-bold text-fg">Project Maintenance</h3>
              <p className="text-[10px] text-fg-faint mt-1 leading-relaxed">Everything you need to keep the site up to date — data, blog posts, and deployments.</p>
            </div>

            {/* 1 · Portfolio Data */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent">1 · Portfolio Data</span>
                <div className="flex-1 h-px bg-border-subtle" />
              </div>
              <p className="text-[10px] text-fg-faint leading-relaxed">
                Edit only in <span className="font-mono bg-surface-raised px-1 rounded">backend/data/knowledge/</span> — these are the single source of truth for both the website UI and the Avocado chatbot knowledge base.
                After any edit, run <span className="font-mono bg-surface-raised px-1 rounded">npm run sync</span> from <span className="font-mono bg-surface-raised px-1 rounded">frontend/</span> (or just restart <span className="font-mono bg-surface-raised px-1 rounded">npm run dev</span>).
                Never edit <span className="font-mono bg-surface-raised px-1 rounded">frontend/src/data/knowledge/</span> directly — those files are auto-overwritten.
              </p>
              {[
                { what: "Name, bio, tagline, location, contact",             file: "backend/data/knowledge/profile.json",      fields: "name, tagline, bio, summary, obsession, previous, prev_domain, interested_domain, location, email, phone, github, linkedin, resume" },
                { what: "Work experience — roles, companies, bullet points", file: "backend/data/knowledge/experience.json",    fields: "role, company, location, start, end, description, bullets[]" },
                { what: "Education — degrees, institutions, highlights",     file: "backend/data/knowledge/education.json",    fields: "institution, school, degree, field, location, start, end, gpa, highlights[]" },
                { what: "Projects — title, description, tags, links",        file: "backend/data/knowledge/projects.json",     fields: "title, description, tags[], featured, award, sourceLinks[{label,url}], note" },
                { what: "Skills & tools — categories and items",             file: "backend/data/knowledge/skills.json",       fields: "category, items[]" },
                { what: "Testimonials — name, role, company, quote",         file: "backend/data/knowledge/testimonials.json", fields: "name, designation, company, linkedin, description, givenAt, source" },
              ].map(({ what, file, fields }) => (
                <div key={file} className="border border-border-subtle rounded-lg p-2.5 space-y-1">
                  <p className="text-[11px] font-semibold text-fg-muted">{what}</p>
                  <p className="font-mono text-[10px] text-accent break-all">{file}</p>
                  <p className="text-[10px] text-fg-faint leading-relaxed">{fields}</p>
                </div>
              ))}
              <div className="border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 rounded-lg p-2.5 space-y-1">
                <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">⚠ Resume link is hardcoded in Nav.tsx</p>
                <p className="text-[10px] text-amber-600 dark:text-amber-500 leading-relaxed">
                  The resume Google Drive URL in <span className="font-mono">profile.json</span> powers the chatbot and home page, but <span className="font-mono">components/Nav.tsx</span> has a separate hardcoded copy in both desktop and mobile nav. Update both when the resume changes.
                </p>
              </div>
            </div>

            {/* 2 · Blog Posts */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent">2 · Blog Posts</span>
                <div className="flex-1 h-px bg-border-subtle" />
              </div>
              <p className="text-[10px] text-fg-faint leading-relaxed">
                Create a new <span className="font-mono bg-surface-raised px-1 rounded">.mdx</span> file — the filename becomes the URL slug.
                No sync needed; GitHub Actions auto-generates <span className="font-mono bg-surface-raised px-1 rounded">blog.json</span> on push so the chatbot indexes the new post automatically.
              </p>
              {[
                { what: "New post file",                   file: "frontend/src/content/blog/my-post.mdx",       fields: "Filename → URL slug. Required frontmatter: title, date, publishedAt, description, tags[]" },
                { what: "Post images",                     file: "frontend/public/blog/",                       fields: "Place image files here. Reference as /blog/filename.jpg in MDX." },
                { what: "Auto-generated chatbot index",    file: "backend/data/knowledge/blog.json",            fields: "Do not edit — auto-generated by scripts/sync-knowledge.mjs. GH Actions commits it on push; Railway re-ingests on deploy." },
              ].map(({ what, file, fields }) => (
                <div key={file} className="border border-border-subtle rounded-lg p-2.5 space-y-1">
                  <p className="text-[11px] font-semibold text-fg-muted">{what}</p>
                  <p className="font-mono text-[10px] text-accent break-all">{file}</p>
                  <p className="text-[10px] text-fg-faint leading-relaxed">{fields}</p>
                </div>
              ))}
              <div className="border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 rounded-lg p-2.5 space-y-1">
                <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">publishedAt vs date</p>
                <p className="text-[10px] text-amber-600 dark:text-amber-500 leading-relaxed">
                  <span className="font-mono">publishedAt</span> is the sort key — set it once and never change it.{" "}
                  <span className="font-mono">date</span> is the display date — update freely (e.g. after a major revision).
                </p>
              </div>
            </div>

            {/* 2b · Lab */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent">2b · Lab — Living System Docs</span>
                <div className="flex-1 h-px bg-border-subtle" />
              </div>
              <p className="text-[10px] text-fg-faint leading-relaxed">
                Lab is for living, in-progress project documentation — architecture, decisions, and progress logs updated as the project evolves. Files live at <span className="font-mono bg-surface-raised px-1 rounded">frontend/src/content/lab/[slug].mdx</span>. Filename = URL slug.
              </p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-fg-faint mt-2">Frontmatter (required)</p>
              <pre className="bg-zinc-950 text-zinc-300 text-[11px] leading-relaxed rounded-xl p-3.5 overflow-x-auto font-mono whitespace-pre-wrap break-words">{`---\ntitle: "My Project"\nstatus: "active"        # active | paused | shipped\ndescription: "One-line summary shown on lab index card."\nstartedAt: "2026-01-01"\nupdatedAt: "2026-04-22"  # ← update this every time you edit\ntech: [Next.js, FastAPI, PostgreSQL]\n---`}</pre>
              {[
                { what: "status: active",  detail: "Green badge with pulse animation. Sorted to top of lab index. Use while actively building." },
                { what: "status: paused",  detail: "Amber badge. Sorted second. Use when work is on hold." },
                { what: "status: shipped", detail: "Indigo badge. Sorted last. Use when the project is complete and deployed." },
              ].map(({ what, detail }) => (
                <div key={what} className="border border-border-subtle rounded-lg p-2.5 space-y-0.5">
                  <p className="font-mono text-[11px] font-semibold text-fg-muted">{what}</p>
                  <p className="text-[10px] text-fg-faint leading-relaxed">{detail}</p>
                </div>
              ))}
              <div className="border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 rounded-lg p-2.5">
                <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">Always update updatedAt</p>
                <p className="text-[10px] text-amber-600 dark:text-amber-500 leading-relaxed mt-0.5">The lab index card shows &quot;last updated [date]&quot;. Set it to today&apos;s date every time you make changes or the card will show a stale date.</p>
              </div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-fg-faint mt-3">Lab MDX components</p>
              {[
                { what: '<Status status="active" />',                           detail: "Inline status badge — same colors as the index card. Put it near the top of the document." },
                { what: '<Stack items={["Next.js", "Python"]} />',              detail: "Renders a row of monospace tech tags. For a full tech stack listing inside the document body." },
                { what: '<Metric value="99%" label="uptime" />',                detail: "Highlighted stat box. Use for key numbers — latency, users, accuracy, uptime." },
                { what: '<Decision date="2026-01-10" title="Why X over Y">…</Decision>', detail: "Timeline entry with indigo dot. Use for architectural decisions and technology choices." },
                { what: '<Update date="2026-04-22">…</Update>',                 detail: "Lighter timeline entry with zinc dot. Use for progress notes and milestone completions." },
              ].map(({ what, detail }) => (
                <div key={what} className="border border-border-subtle rounded-lg p-2.5 space-y-0.5">
                  <p className="font-mono text-[10px] font-semibold text-accent break-all">{what}</p>
                  <p className="text-[10px] text-fg-faint leading-relaxed">{detail}</p>
                </div>
              ))}
              <p className="text-[9px] font-bold uppercase tracking-widest text-fg-faint mt-2">Architecture diagrams</p>
              <pre className="bg-zinc-950 text-zinc-300 text-[11px] leading-relaxed rounded-xl p-3.5 overflow-x-auto font-mono whitespace-pre-wrap break-words">{`\`\`\`arch\n┌─────────────┐     ┌─────────────┐\n│  Frontend   │────▶│   Backend   │\n└─────────────┘     └─────────────┘\n\`\`\``}</pre>
              <p className="text-[10px] text-fg-faint italic leading-relaxed">
                Always use fenced <span className="font-mono bg-surface-raised px-1 rounded">```arch</span> blocks for diagrams — never a JSX component. Characters like <span className="font-mono bg-surface-raised px-1 rounded">&lt;</span>, <span className="font-mono bg-surface-raised px-1 rounded">&gt;</span>, and <span className="font-mono bg-surface-raised px-1 rounded">{"{}"}</span> inside JSX children cause an MDX acorn parse error.
              </p>
            </div>

            {/* 3 · Deploy Pipeline */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent">3 · Deploy Pipeline (auto)</span>
                <div className="flex-1 h-px bg-border-subtle" />
              </div>
              <p className="text-[10px] text-fg-faint leading-relaxed">Everything is automated — just commit and push.</p>
              {[
                { what: "Update portfolio data",         detail: "Edit any backend/data/knowledge/*.json → commit + push → GH Actions runs sync-knowledge.mjs (copies all JSON to frontend/src/data/knowledge/) → Railway redeploys → chatbot re-indexes (hash changed)." },
                { what: "Publish a new blog post",       detail: "Write MDX → commit + push → GH Actions runs sync-knowledge.mjs → generates blog.json + copies all JSON → auto-commits with [skip ci] → Railway redeploys → chatbot indexes the new post." },
                { what: "What sync-knowledge.mjs does",  detail: "1) Reads all *.mdx from frontend/src/content/blog/, strips MDX, writes blog.json. 2) Copies ALL backend/data/knowledge/*.json → frontend/src/data/knowledge/. Run: node scripts/sync-knowledge.mjs from repo root." },
                { what: "GH Actions auto-commit",        detail: "Workflow (deploy.yml) needs contents: write, pages: write, id-token: write permissions. Auto-commits synced files with [skip ci] tag to prevent infinite loops." },
                { what: "Chatbot re-ingest (hash-based)", detail: "Backend computes SHA-256 of all knowledge JSON files at startup. Re-ingests only when the hash changes — fast startup if nothing changed. Hash stored at chroma_db/.ingest_hash." },
                { what: "Static site deployment",        detail: "Frontend builds as a static export and deploys to GitHub Pages (sabarishreddy99.github.io). Backend deploys to Railway. Both trigger on push to main." },
              ].map(({ what, detail }) => (
                <div key={what} className="border border-border-subtle rounded-lg p-2.5 space-y-0.5">
                  <p className="text-[11px] font-semibold text-fg-muted">{what}</p>
                  <p className="text-[10px] text-fg-faint leading-relaxed">{detail}</p>
                </div>
              ))}
            </div>

            {/* 4 · Blog Engagement */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent">4 · Blog Engagement</span>
                <div className="flex-1 h-px bg-border-subtle" />
              </div>
              <p className="text-[10px] text-fg-faint leading-relaxed">Tracked automatically. No config needed for new posts — engagement starts recording as soon as a reader opens the post.</p>
              {[
                { what: "Views — unique per visitor per post",   detail: "Auto-recorded when a reader opens a post. One view per IP address. Shown on the post page and blog index." },
                { what: "Claps — up to 50 per visitor per post", detail: "Reader clicks the clap icon button. Clicks batch with a 1.5s debounce before saving. Total shown on index card and post page." },
                { what: "Storage — SQLite analytics.db",         detail: "Stored in chroma_db/analytics.db. IPs are SHA-256 hashed — never stored raw. On Railway: set ANALYTICS_DB_PATH=/data/analytics.db with a persistent volume so counts survive redeploys." },
                { what: "Persistence on Railway",                detail: "Without a volume, counts reset on every deploy. Add a Volume (Pro plan) mounted at /data and set ANALYTICS_DB_PATH=/data/analytics.db in backend environment variables." },
                { what: "API endpoints",                         detail: "POST /blog/{slug}/view · POST /blog/{slug}/clap (body: {count}) · GET /blog/{slug}/stats · GET /blog/stats/summary" },
              ].map(({ what, detail }) => (
                <div key={what} className="border border-border-subtle rounded-lg p-2.5 space-y-0.5">
                  <p className="text-[11px] font-semibold text-fg-muted">{what}</p>
                  <p className="text-[10px] text-fg-faint leading-relaxed">{detail}</p>
                </div>
              ))}
            </div>

            {/* 5 · Avocado Chatbot */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent">5 · Avocado Chatbot</span>
                <div className="flex-1 h-px bg-border-subtle" />
              </div>
              {[
                { what: "Response count & unique visitors", detail: "Tracked on every chat response. Shown in chatbot footer. Stored in the same analytics.db — subject to same Railway persistence note above." },
                { what: "Model indicator badge",            detail: "Green pill shows which Gemini model answered (e.g. gemini-2.5-flash). Updates automatically if a fallback was used." },
                { what: "Swap the AI model",               detail: "Change GEMINI_MODEL in Railway environment variables. No code change needed." },
                { what: "Model fallback chain",             detail: "Primary: gemini-2.5-flash (250 RPD). Fallbacks: gemini-3.5-flash → gemini-3-flash → gemini-2.5-flash-lite → gemini-3.1-flash-lite. ~2,750 req/day total. Auto-retries on 429/503/404 in order." },
                { what: "Knowledge base — ChromaDB",        detail: "ChromaDB persists to backend/chroma_db/ (git-ignored). On Railway: mount a persistent volume at /data and symlink or set the chroma path. Without a volume, the DB rebuilds on every deploy (works, just slower startup ~30–60s)." },
                { what: "RAG pipeline",                     detail: "Hybrid: ChromaDB dense (all-MiniLM-L6-v2 embeddings) + BM25 lexical → RRF merge → cross-encoder rerank (ms-marco-MiniLM-L-6-v2). Retrieves top 5 chunks → fed as context to Gemini." },
                { what: "Startup warmup",                   detail: "Embedding model and cross-encoder load at startup. First response may be ~1–2s slower. Models download once and cache in Railway's ephemeral storage." },
              ].map(({ what, detail }) => (
                <div key={what} className="border border-border-subtle rounded-lg p-2.5 space-y-0.5">
                  <p className="text-[11px] font-semibold text-fg-muted">{what}</p>
                  <p className="text-[10px] text-fg-faint leading-relaxed">{detail}</p>
                </div>
              ))}
            </div>

            {/* 6 · Environment Variables */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent">6 · Environment Variables</span>
                <div className="flex-1 h-px bg-border-subtle" />
              </div>
              <p className="text-[10px] text-fg-faint mb-1">Backend vars → Railway → your backend service → Variables. Frontend vars → GitHub Actions secrets (used at build time).</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-fg-faint mt-2 mb-1">Backend (Railway)</p>
              {[
                { key: "GOOGLE_API_KEY",            detail: "Required. Google AI API key for Gemini. Chat endpoints return 503 without this." },
                { key: "GEMINI_MODEL",              detail: "Primary model. Default: gemini-2.5-flash. Change here to swap models without code changes." },
                { key: "GEMINI_FALLBACK_MODELS",    detail: "Comma-separated fallbacks tried on 503/429/404. Chain: gemini-3.5-flash (250 RPD) → gemini-3-flash (250 RPD) → gemini-2.5-flash-lite (1K RPD) → gemini-3.1-flash-lite (1K RPD). Total ~2,750 req/day." },
                { key: "ANALYTICS_DB_PATH",         detail: "SQLite file path. Set to /data/analytics.db with a Railway persistent volume, otherwise counts reset on every deploy." },
                { key: "FRONTEND_ORIGIN",           detail: "CORS allowed origins (comma-separated). Must include production frontend URL or browser requests will be blocked." },
                { key: "APP_ENV",                   detail: "dev or prod. Default: dev. Controls logging and debug behavior." },
                { key: "ADMIN_TOKEN",               detail: "Bearer token for the /stats/admin endpoint. Generate with: openssl rand -hex 32. Required to access this dashboard." },
              ].map(({ key, detail }) => (
                <div key={key} className="border border-border-subtle rounded-lg p-2.5 space-y-0.5">
                  <p className="font-mono text-[11px] font-semibold text-accent">{key}</p>
                  <p className="text-[10px] text-fg-faint leading-relaxed">{detail}</p>
                </div>
              ))}
              <p className="text-[9px] font-bold uppercase tracking-widest text-fg-faint mt-3 mb-1">Frontend (GitHub Actions secrets / .env.local)</p>
              {[
                { key: "NEXT_PUBLIC_API_BASE_URL", detail: "Backend URL the browser calls. Set to your Railway backend URL in production. Required — chat and blog stats break without it." },
                { key: "NEXT_PUBLIC_BLOG_FONT",    detail: "Blog reading font. Default: Source_Serif_4. Must match the font statically imported in frontend/src/app/layout.tsx." },
              ].map(({ key, detail }) => (
                <div key={key} className="border border-border-subtle rounded-lg p-2.5 space-y-0.5">
                  <p className="font-mono text-[11px] font-semibold text-accent">{key}</p>
                  <p className="text-[10px] text-fg-faint leading-relaxed">{detail}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

// ── Blog Editor ───────────────────────────────────────────────────────────────

function inlineFmt(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, '<code style="background:#27272a;color:#e879f9;padding:0.1em 0.35em;border-radius:4px;font-size:0.85em">$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:#818cf8;text-decoration:underline">$1</a>');
}

function mdxToHTML(md: string): string {
  const lines = md.split("\n");
  let html = "";
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
        i++;
      }
      const lang = line.slice(3).trim().split(/[\s{]/)[0] || "plaintext";
      html += `<pre style="background:#f6f8fa;color:#24292e;padding:1em 1.2em;border-radius:0.75rem;overflow-x:auto;font-size:0.82em;line-height:1.6;border:1px solid #e1e4e8;margin:1em 0"><div style="font-size:9px;color:#57606a;margin-bottom:0.5em;font-family:monospace">[Shiki highlights on publish — ${lang} block]</div>${codeLines.join("\n")}</pre>`;
      i++; continue;
    }
    if (line.startsWith("#### ")) { html += `<h4 style="font-size:0.82rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#71717a;margin:1.4em 0 0.3em">${inlineFmt(line.slice(5))}</h4>`; i++; continue; }
    if (line.startsWith("### "))  { html += `<h3 style="font-size:1.05rem;font-weight:700;margin:1.5em 0 0.4em">${inlineFmt(line.slice(4))}</h3>`; i++; continue; }
    if (line.startsWith("## "))   { html += `<h2 style="font-size:1.3rem;font-weight:700;margin:2em 0 0.5em;padding-bottom:0.3em;border-bottom:1px solid #3f3f46">${inlineFmt(line.slice(3))}</h2>`; i++; continue; }
    if (line.startsWith("# "))    { html += `<h1 style="font-size:1.75rem;font-weight:800;margin:0 0 0.5em">${inlineFmt(line.slice(2))}</h1>`; i++; continue; }
    if (line.startsWith("> "))    { html += `<blockquote style="border-left:3px solid #4f46e5;padding:0.5em 1em;margin:1em 0;background:#eef2ff;border-radius:0 0.5rem 0.5rem 0;font-style:italic"><p style="margin:0">${inlineFmt(line.slice(2))}</p></blockquote>`; i++; continue; }
    if (line === "---" || line.trim() === "<Divider />") { html += `<hr style="border:none;border-top:1px solid #3f3f46;margin:2em 0" />`; i++; continue; }
    if (/^[-*] /.test(line)) {
      let items = "";
      while (i < lines.length && /^[-*] /.test(lines[i])) { items += `<li style="margin-bottom:0.35em">${inlineFmt(lines[i].slice(2))}</li>`; i++; }
      html += `<ul style="padding-left:1.4em;margin:0.8em 0;list-style-type:disc">${items}</ul>`; continue;
    }
    if (/^\d+\. /.test(line)) {
      let items = "";
      while (i < lines.length && /^\d+\. /.test(lines[i])) { items += `<li style="margin-bottom:0.35em">${inlineFmt(lines[i].replace(/^\d+\. /, ""))}</li>`; i++; }
      html += `<ol style="padding-left:1.4em;margin:0.8em 0;list-style-type:decimal">${items}</ol>`; continue;
    }
    if (line.trim() === "") { html += `<div style="height:0.6em"></div>`; i++; continue; }
    if (/^<\w/.test(line.trim()) && line.trim().endsWith("/>")) {
      html += `<code style="display:inline-block;background:#1e1b4b;color:#818cf8;padding:0.2em 0.5em;border-radius:4px;font-size:0.8em;margin:0.4em 0">${line.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code><br />`;
      i++; continue;
    }
    html += `<p style="margin:0 0 0.8em;line-height:1.75;color:#71717a">${inlineFmt(line)}</p>`;
    i++;
  }
  return html;
}

function todayISO(): string { return new Date().toISOString().slice(0, 10); }

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");
}

// ── Format guide data ─────────────────────────────────────────────────────────

const FORMAT_GUIDE: { heading: string; items: { label: string; syntax: string; note?: string }[] }[] = [
  {
    heading: "Headings",
    items: [
      { label: "Section (H2)",        syntax: "## My Section",              note: "Large, underlined with border. Use for major sections." },
      { label: "Sub-section (H3)",    syntax: "### Sub-section",            note: "Medium weight. No border. Use inside an H2 section." },
      { label: "Label (H4)",          syntax: "#### Label",                 note: "Rendered uppercase small-caps in muted color. Use for field labels." },
    ],
  },
  {
    heading: "Text Formatting",
    items: [
      { label: "Bold",         syntax: "**bold text**" },
      { label: "Italic",       syntax: "*italic text*" },
      { label: "Strikethrough",syntax: "~~crossed out~~" },
      { label: "Inline code",  syntax: "`code snippet`",  note: "Renders with pink monospace styling." },
      { label: "Link",         syntax: "[link text](https://url.com)" },
      { label: "Internal link",syntax: "[anchor text](/blog/slug)",  note: "No domain needed for same-site links." },
    ],
  },
  {
    heading: "Lists",
    items: [
      { label: "Bullet list",  syntax: "- First item\n- Second item\n  - Nested item",  note: "Indent 2 spaces to nest." },
      { label: "Numbered list",syntax: "1. First\n2. Second\n3. Third",                 note: "Numbers auto-increment — you can use 1. 1. 1. too." },
    ],
  },
  {
    heading: "Blockquote",
    items: [
      { label: "Quote",        syntax: "> This is a pull quote or highlighted note.",  note: "Renders with indigo left border and background." },
    ],
  },
  {
    heading: "Code Blocks (Shiki — syntax highlighted)",
    items: [
      { label: "Python",      syntax: "```python\ndef hello():\n    return 'hi'\n```" },
      { label: "TypeScript",  syntax: "```typescript\nconst greet = (name: string) => `Hi ${name}`\n```" },
      { label: "JavaScript",  syntax: "```javascript\nconst x = 42\n```" },
      { label: "Bash / Shell",syntax: "```bash\nnpm install && npm run dev\n```" },
      { label: "JSON",        syntax: "```json\n{ \"key\": \"value\" }\n```" },
      { label: "SQL",         syntax: "```sql\nSELECT * FROM users WHERE id = 1;\n```" },
      { label: "YAML",        syntax: "```yaml\nname: Jaya\nrole: engineer\n```" },
      { label: "Go",          syntax: "```go\nfunc main() { fmt.Println(\"hi\") }\n```" },
      { label: "Rust",        syntax: "```rust\nfn main() { println!(\"hi\"); }\n```" },
      { label: "No language", syntax: "```\nPlain text / pseudocode block\n```",
        note: "Falls back to 'plaintext' — still renders with copy button and correct block style." },
      { label: "File title tab", syntax: "```python title=\"rag_pipeline.py\"\ndef query(q: str) -> str:\n    return chain.invoke(q)\n```",
        note: "Adds a filename tab above the block. Works with any language." },
      { label: "Line highlighting", syntax: "```python {2,4-6}\ndef process():\n    result = compute()   # ← line 2 highlighted\n    validate(result)\n    cache(result)        # ← lines 4-6 highlighted\n    log(result)\n    return result\n```",
        note: "Use {n} for a single line, {n,m} for multiple lines, {n-m} for a range. Renders with indigo left border accent." },
      { label: "Word / token highlight", syntax: "```python /return/\ndef hello(): return 'hi'\ndef world(): return 'world'\n```",
        note: "Wrap the target token in /slashes/ right after the language identifier. Every occurrence in the block gets highlighted. Use different patterns with /a/ /b/ for multi-colour." },
      { label: "Title + line highlight", syntax: "```typescript title=\"server.ts\" {3}\nimport express from 'express'\nconst app = express()\napp.listen(3000)   // ← highlighted\n```",
        note: "title= and {lines} can be combined freely on the same opening fence." },
    ],
  },
  {
    heading: "Table",
    items: [
      { label: "Basic table", syntax: "| Column A | Column B | Column C |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |",
        note: "Pipe-separated. Header row required. Align separators don't need to be equal width." },
      { label: "Right-align col", syntax: "| Name   | Score |\n|--------|------:|\n| Alice  |    98 |\n| Bob    |    87 |",
        note: "Append : to the right of the separator line to right-align that column." },
    ],
  },
  {
    heading: "Divider",
    items: [
      { label: "Section break",  syntax: "<Divider />",  note: "Renders a decorative horizontal rule with spacing. Prefer this over --- inside MDX." },
    ],
  },
  {
    heading: "Callout Boxes",
    items: [
      { label: "Info",    syntax: '<Callout type="info" title="Good to know">\nYour informational note here.\n</Callout>',
        note: "Blue. Use for helpful context or background info." },
      { label: "Tip",     syntax: '<Callout type="tip" title="Pro tip">\nA shortcut or best practice.\n</Callout>',
        note: "Green. Use for actionable advice." },
      { label: "Warning", syntax: '<Callout type="warning" title="Watch out">\nSomething important not to miss.\n</Callout>',
        note: "Amber. Use for gotchas, caveats, or breaking changes." },
      { label: "Quote",   syntax: '<Callout type="quote" title="Quote">\nA memorable quote or key takeaway.\n</Callout>',
        note: "Indigo. Use for pull-quotes or highlighted conclusions." },
    ],
  },
  {
    heading: "Images",
    items: [
      { label: "Basic",             syntax: "![Alt text](/blog/filename.jpg)",
        note: "Put images in frontend/public/blog/ — reference with /blog/ prefix." },
      { label: "With caption",      syntax: '![Alt text](/blog/filename.jpg "Caption shown below")',
        note: "Title attribute becomes the caption text rendered below the image." },
      { label: "BlogImage (full control)", syntax: '<BlogImage\n  src="/blog/filename.jpg"\n  alt="Descriptive alt text"\n  caption="Optional caption text"\n/>',
        note: "Use when you need precise alt + caption. Renders with rounded border and subtle shadow." },
      { label: "Placement — after heading",  syntax: "## Section Title\n\n![Alt](/blog/img.jpg)\n\nFirst paragraph…",
        note: "Images placed right after a heading get extra top margin automatically." },
      { label: "Placement — between paragraphs", syntax: "First paragraph text.\n\n![Alt](/blog/img.jpg)\n\nSecond paragraph continues here.",
        note: "Always separate images from paragraphs with blank lines." },
    ],
  },
  {
    heading: "MDX Gotchas",
    items: [
      { label: "Curly braces in text",  syntax: "Use &#123; and &#125; instead of { }",
        note: "Raw { } inside paragraph text will cause MDX parse errors — use HTML entities." },
      { label: "Angle brackets in text",syntax: "Use &lt; and &gt; instead of < >",
        note: "In body text (not code blocks), < > are treated as JSX and may fail to parse." },
      { label: "Arch diagrams",         syntax: "```arch\n┌──────────┐\n│ Frontend │\n└──────────┘\n```",
        note: "Always use ```arch fenced blocks for ASCII diagrams — never a JSX component." },
      { label: "JSX components — spacing", syntax: "<Callout type=\"info\">\nContent here.\n</Callout>",
        note: "Always put a blank line before and after JSX block components. Inline text next to them can break parsing." },
      { label: "Escaping in titles",   syntax: "title: \"It's a great post\"",
        note: "Use double-quoted YAML strings for titles containing apostrophes — no escaping needed." },
    ],
  },
];

// ── BlogEditor ─────────────────────────────────────────────────────────────────

function BlogEditor() {
  const [title, setTitle]                   = useState("");
  const [slug, setSlug]                     = useState("");
  const [slugEdited, setSlugEdited]         = useState(false);
  const [date, setDate]                     = useState(todayISO);
  const [publishedAt]                       = useState(todayISO);
  const [description, setDescription]       = useState("");
  const [tags, setTags]                     = useState("");
  const [ogImage, setOgImage]               = useState("");
  const [content, setContent]               = useState("## Introduction\n\nWrite your post content here…");
  const [githubPat, setGithubPat]           = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("avocado_github_pat") ?? "" : ""
  );
  const [patVisible, setPatVisible]         = useState(false);
  const [patSaved, setPatSaved]             = useState(false);
  const [activePanel, setActivePanel]       = useState<"write" | "preview" | "images">("write");
  const [publishing, setPublishing]         = useState(false);
  const [result, setResult]                 = useState<{ ok: boolean; message: string } | null>(null);
  const [uploadedImages, setUploadedImages] = useState<{ name: string; url: string }[]>([]);
  const [uploadingImg, setUploadingImg]     = useState(false);
  const [imgResult, setImgResult]           = useState<{ ok: boolean; message: string } | null>(null);
  const [showGuide, setShowGuide]           = useState(false);
  const [copiedSnippet, setCopiedSnippet]   = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!slugEdited) setSlug(slugify(title));
  }, [title, slugEdited]);

  // ── Insertion helpers ──────────────────────────────────────────────────────

  function insertInline(before: string, after: string, placeholder: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const sel   = content.slice(start, end) || placeholder;
    const next  = content.slice(0, start) + before + sel + after + content.slice(end);
    setContent(next);
    requestAnimationFrame(() => {
      ta.selectionStart = start + before.length;
      ta.selectionEnd   = start + before.length + sel.length;
      ta.focus();
    });
  }

  function insertBlock(template: string, caretOffset?: number) {
    const ta     = textareaRef.current;
    if (!ta) return;
    const pos    = ta.selectionStart;
    const before = content.slice(0, pos);
    const suffix = content.slice(pos);
    const pad    = before.length === 0 ? "" : before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
    const next   = before + pad + template + "\n\n" + suffix;
    setContent(next);
    const caret = pos + pad.length + (caretOffset ?? template.length);
    requestAnimationFrame(() => {
      ta.selectionStart = caret;
      ta.selectionEnd   = caret;
      ta.focus();
    });
  }

  function insertImageBlock(url: string, format: "basic" | "caption" | "component") {
    const name = url.split("/").pop() ?? "image";
    let snippet = "";
    if (format === "basic")     snippet = `![${name}](${url})`;
    if (format === "caption")   snippet = `![${name}](${url} "Your caption here")`;
    if (format === "component") snippet = `<BlogImage\n  src="${url}"\n  alt="${name}"\n  caption="Optional caption"\n/>`;
    insertBlock(snippet);
    setActivePanel("write");
  }

  function copySnippet(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedSnippet(text);
      setTimeout(() => setCopiedSnippet(""), 1500);
    });
  }

  // ── PAT helpers ────────────────────────────────────────────────────────────

  function savePat() {
    localStorage.setItem("avocado_github_pat", githubPat.trim());
    setPatSaved(true);
    setTimeout(() => setPatSaved(false), 2000);
  }

  // ── Image upload ───────────────────────────────────────────────────────────

  async function uploadImage(file: File) {
    if (!githubPat.trim()) { setImgResult({ ok: false, message: "GitHub PAT required — save it in the token section above." }); return; }
    setUploadingImg(true);
    setImgResult(null);
    try {
      const reader = new FileReader();
      const b64 = await new Promise<string>((resolve, reject) => {
        reader.onload  = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const apiURL   = `https://api.github.com/repos/sabarishreddy99/jayaremala/contents/frontend/public/blog/${filename}`;
      const headers  = { Authorization: `Bearer ${githubPat.trim()}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" };
      const getRes   = await fetch(apiURL, { headers });
      const body: Record<string, string> = { message: `blog: upload image ${filename}`, content: b64, branch: "main" };
      if (getRes.ok) body.sha = (await getRes.json()).sha;
      const putRes = await fetch(apiURL, { method: "PUT", headers, body: JSON.stringify(body) });
      if (putRes.ok) {
        const imgUrl = `/blog/${filename}`;
        setUploadedImages((prev) => [{ name: filename, url: imgUrl }, ...prev.filter((i) => i.url !== imgUrl)]);
        setImgResult({ ok: true, message: `Uploaded → ${imgUrl}` });
        if (!ogImage.trim()) setOgImage(imgUrl);
      } else {
        const err = await putRes.json().catch(() => ({ message: putRes.statusText }));
        setImgResult({ ok: false, message: `GitHub: ${(err as { message?: string }).message ?? putRes.statusText}` });
      }
    } catch (e: unknown) {
      setImgResult({ ok: false, message: `Error: ${(e as Error).message}` });
    } finally {
      setUploadingImg(false);
    }
  }

  // ── MDX build ─────────────────────────────────────────────────────────────

  function buildFrontmatter(): string {
    const tagArr  = tags.split(",").map((t) => t.trim()).filter(Boolean);
    const tagsStr = tagArr.length > 0 ? `[${tagArr.map((t) => `"${t}"`).join(", ")}]` : "[]";
    const lines   = ["---", `title: "${title}"`, `date: "${date}"`, `publishedAt: "${publishedAt}"`, `description: "${description}"`, `tags: ${tagsStr}`];
    if (ogImage.trim()) lines.push(`image: "${ogImage.trim()}"`);
    lines.push("---", "");
    return lines.join("\n");
  }

  function buildFrontmatterPreview(): string {
    const tagArr  = tags.split(",").map((t) => t.trim()).filter(Boolean);
    const tagsStr = tagArr.length > 0 ? `[${tagArr.map((t) => `"${t}"`).join(", ")}]` : "[]";
    const lines   = ["---", `title: "${title || "(untitled)"}"`, `date: "${date}"`, `publishedAt: "${publishedAt}"`, `description: "${description || "(none)"}"`, `tags: ${tagsStr}`];
    if (ogImage.trim()) lines.push(`image: "${ogImage.trim()}"`);
    lines.push("---");
    return lines.join("\n");
  }

  // ── Publish ────────────────────────────────────────────────────────────────

  async function publish() {
    if (!title.trim())     { setResult({ ok: false, message: "Title is required." }); return; }
    if (!slug.trim())      { setResult({ ok: false, message: "Slug is required." }); return; }
    if (!githubPat.trim()) { setResult({ ok: false, message: "GitHub PAT is required." }); return; }
    setPublishing(true);
    setResult(null);
    const filePath = `frontend/src/content/blog/${slug}.mdx`;
    const apiURL   = `https://api.github.com/repos/sabarishreddy99/jayaremala/contents/${filePath}`;
    const headers  = { Authorization: `Bearer ${githubPat.trim()}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" };
    const fullMDX  = buildFrontmatter() + content;
    try {
      const getRes = await fetch(apiURL, { headers });
      let sha: string | undefined;
      if (getRes.ok)                  { sha = (await getRes.json()).sha; }
      else if (getRes.status !== 404) { setResult({ ok: false, message: `GitHub: ${getRes.status} ${getRes.statusText}` }); setPublishing(false); return; }
      const body: Record<string, string> = { message: `blog: ${sha ? "update" : "publish"} ${slug}`, content: btoa(unescape(encodeURIComponent(fullMDX))), branch: "main" };
      if (sha) body.sha = sha;
      const putRes = await fetch(apiURL, { method: "PUT", headers, body: JSON.stringify(body) });
      if (putRes.ok) {
        setResult({ ok: true, message: `${sha ? "Updated" : "Published"}! GH Actions is building — /blog/${slug} will be live in ~2 min.` });
      } else {
        const err = await putRes.json().catch(() => ({ message: putRes.statusText }));
        setResult({ ok: false, message: `GitHub: ${(err as { message?: string }).message ?? putRes.statusText}` });
      }
    } catch (e: unknown) {
      setResult({ ok: false, message: `Network error: ${(e as Error).message}` });
    } finally {
      setPublishing(false);
    }
  }

  // ── Toolbar definition ─────────────────────────────────────────────────────

  const toolbar: { group: string; btns: { label: string; title: string; action: () => void; mono?: boolean }[] }[] = [
    { group: "heading", btns: [
      { label: "H2",  title: "Heading 2",   action: () => insertBlock("## "),   mono: true },
      { label: "H3",  title: "Heading 3",   action: () => insertBlock("### "),  mono: true },
      { label: "H4",  title: "Heading 4 (label)", action: () => insertBlock("#### "), mono: true },
    ]},
    { group: "inline", btns: [
      { label: "B",   title: "Bold",        action: () => insertInline("**", "**", "bold"), mono: true },
      { label: "I",   title: "Italic",      action: () => insertInline("*", "*", "italic"), mono: true },
      { label: "`",   title: "Inline code", action: () => insertInline("`", "`", "code"),   mono: true },
      { label: "~~",  title: "Strikethrough", action: () => insertInline("~~", "~~", "text"), mono: true },
      { label: "🔗",  title: "Link",        action: () => insertInline("[", "](url)", "link text") },
    ]},
    { group: "block", btns: [
      { label: ">",   title: "Blockquote",  action: () => insertBlock("> Your quote here"), mono: true },
      { label: "•",   title: "Bullet list", action: () => insertBlock("- Item 1\n- Item 2\n- Item 3"), mono: true },
      { label: "1.",  title: "Numbered list", action: () => insertBlock("1. First\n2. Second\n3. Third"), mono: true },
      { label: "—",   title: "Divider (<Divider />)", action: () => insertBlock("<Divider />"), mono: true },
    ]},
    { group: "code", btns: [
      { label: "```py", title: "Python block",     action: () => insertBlock("```python\n# code here\n```", 10), mono: true },
      { label: "```ts", title: "TypeScript block", action: () => insertBlock("```typescript\n// code here\n```", 14), mono: true },
      { label: "```sh", title: "Bash block",       action: () => insertBlock("```bash\n# command\n```", 7), mono: true },
      { label: "```",   title: "Generic block",    action: () => insertBlock("```\n\n```", 4), mono: true },
      { label: "arch",  title: "ASCII diagram block (```arch)", action: () => insertBlock("```arch\n┌────────────┐\n│            │\n└────────────┘\n```", 8), mono: true },
      { label: "title", title: 'Code block with file title: ```python title="main.py"', action: () => insertBlock('```python title="main.py"\n# code here\n```', 23), mono: true },
      { label: "{1}",   title: "Code block with line highlight: ```python {1}", action: () => insertBlock("```python {1}\n# this line highlighted\n```", 10), mono: true },
    ]},
    { group: "callout", btns: [
      { label: "ℹ Info",  title: "Info callout",    action: () => insertBlock('<Callout type="info" title="Info">\nYour note here\n</Callout>') },
      { label: "💡 Tip",  title: "Tip callout",     action: () => insertBlock('<Callout type="tip" title="Tip">\nYour tip here\n</Callout>') },
      { label: "⚠ Warn",  title: "Warning callout", action: () => insertBlock('<Callout type="warning" title="Warning">\nYour warning here\n</Callout>') },
      { label: "❝ Quote", title: "Quote callout",   action: () => insertBlock('<Callout type="quote" title="Quote">\nYour quote here\n</Callout>') },
    ]},
    { group: "misc", btns: [
      { label: "▦ Table", title: "Insert table", action: () => insertBlock("| Column A | Column B | Column C |\n|----------|----------|----------|\n| Cell     | Cell     | Cell     |") },
      { label: "🖼 Image",  title: "Switch to Images tab to upload/insert", action: () => setActivePanel("images") },
    ]},
  ];

  return (
    <div className="space-y-5 pb-8">

      {/* ── GitHub PAT ─────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-fg-faint">GitHub Access Token</p>
          {githubPat && <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">● Token set</span>}
        </div>
        <div className="flex gap-2">
          <input
            type={patVisible ? "text" : "password"}
            value={githubPat}
            onChange={(e) => { setGithubPat(e.target.value); setPatSaved(false); }}
            placeholder="ghp_… (needs repo write scope)"
            className="flex-1 min-w-0 rounded-xl border border-border bg-bg px-3 py-2 text-sm text-fg font-mono placeholder:text-fg-faint focus:outline-none focus:border-accent transition-colors"
          />
          <button onClick={() => setPatVisible(!patVisible)}
            className="shrink-0 px-3 rounded-xl border border-border text-fg-faint hover:text-fg text-xs transition-colors">
            {patVisible ? "Hide" : "Show"}
          </button>
          <button onClick={savePat}
            className="shrink-0 px-4 rounded-xl bg-fg text-bg text-xs font-semibold hover:opacity-80 transition-opacity">
            {patSaved ? "Saved ✓" : "Save"}
          </button>
        </div>
        <p className="text-[10px] text-fg-faint mt-2">
          Stored in localStorage only. Generate at{" "}
          <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-accent underline">github.com/settings/tokens</a>{" "}
          — needs <code className="bg-surface-raised px-1 rounded text-[10px]">repo</code> write scope (or fine-grained: Contents write).
        </p>
      </div>

      {/* ── Metadata ───────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-fg-faint">Post Metadata</p>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-widest text-fg-faint mb-1.5">Title *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="My Awesome Post"
            className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:border-accent transition-colors" />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-fg-faint mb-1.5">Slug * (URL)</label>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-fg-faint font-mono shrink-0">/blog/</span>
              <input type="text" value={slug}
                onChange={(e) => { setSlug(e.target.value); setSlugEdited(true); }}
                placeholder="my-awesome-post"
                className="flex-1 min-w-0 rounded-xl border border-border bg-bg px-3 py-2 text-sm text-fg font-mono placeholder:text-fg-faint focus:outline-none focus:border-accent transition-colors" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-fg-faint mb-1.5">Display Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-fg focus:outline-none focus:border-accent transition-colors" />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-widest text-fg-faint mb-1.5">Description</label>
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="One-line summary shown on blog index"
            className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:border-accent transition-colors" />
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-widest text-fg-faint mb-1.5">Tags (comma-separated)</label>
          <input type="text" value={tags} onChange={(e) => setTags(e.target.value)}
            placeholder="AI, Machine Learning, Python"
            className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:border-accent transition-colors" />
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-widest text-fg-faint mb-1.5">OG Image <span className="font-normal normal-case">(optional — for social share preview)</span></label>
          <div className="flex items-center gap-2">
            <input type="text" value={ogImage} onChange={(e) => setOgImage(e.target.value)}
              placeholder="/blog/my-post-cover.jpg"
              className="flex-1 min-w-0 rounded-xl border border-border bg-bg px-3 py-2 text-sm text-fg font-mono placeholder:text-fg-faint focus:outline-none focus:border-accent transition-colors" />
            {uploadedImages.length > 0 && (
              <select
                onChange={(e) => { if (e.target.value) setOgImage(e.target.value); e.target.value = ""; }}
                className="shrink-0 rounded-xl border border-border bg-bg px-2 py-2 text-xs text-fg-muted focus:outline-none focus:border-accent transition-colors"
              >
                <option value="">Pick uploaded…</option>
                {uploadedImages.map((img) => (
                  <option key={img.url} value={img.url}>{img.name}</option>
                ))}
              </select>
            )}
          </div>
          <p className="text-[10px] text-fg-faint mt-1">Upload the image first in the Images tab, then paste its path here. Used as the Twitter/OG card image when someone shares the post.</p>
        </div>
        <p className="text-[10px] text-fg-faint flex items-center gap-1.5">
          <span>publishedAt:</span>
          <code className="bg-surface-raised px-1.5 rounded font-mono">{publishedAt}</code>
          <span className="italic">(sort key — set once, never changes)</span>
        </p>
      </div>

      {/* ── Editor panel ───────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">

        {/* Toolbar */}
        <div className="border-b border-border bg-surface-raised px-3 py-2 flex flex-wrap gap-y-1.5 gap-x-1 items-center">
          {toolbar.map((group, gi) => (
            <span key={group.group} className="contents">
              {gi > 0 && <span className="w-px h-4 bg-border shrink-0 mx-0.5" />}
              {group.btns.map((btn) => (
                <button key={btn.label} onClick={btn.action} title={btn.title}
                  className={`px-2 py-0.5 rounded-md text-[11px] text-fg-muted hover:bg-surface hover:text-fg border border-transparent hover:border-border transition-colors whitespace-nowrap ${btn.mono ? "font-mono" : ""}`}>
                  {btn.label}
                </button>
              ))}
            </span>
          ))}
        </div>

        {/* Tab bar */}
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5 bg-surface-raised">
          <p className="text-[10px] font-bold uppercase tracking-widest text-fg-faint">Content (MDX)</p>
          <div className="flex gap-0.5 bg-surface rounded-lg p-0.5 border border-border">
            {(["write", "preview", "images"] as const).map((panel) => (
              <button key={panel} onClick={() => setActivePanel(panel)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  activePanel === panel ? "bg-fg text-bg shadow-sm" : "text-fg-muted hover:text-fg"
                }`}>
                {panel === "write" ? "✏ Write" : panel === "preview" ? "👁 Preview" : "🖼 Images"}
              </button>
            ))}
          </div>
        </div>

        {/* Write */}
        {activePanel === "write" && (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={26}
            spellCheck
            className="w-full bg-bg px-5 py-4 text-sm text-fg font-mono leading-relaxed placeholder:text-fg-faint focus:outline-none resize-y"
            placeholder="Write your MDX content here…"
          />
        )}

        {/* Preview */}
        {activePanel === "preview" && (
          <div className="px-5 sm:px-8 py-6 min-h-96 bg-bg">
            <pre className="mb-5 text-[10px] font-mono leading-relaxed text-fg-faint bg-surface rounded-xl border border-border px-4 py-3 whitespace-pre-wrap overflow-x-auto">
              {buildFrontmatterPreview()}
            </pre>
            <div
              style={{ fontFamily: "var(--font-blog, Georgia, serif)", lineHeight: 1.8 }}
              dangerouslySetInnerHTML={{ __html: mdxToHTML(content) }}
            />
          </div>
        )}

        {/* Images */}
        {activePanel === "images" && (
          <div className="p-5 space-y-4 bg-bg min-h-64">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-fg-muted mb-0.5">Upload images</p>
                <p className="text-[10px] text-fg-faint">
                  Files go to <code className="bg-surface-raised px-1 rounded">frontend/public/blog/</code> — reference as{" "}
                  <code className="bg-surface-raised px-1 rounded">/blog/filename.jpg</code> in content.
                </p>
              </div>
              <label className={`inline-flex items-center gap-2 cursor-pointer rounded-xl border px-4 py-2 text-xs font-semibold transition-colors shrink-0 ${
                uploadingImg
                  ? "border-border text-fg-faint opacity-50 cursor-not-allowed"
                  : "border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
              }`}>
                {uploadingImg ? (
                  <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Uploading…</>
                ) : (
                  <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>Upload image</>
                )}
                <input type="file" accept="image/*" className="hidden" disabled={uploadingImg}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.target.value = ""; }} />
              </label>
            </div>

            {imgResult && (
              <div className={`rounded-xl border px-3 py-2 text-xs flex items-center gap-2 ${
                imgResult.ok
                  ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                  : "border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300"
              }`}>
                {imgResult.ok ? "✓" : "✗"} {imgResult.message}
              </div>
            )}

            {/* Placement guide */}
            <div className="rounded-xl border border-border bg-surface p-3 space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-fg-faint">Placement tips</p>
              {[
                ["After a heading",         "## Section\n\n![alt](/blog/img.jpg)\n\nParagraph…",    "Image right after heading — extra top margin added automatically."],
                ["Between paragraphs",      "Para one text.\n\n![alt](/blog/img.jpg)\n\nPara two.", "Always wrap with blank lines top and bottom."],
                ["With caption",            '![alt](/blog/img.jpg "Caption text")',                  "Title attribute becomes caption text below the image."],
                ["Full-control component",  '<BlogImage src="/blog/img.jpg" alt="…" caption="…" />', "Use when you need alt + caption independently styled."],
              ].map(([label, syntax, note]) => (
                <div key={label as string} className="rounded-lg border border-border-subtle bg-bg p-2 space-y-0.5">
                  <p className="text-[10px] font-semibold text-fg-muted">{label}</p>
                  <p className="text-[10px] text-fg-faint italic">{note}</p>
                  <code className="block text-[10px] font-mono text-accent bg-surface-raised rounded px-2 py-1 whitespace-pre">{syntax}</code>
                </div>
              ))}
            </div>

            {uploadedImages.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-fg-faint">Uploaded this session</p>
                {uploadedImages.map((img) => (
                  <div key={img.url} className="rounded-xl border border-border bg-surface p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-[11px] text-accent font-mono truncate">{img.url}</code>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.name} className="max-h-28 rounded-lg border border-border object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] text-fg-faint shrink-0">Insert as:</span>
                      {(["basic", "caption", "component"] as const).map((fmt) => (
                        <button key={fmt} onClick={() => insertImageBlock(img.url, fmt)}
                          className="px-2.5 py-1 rounded-lg text-[10px] border border-border bg-bg text-fg-muted hover:border-accent hover:text-accent transition-colors font-mono">
                          {fmt === "basic" ? "![alt](url)" : fmt === "caption" ? '![alt](url "cap")' : "<BlogImage />"}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              !imgResult && (
                <div className="text-center py-10 text-fg-faint">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-2 opacity-30">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <p className="text-xs">Upload an image to get started</p>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* ── Format Guide ───────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <button onClick={() => setShowGuide(!showGuide)}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-surface-raised transition-colors">
          <div className="flex items-center gap-2">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-fg-faint">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-widest text-fg-faint">MDX Format Guide &amp; Tips</span>
            <span className="text-[10px] text-fg-faint">— click any snippet to copy, toolbar buttons to insert at cursor</span>
          </div>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={`text-fg-faint transition-transform shrink-0 ${showGuide ? "rotate-180" : ""}`}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {showGuide && (
          <div className="border-t border-border px-5 py-5 space-y-7">
            {FORMAT_GUIDE.map((section) => (
              <div key={section.heading}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-accent">{section.heading}</span>
                  <div className="flex-1 h-px bg-border-subtle" />
                </div>
                <div className="space-y-2">
                  {section.items.map((item) => (
                    <div key={item.label} className="rounded-xl border border-border-subtle bg-bg hover:border-border transition-colors overflow-hidden">
                      <div className="flex items-start justify-between gap-2 px-3 pt-2.5 pb-1">
                        <p className="text-[11px] font-semibold text-fg-muted">{item.label}</p>
                        <button
                          onClick={() => copySnippet(item.syntax)}
                          title="Copy snippet"
                          className="shrink-0 text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border border-border text-fg-faint hover:text-accent hover:border-accent transition-colors">
                          {copiedSnippet === item.syntax ? "✓ Copied" : "Copy"}
                        </button>
                      </div>
                      {item.note && <p className="px-3 pb-1 text-[10px] text-fg-faint italic leading-relaxed">{item.note}</p>}
                      <pre className="px-3 pb-3 text-[11px] font-mono text-zinc-300 bg-zinc-950 leading-relaxed whitespace-pre-wrap overflow-x-auto cursor-pointer"
                        onClick={() => copySnippet(item.syntax)}>
                        {item.syntax}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Quick cheat-sheet */}
            <div className="rounded-xl border border-border bg-surface-raised p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-fg-faint mb-3">Quick cheat-sheet</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 font-mono text-[10px] text-fg-muted">
                {[
                  ["## Heading 2",     "Section with underline"],
                  ["### Heading 3",    "Sub-section"],
                  ["**text**",         "Bold"],
                  ["*text*",           "Italic"],
                  ["`code`",           "Inline code"],
                  ["~~text~~",         "Strikethrough"],
                  ["[label](url)",     "Link"],
                  ["![alt](url)",      "Image"],
                  ["> text",           "Blockquote"],
                  ["- item",           "Bullet list"],
                  ["1. item",          "Numbered list"],
                  ["<Divider />",      "Section break"],
                  ["```python",        "Code block (Shiki highlighted)"],
                  ['```py title="f.py"', "Code block with filename tab"],
                  ["```python {1,3-5}", "Code block with line highlight"],
                  ["```python /word/",  "Code block with token highlight"],
                  ["| col | col |",    "Table"],
                  ['<Callout type="info">', "Info box"],
                  ['<Callout type="tip">',  "Tip box"],
                  ['<Callout type="warning">', "Warning box"],
                  ['<Callout type="quote">',   "Quote box"],
                  ["&#123; &#125;",    "Literal { } in text"],
                  ["&lt; &gt;",        "Literal < > in text"],
                ].map(([syntax, label]) => (
                  <div key={syntax} className="flex gap-2 py-0.5">
                    <span className="text-accent shrink-0 w-36 truncate">{syntax}</span>
                    <span className="text-fg-faint">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Result banner ──────────────────────────────────────────────────── */}
      {result && (
        <div className={`rounded-xl border px-4 py-3 text-sm flex items-start gap-2 ${
          result.ok
            ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
            : "border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300"
        }`}>
          <span className="shrink-0 font-bold">{result.ok ? "✓" : "✗"}</span>
          <span>
            {result.message}
            {result.ok && slug && (
              <> &nbsp;<a href={`/blog/${slug}`} target="_blank" rel="noopener noreferrer" className="underline font-medium">View /blog/{slug} →</a></>
            )}
          </span>
        </div>
      )}

      {/* ── Publish bar ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface px-5 py-4">
        <div className="text-[10px] text-fg-faint leading-relaxed space-y-0.5">
          <p>Commits MDX to <code className="bg-surface-raised px-1 rounded">sabarishreddy99/jayaremala</code> main branch.</p>
          <p>GH Actions rebuilds the site — /blog/{slug || "slug"} live in ~2 min.</p>
        </div>
        <button
          onClick={publish}
          disabled={publishing || !title.trim() || !slug.trim()}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/50 hover:-translate-y-px transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0"
        >
          {publishing ? (
            <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Publishing…</>
          ) : (
            <>Publish to GitHub <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg></>
          )}
        </button>
      </div>

    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

type Period = "week" | "month" | "all";
const PERIOD_LABELS: Record<Period, string> = { week: "This week", month: "This month", all: "All time" };

function Dashboard({
  stats, onLogout, onRefresh, refreshing, secondsAgo, lastUpdated,
}: {
  stats: AdminStats;
  onLogout: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  secondsAgo: number;
  lastUpdated: Date | null;
}) {
  const [period, setPeriod] = useState<Period>("all");
  const [activeView, setActiveView] = useState<"analytics" | "write-blog">("analytics");
  const conv        = stats.conversations[period];
  const site        = stats.site_visitors[period];
  const feedback    = stats.feedback[period];
  const topQs       = stats.top_questions[period];
  const exp         = stats.experience[period];
  const blogEng     = stats.blog_engagement[period];
  const siteLocations = stats.location.site[period];
  const chatLocations = stats.location.chat[period];
  const pages       = stats.pages[period];
  const topPosts    = [...stats.blog.posts].sort((a, b) => b.views - a.views).slice(0, 8);

  return (
    <div className="min-h-screen bg-bg px-4 sm:px-6 py-8">
      <div className="mx-auto max-w-5xl space-y-8">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🥑</span>
            <div>
              <h1 className="text-lg font-bold text-fg">Avocado Analytics</h1>
              <p className="text-[11px] text-fg-faint">Internal dashboard — not public</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {lastUpdated && (
              <span className="text-[10px] text-fg-faint tabular-nums">
                {refreshing ? "Refreshing…" : secondsAgo < 10 ? "Just updated" : `Updated ${secondsAgo}s ago`}
              </span>
            )}
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 text-xs text-fg-faint hover:text-fg-muted border border-border rounded-lg px-3 py-1.5 transition-colors disabled:opacity-40"
              title="Refresh stats"
            >
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className={refreshing ? "animate-spin" : ""}
              >
                <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
              Refresh
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-fg-faint hover:text-fg-muted border border-border rounded-lg px-3 py-1.5 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              Home
            </Link>
            <button
              onClick={() => setActiveView(activeView === "write-blog" ? "analytics" : "write-blog")}
              className={`text-xs border rounded-lg px-3 py-1.5 transition-colors ${
                activeView === "write-blog"
                  ? "border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40"
                  : "border-border text-fg-faint hover:text-fg-muted"
              }`}
            >
              {activeView === "write-blog" ? "← Analytics" : "✏ Write Blog"}
            </button>
            <button
              onClick={onLogout}
              className="text-xs text-fg-faint hover:text-fg-muted border border-border rounded-lg px-3 py-1.5 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Period tabs — analytics only */}
        {activeView === "analytics" && (
          <div className="grid grid-cols-3 gap-1 bg-surface-raised rounded-xl p-1 border border-border sm:w-fit sm:flex sm:grid-cols-none">
            {(["week", "month", "all"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-medium transition-colors text-center ${
                  period === p ? "bg-fg text-bg shadow-sm" : "text-fg-muted hover:text-fg"
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        )}

        {/* Write Blog view */}
        {activeView === "write-blog" && <BlogEditor />}

        {/* Analytics content */}
        {activeView === "analytics" && (<>

        {/* Top stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            label="Site Visitors"
            value={site.unique_visitors}
            sub={`${fmt(site.total_visits)} total page loads`}
            color="indigo"
          />
          <StatCard
            label="Chat Users"
            value={conv.unique_visitors}
            sub={`${(Math.round(conv.total_responses / Math.max(conv.unique_visitors, 1) * 10) / 10).toFixed(1)} avg msgs/visitor`}
          />
          <StatCard
            label="Conversations"
            value={conv.total_responses}
            sub={`${fmt(conv.sessions)} session${conv.sessions !== 1 ? "s" : ""}`}
          />
          <StatCard
            label="Satisfaction"
            value={feedback.total > 0 ? `${feedback.satisfaction_pct}%` : "—"}
            sub={`from ${feedback.total} rated responses`}
            color={feedback.satisfaction_pct >= 70 ? "emerald" : feedback.satisfaction_pct > 0 ? "rose" : "default"}
          />
          <StatCard
            label="Avg Experience"
            value={exp.total > 0 ? `${exp.average} ★` : "—"}
            sub={`from ${exp.total} visitor rating${exp.total !== 1 ? "s" : ""}`}
            color={exp.average >= 4 ? "emerald" : exp.average >= 3 ? "default" : exp.total > 0 ? "rose" : "default"}
          />
          <StatCard
            label="Blog Views"
            value={stats.blog.total_views}
            sub={`${fmt(stats.blog.total_claps)} claps across ${stats.blog.posts.length} posts`}
          />
        </div>

        {/* Questions + Feedback */}
        <div className="grid lg:grid-cols-2 gap-6">

          {/* Top questions */}
          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-fg-faint mb-4">Top Questions</h2>
            {topQs.length === 0 ? (
              <p className="text-sm text-fg-faint">No questions logged yet.</p>
            ) : (
              <ol className="space-y-2">
                {topQs.map((q, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-[10px] font-mono text-fg-faint mt-0.5 w-4 shrink-0">{i + 1}.</span>
                    <span className="text-xs text-fg-muted leading-relaxed flex-1 min-w-0 truncate" title={q.text}>
                      {q.text}
                    </span>
                    <span className="text-[10px] font-semibold tabular-nums bg-surface-raised border border-border rounded-full px-2 py-0.5 text-fg-muted shrink-0">
                      {q.count}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* Feedback breakdown */}
          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 space-y-4 sm:space-y-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-fg-faint">Response Feedback</h2>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-surface-raised border border-border p-2.5 text-center">
                <p className="text-xl sm:text-2xl font-bold text-fg">{feedback.total}</p>
                <p className="text-[9px] sm:text-[10px] text-fg-faint mt-0.5">Total rated</p>
              </div>
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-2.5 text-center">
                <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">{feedback.positive}</p>
                <p className="text-[9px] sm:text-[10px] text-emerald-700 dark:text-emerald-500 mt-0.5">👍 Positive</p>
              </div>
              <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-2.5 text-center">
                <p className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400">{feedback.negative}</p>
                <p className="text-[9px] sm:text-[10px] text-rose-700 dark:text-rose-500 mt-0.5">👎 Negative</p>
              </div>
            </div>
            <SatisfactionBar positive={feedback.positive} negative={feedback.negative} />

            {/* All-time conversation comparison */}
            <div className="pt-3 border-t border-border space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-fg-faint">Conversations by period</p>
              {(["week", "month", "all"] as Period[]).map((p) => {
                const c = stats.conversations[p];
                const maxVal = stats.conversations.all.total_responses || 1;
                return (
                  <div key={p} className="flex items-center gap-3">
                    <span className="text-[10px] text-fg-faint w-20 shrink-0">{PERIOD_LABELS[p]}</span>
                    <div className="flex-1 h-1.5 bg-surface-raised rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full"
                        style={{ width: `${Math.round((c.total_responses / maxVal) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold tabular-nums text-fg-muted w-8 text-right shrink-0">
                      {fmt(c.total_responses)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Visitor Experience Ratings */}
        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-fg-faint">Visitor Experience</h2>
            {exp.total > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-amber-400 text-base leading-none">
                  {"★".repeat(Math.round(exp.average))}
                  {"☆".repeat(5 - Math.round(exp.average))}
                </span>
                <span className="text-sm font-bold text-fg">{exp.average}</span>
                <span className="text-[10px] text-fg-faint">/ 5 from {exp.total} rating{exp.total !== 1 ? "s" : ""}</span>
              </div>
            )}
          </div>
          {exp.total === 0 ? (
            <p className="text-xs text-fg-faint">No ratings yet — visitors will see the rating widget after their first chat exchange.</p>
          ) : (
            <div className="space-y-2">
              {[5,4,3,2,1].map((star) => {
                const count = exp.distribution[star] ?? 0;
                const pct = exp.total > 0 ? Math.round((count / exp.total) * 100) : 0;
                return (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-[11px] text-fg-faint w-4 shrink-0 text-right">{star}</span>
                    <span className="text-amber-400 text-xs leading-none shrink-0">★</span>
                    <div className="flex-1 h-2 bg-surface-raised rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] tabular-nums text-fg-faint w-6 text-right shrink-0">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Site visitors breakdown */}
        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-fg-faint">Site Visitors</h2>
            <span className="text-[11px] text-fg-faint">all unique IPs, hashed — every page load</span>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-5">
            {(["week", "month", "all"] as Period[]).map((p) => {
              const sv = stats.site_visitors[p];
              return (
                <div key={p} className={`rounded-xl border p-3 text-center ${p === period ? "border-accent bg-accent/5" : "border-border bg-surface-raised"}`}>
                  <p className="text-xl sm:text-2xl font-bold tabular-nums text-fg">{fmt(sv.unique_visitors)}</p>
                  <p className="text-[9px] sm:text-[10px] text-fg-faint mt-0.5">{PERIOD_LABELS[p]}</p>
                  <p className="text-[9px] text-fg-faint">{fmt(sv.total_visits)} loads</p>
                </div>
              );
            })}
          </div>
          <div className="space-y-2">
            {(["week", "month", "all"] as Period[]).map((p) => {
              const sv = stats.site_visitors[p];
              const maxVal = stats.site_visitors.all.unique_visitors || 1;
              return (
                <div key={p} className="flex items-center gap-3">
                  <span className="text-[10px] text-fg-faint w-20 shrink-0">{PERIOD_LABELS[p]}</span>
                  <div className="flex-1 h-1.5 bg-surface-raised rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.round((sv.unique_visitors / maxVal) * 100)}%` }} />
                  </div>
                  <span className="text-[10px] font-semibold tabular-nums text-fg-muted w-8 text-right shrink-0">{fmt(sv.unique_visitors)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Blog table */}
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-border flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-fg-faint">Blog Performance</h2>
            <div className="flex items-center gap-3 text-[11px] text-fg-faint">
              <span><strong className="text-fg-muted">{fmt(stats.blog.total_views)}</strong> views</span>
              <span><strong className="text-fg-muted">{fmt(stats.blog.total_claps)}</strong> claps</span>
            </div>
          </div>
          {topPosts.length === 0 ? (
            <p className="px-5 py-6 text-sm text-fg-faint">No blog data yet.</p>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-3 sm:px-5 py-2.5 text-fg-faint font-semibold uppercase tracking-wider text-[10px]">Post</th>
                  <th className="text-right px-3 sm:px-5 py-2.5 text-fg-faint font-semibold uppercase tracking-wider text-[10px]">Views</th>
                  <th className="text-right px-3 sm:px-5 py-2.5 text-fg-faint font-semibold uppercase tracking-wider text-[10px]">Claps</th>
                </tr>
              </thead>
              <tbody>
                {topPosts.map((p, i) => (
                  <tr key={p.slug} className={i < topPosts.length - 1 ? "border-b border-border" : ""}>
                    <td className="px-3 sm:px-5 py-3 text-fg-muted font-medium max-w-[140px] sm:max-w-xs">
                      <a
                        href={`/blog/${p.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-accent transition-colors truncate block"
                      >
                        {p.slug}
                      </a>
                    </td>
                    <td className="px-3 sm:px-5 py-3 text-right tabular-nums text-fg-muted font-semibold">{fmt(p.views)}</td>
                    <td className="px-3 sm:px-5 py-3 text-right tabular-nums text-fg-muted">{fmt(p.claps)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>

        {/* Location breakdown */}
        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-fg-faint mb-4">Visitor Locations</h2>
          <div className="grid lg:grid-cols-2 gap-6">
            {([["Site Visitors", siteLocations], ["Chat Users", chatLocations]] as [string, LocationStat[]][]).map(([label, locs]) => (
              <div key={label}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-fg-faint mb-2">{label}</p>
                {locs.length === 0 ? (
                  <p className="text-xs text-fg-faint">No geo data yet — populates as visitors arrive.</p>
                ) : (
                  <div className="space-y-1.5">
                    {locs.map((l) => {
                      const maxV = locs[0]?.unique_visitors || 1;
                      const pct = Math.round((l.unique_visitors / maxV) * 100);
                      return (
                        <div key={l.country} className="flex items-center gap-2">
                          <span className="text-[11px] text-fg-muted w-28 shrink-0 truncate">{l.country}</span>
                          <div className="flex-1 h-1.5 bg-surface-raised rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[10px] tabular-nums text-fg-faint w-6 text-right shrink-0">{fmt(l.unique_visitors)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Page visits */}
        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-fg-faint mb-4">Top Pages</h2>
          {pages.length === 0 ? (
            <p className="text-xs text-fg-faint">No page data yet.</p>
          ) : (
            <div className="space-y-1.5">
              {pages.map((p) => {
                const maxS = pages[0]?.sessions || 1;
                const pct = Math.round((p.sessions / maxS) * 100);
                return (
                  <div key={p.page} className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-fg-muted w-36 shrink-0 truncate" title={p.page}>{p.page}</span>
                    <div className="flex-1 h-1.5 bg-surface-raised rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] tabular-nums text-fg-faint shrink-0">{fmt(p.sessions)} sessions</span>
                    <span className="text-[10px] tabular-nums text-fg-faint shrink-0 hidden sm:inline">{fmt(p.unique_visitors)} uniq</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Blog engagement — session-based opens + revisits */}
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-border flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-fg-faint">Blog Engagement</h2>
            <div className="flex items-center gap-3 text-[11px] text-fg-faint">
              <span><strong className="text-fg-muted">{fmt(blogEng.total_opens)}</strong> total opens</span>
              <span className="text-[9px]">· 10-min session dedup · revisit = same IP opens again after 10 min</span>
            </div>
          </div>
          {blogEng.posts.length === 0 ? (
            <p className="px-5 py-6 text-sm text-fg-faint">No blog session data yet — populates as readers open posts.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-3 sm:px-5 py-2.5 text-fg-faint font-semibold uppercase tracking-wider text-[10px]">Post</th>
                    <th className="text-right px-3 sm:px-5 py-2.5 text-fg-faint font-semibold uppercase tracking-wider text-[10px]">Opens</th>
                    <th className="text-right px-3 sm:px-5 py-2.5 text-fg-faint font-semibold uppercase tracking-wider text-[10px]">Readers</th>
                    <th className="text-right px-3 sm:px-5 py-2.5 text-fg-faint font-semibold uppercase tracking-wider text-[10px]">Revisit %</th>
                  </tr>
                </thead>
                <tbody>
                  {blogEng.posts.map((p, i) => (
                    <tr key={p.slug} className={i < blogEng.posts.length - 1 ? "border-b border-border" : ""}>
                      <td className="px-3 sm:px-5 py-3 text-fg-muted font-medium max-w-[140px] sm:max-w-xs">
                        <a href={`/blog/${p.slug}`} target="_blank" rel="noopener noreferrer"
                           className="hover:text-accent transition-colors truncate block">{p.slug}</a>
                      </td>
                      <td className="px-3 sm:px-5 py-3 text-right tabular-nums text-fg-muted font-semibold">{fmt(p.total_opens)}</td>
                      <td className="px-3 sm:px-5 py-3 text-right tabular-nums text-fg-muted">{fmt(p.unique_readers)}</td>
                      <td className="px-3 sm:px-5 py-3 text-right tabular-nums">
                        <span className={`font-semibold ${p.revisit_rate >= 30 ? "text-emerald-600 dark:text-emerald-400" : "text-fg-muted"}`}>
                          {p.revisit_rate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Site Guide */}
        <SiteGuide />

        <p className="text-center text-[10px] text-fg-faint pb-4">
          Avocado Admin · {new Date().getFullYear()} · Auto-refreshes every 60s · Data from analytics.db on Lightsail
        </p>

        </>)}

      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const AUTO_REFRESH_MS = 60_000;

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);

  // Restore token from localStorage after hydration
  useEffect(() => {
    const saved = localStorage.getItem("avocado_admin_token");
    if (saved) setToken(saved);
  }, []);

  const fetchStats = (t: string, silent = false) => {
    if (!silent) setRefreshing(true);
    return fetch(`${API_BASE_URL}/stats/admin`, { headers: { Authorization: `Bearer ${t}` } })
      .then(async (res) => {
        if (!res.ok) { setToken(null); localStorage.removeItem("avocado_admin_token"); return; }
        setStats(await res.json());
        setLastUpdated(new Date());
        setSecondsAgo(0);
        setError("");
      })
      .catch(() => setError("Failed to load stats — is the backend reachable?"))
      .finally(() => setRefreshing(false));
  };

  // Initial fetch + auto-refresh every 60s
  useEffect(() => {
    if (!token) return;
    fetchStats(token);
    const interval = setInterval(() => fetchStats(token, true), AUTO_REFRESH_MS);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // "X seconds ago" ticker
  useEffect(() => {
    if (!lastUpdated) return;
    const tick = setInterval(() => {
      setSecondsAgo(Math.round((Date.now() - lastUpdated.getTime()) / 1000));
    }, 5000);
    return () => clearInterval(tick);
  }, [lastUpdated]);

  function handleAuth(t: string) {
    localStorage.setItem("avocado_admin_token", t);
    setToken(t);
  }

  function handleLogout() {
    localStorage.removeItem("avocado_admin_token");
    setToken(null);
    setStats(null);
    setLastUpdated(null);
  }

  if (!token) return <LoginForm onAuth={handleAuth} />;

  if (error && !stats) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm text-rose-600">{error}</p>
    </div>
  );

  if (!stats) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm text-fg-faint animate-pulse">Loading stats…</p>
    </div>
  );

  return (
    <Dashboard
      stats={stats}
      onLogout={handleLogout}
      onRefresh={() => token && fetchStats(token)}
      refreshing={refreshing}
      secondsAgo={secondsAgo}
      lastUpdated={lastUpdated}
    />
  );
}

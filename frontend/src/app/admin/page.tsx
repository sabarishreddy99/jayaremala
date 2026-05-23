"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api/client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PeriodStats { total_responses: number; unique_visitors: number }
interface SiteVisitStats { total_visits: number; unique_visitors: number }
interface Feedback { total: number; positive: number; negative: number; satisfaction_pct: number }
interface Question { text: string; count: number }
interface BlogPost { slug: string; views: number; claps: number }
interface BlogSummary { total_views: number; total_claps: number; posts: BlogPost[] }

interface ExperienceSummary { total: number; average: number; distribution: Record<string, number> }

interface AdminStats {
  conversations: { week: PeriodStats; month: PeriodStats; all: PeriodStats };
  feedback: Feedback;
  top_questions: Question[];
  blog: BlogSummary;
  experience: ExperienceSummary;
  site_visitors: { week: SiteVisitStats; month: SiteVisitStats; all: SiteVisitStats };
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
    heading: "Code blocks",
    code: "```python\ndef hello(): return 'hi'\n```\n\nSupported: python typescript javascript\nbash json yaml sql go rust",
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
  const conv = stats.conversations[period];
  const site = stats.site_visitors[period];
  const topPosts = [...stats.blog.posts].sort((a, b) => b.views - a.views).slice(0, 8);

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
              onClick={onLogout}
              className="text-xs text-fg-faint hover:text-fg-muted border border-border rounded-lg px-3 py-1.5 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Period tabs */}
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
            sub={`${conv.total_responses} conversations`}
          />
          <StatCard
            label="Conversations"
            value={conv.total_responses}
            sub={period === "all" ? "total" : `in the last ${period === "week" ? "7" : "30"} days`}
          />
          <StatCard
            label="Satisfaction"
            value={stats.feedback.total > 0 ? `${stats.feedback.satisfaction_pct}%` : "—"}
            sub={`from ${stats.feedback.total} rated responses`}
            color={stats.feedback.satisfaction_pct >= 70 ? "emerald" : stats.feedback.satisfaction_pct > 0 ? "rose" : "default"}
          />
          <StatCard
            label="Avg Experience"
            value={stats.experience.total > 0 ? `${stats.experience.average} ★` : "—"}
            sub={`from ${stats.experience.total} visitor rating${stats.experience.total !== 1 ? "s" : ""}`}
            color={stats.experience.average >= 4 ? "emerald" : stats.experience.average >= 3 ? "default" : stats.experience.total > 0 ? "rose" : "default"}
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
            {stats.top_questions.length === 0 ? (
              <p className="text-sm text-fg-faint">No questions logged yet.</p>
            ) : (
              <ol className="space-y-2">
                {stats.top_questions.map((q, i) => (
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
                <p className="text-xl sm:text-2xl font-bold text-fg">{stats.feedback.total}</p>
                <p className="text-[9px] sm:text-[10px] text-fg-faint mt-0.5">Total rated</p>
              </div>
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-2.5 text-center">
                <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.feedback.positive}</p>
                <p className="text-[9px] sm:text-[10px] text-emerald-700 dark:text-emerald-500 mt-0.5">👍 Positive</p>
              </div>
              <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-2.5 text-center">
                <p className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400">{stats.feedback.negative}</p>
                <p className="text-[9px] sm:text-[10px] text-rose-700 dark:text-rose-500 mt-0.5">👎 Negative</p>
              </div>
            </div>
            <SatisfactionBar positive={stats.feedback.positive} negative={stats.feedback.negative} />

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
            {stats.experience.total > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-amber-400 text-base leading-none">
                  {"★".repeat(Math.round(stats.experience.average))}
                  {"☆".repeat(5 - Math.round(stats.experience.average))}
                </span>
                <span className="text-sm font-bold text-fg">{stats.experience.average}</span>
                <span className="text-[10px] text-fg-faint">/ 5 from {stats.experience.total} rating{stats.experience.total !== 1 ? "s" : ""}</span>
              </div>
            )}
          </div>
          {stats.experience.total === 0 ? (
            <p className="text-xs text-fg-faint">No ratings yet — visitors will see the rating widget after their first chat exchange.</p>
          ) : (
            <div className="space-y-2">
              {[5,4,3,2,1].map((star) => {
                const count = stats.experience.distribution[star] ?? 0;
                const pct = stats.experience.total > 0 ? Math.round((count / stats.experience.total) * 100) : 0;
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

        {/* Site Guide */}
        <SiteGuide />

        <p className="text-center text-[10px] text-fg-faint pb-4">
          Avocado Admin · {new Date().getFullYear()} · Auto-refreshes every 60s · Data from analytics.db on Lightsail
        </p>

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

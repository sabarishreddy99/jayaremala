# itsjaya — AI Portfolio

Live at **[jayaremala.com](https://jayaremala.com)**

Personal AI-assisted portfolio for **Jaya Sabarish Reddy Remala**. Two entry points: a full-screen RAG-powered AI chatbot (Avocado) and a classic portfolio with experience, projects, education, blog, lab, and quotes. Content is editable via a token-gated admin panel without any git commits.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT BROWSER                                 │
│                                                                             │
│  ┌────────────────────────┐        ┌────────────────────────────────────┐   │
│  │   Avocado Chatbot      │        │  Portfolio + Blog + Lab + Quotes   │   │
│  │   /  and  /chat        │        │  /portfolio  /blog  /experience    │   │
│  │                        │        │  /education  /projects  /lab       │   │
│  │  ChatInterface (SSE)   │        │  /quotes                           │   │
│  │  ChatMessage (md)      │        │  BlogEngagement  BlogGuideDrawer   │   │
│  │  Model badge + stats   │        │  QuotesFeed                        │   │
│  └───────────┬────────────┘        └─────────────┬──────────────────────┘   │
│              │                                   │                          │
│  ┌────────────────────────────────────────────┐  │                          │
│  │  /admin  (no-index, token-gated)           │  │                          │
│  │  Stats dashboard · Content editors         │  │                          │
│  └────────────────────────────────────────────┘  │                          │
└──────────────┼───────────────────────────────────┼──────────────────────────┘
               │ HTTPS / SSE                       │ HTTPS REST
               ▼                                   ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│               api.jayaremala.com  (Nginx → Docker :8000)                    │
│                    AWS Lightsail 2GB  ·  Ubuntu 24.04                        │
│                    SlowAPI rate limiter (10 req/min on /ai/chat/stream)      │
│                                                                              │
│   POST /ai/chat/stream   ──►  RAG Pipeline  ──►  Gemini SSE stream           │
│   POST /ai/chat          ──►  RAG Pipeline  ──►  Gemini sync                 │
│   POST /ai/feedback      ──►  thumbs up/down + satisfaction metrics          │
│   POST /blog/{slug}/view ──►  SQLite — unique view per IP                   │
│   POST /blog/{slug}/clap ──►  SQLite — cumulative claps (max 50/user/post)  │
│   GET  /blog/{slug}/stats                                                    │
│   GET  /blog/stats/summary                                                   │
│   GET  /stats                 total_responses, unique_visitors               │
│   GET  /stats/overview        7d / 30d / 1y / all-time for all metrics      │
│   POST /stats/visit           record page visit + geo lookup                 │
│   POST /stats/experience-rating  1–5 star UX rating                         │
│   GET  /stats/admin           full breakdown (ADMIN_TOKEN)                   │
│   GET  /content/blog          public blog post list                          │
│   GET  /content/blog/{slug}                                                  │
│   POST /content/blog · PUT · DELETE   (ADMIN_TOKEN)                         │
│   GET  /content/lab · POST · PUT · DELETE   (ADMIN_TOKEN)                   │
│   GET  /content/quotes · POST · PUT · DELETE   (ADMIN_TOKEN)                │
│   POST /admin/reingest        force re-embed (ADMIN_TOKEN required)          │
│   GET  /health                api · analytics_db · content_db · rag         │
│                                                                              │
│  ┌──────────────────────────┐    ┌────────────────────────────────────────┐  │
│  │      RAG Store           │    │  SQLite  analytics.db                  │  │
│  │  ChromaDB (persistent)   │    │  /data/analytics.db (Lightsail SSD)   │  │
│  │  fastembed ONNX embed    │    │   ├─ interactions  (chat analytics)   │  │
│  │  bge-base-en-v1.5 (768d) │    │   ├─ site_visits  (page + geo)       │  │
│  │  HyDE parallel retrieval │    │   ├─ blog_views   (unique/IP/post)    │  │
│  │  BM25 (rank_bm25)        │    │   ├─ blog_claps   (≤50/user/post)    │  │
│  │  RRF merge + graph       │    │   ├─ feedback     (thumbs + hash)     │  │
│  └──────────────────────────┘    │   ├─ questions    (top-N tracking)   │  │
│                                  │   └─ experience_ratings (1–5 UX)     │  │
│  ┌────────────────────────────┐  └────────────────────────────────────────┘  │
│  │  SQLite  content.db        │                                              │
│  │  /data/content.db          │  Daily backup ──► S3 (7-day retain)         │
│  │   ├─ blog_posts            │                                              │
│  │   ├─ lab_entries           │                                              │
│  │   └─ quotes                │                                              │
│  │  Write → regen JSON        │                                              │
│  │        → run_ingest()      │                                              │
│  └────────────────────────────┘                                              │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  Knowledge Base  backend/data/knowledge/                               │  │
│  │  profile.json  experience.json  education.json  projects.json          │  │
│  │  skills.json   testimonials.json   gallery.json                        │  │
│  │  quotes.json   blog.json   lab.json                                    │  │
│  │  (quotes·blog·lab JSON auto-regenerated from content.db on write)      │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
               │
               │ Google AI API
               ▼
┌───────────────────────────────────────┐
│  Gemini 2.5 Flash  (primary)          │
│  + fallback chain on 503 / 429        │
└───────────────────────────────────────┘
```

---

## RAG Pipeline

Every `/ai/chat/stream` request runs a 6-stage hybrid retrieval pipeline before Gemini sees the message.

```
User message
     │
     ▼
┌────────────────────────────────────────────────┐
│  Stage 1 — QUERY EXPANSION                    │
│  Up to 4 targeted query variants:             │
│  • Verbatim user message                      │
│  • Name-anchored ("... Jaya Sabarish Reddy")  │
│  • Topic keyword (project / skills / award /  │
│    experience / contact / education)          │
│  • Recent conversation context (follow-ups)   │
└────────────────────┬───────────────────────────┘
                     │ 4 queries
     ┌───────────────┼───────────────┐
     ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐
│ Stage 2a     │ │ Stage 2b     │ │ Stage 2c LEXICAL          │
│ HyDE         │ │ DENSE        │ │ BM25 (rank_bm25 Okapi)    │
│ (Gao 2022)   │ │ ChromaDB     │ │ Sync — runs while async   │
│ Generate     │ │ bge-base     │ │ tasks are in flight        │
│ hypothetical │ │ -en-v1.5     │ │ Catches exact matches:    │
│ answer →     │ │ 768-dim ONNX │ │ "3000 RPS", "Qualcomm"   │
│ embed it     │ │ HNSW cosine  │ │ top-15 results            │
│ → top-8 hits │ │ top-6/query  │ │                           │
│ (4s timeout) │ │ (batched)    │ │                           │
└──────┬───────┘ └──────┬───────┘ └────────────┬─────────────┘
       └────────────────┴──────────────────────┘
                         ▼
┌────────────────────────────────────────────────┐
│  Stage 3 — RECIPROCAL RANK FUSION              │
│  score(doc) = Σ 1 / (60 + rank_i)             │
│  Merges dense + HyDE + lexical                 │
│  → up to 20 candidates                         │
└────────────────────┬───────────────────────────┘
                     ▼
┌────────────────────────────────────────────────┐
│  Stage 4 — TOP-5 BY RRF SCORE                  │
│  Returns top 5 chunks ordered by RRF score     │
│  (cross-encoder reranker scaffolded,           │
│   gated on 4GB RAM upgrade)                    │
└────────────────────┬───────────────────────────┘
                     ▼
┌────────────────────────────────────────────────┐
│  Stage 5 — KNOWLEDGE GRAPH EXPANSION           │
│  1-hop traversal from retrieved doc IDs:       │
│  • project doc  → skill category docs          │
│  • experience doc → project docs               │
│  • project doc  → experience doc               │
│  Up to +2 related docs from the RRF-20 pool    │
│  (no extra ChromaDB call — zero latency)       │
└────────────────────┬───────────────────────────┘
                     ▼
         Up to 7 chunks injected into Gemini
         system prompt as context
                     │
                     ▼
         SSE tokens streamed to client
```

### Knowledge document types

| Type | Source | Strategy |
|---|---|---|
| `profile` | profile.json | 6 docs: overview, bio, contact, focus/obsession, now block, availability |
| `experience` | experience.json | Overview + one doc per bullet per role |
| `education` | education.json | Overview + one doc per highlight per degree |
| `project` | projects.json | Overview + tech stack per project |
| `skills` | skills.json | One doc per category + one aggregated |
| `testimonial` | testimonials.json | One doc per recommendation |
| `quote` | quotes.json (auto-regenerated from content.db) | One doc per curated quote |
| `gallery` | gallery.json | One doc per milestone or achievement |
| `faq` | Dynamically built in `_build_faq_documents()` + `_build_system_faq_documents()` | Per-employer summaries, awards, education, resume, contact, blog/lab/quotes live counts, portfolio architecture — no hardcoded personal content |
| `blog` | blog.json (auto-regenerated from content.db) | One doc per post (title + description + 2k body chars) |
| `lab` | lab.json (auto-regenerated from content.db) | One doc per entry (title + description + 3k body chars) |

Total: **~124 atomic documents** across 11 types. All personal content is generated dynamically from the JSON files — adding a new job, project, blog post, or quote is reflected in the knowledge base automatically on the next ingest.

All documents store a fine-grained `entity_type` metadata field (`experience_overview`, `experience_bullet`, `project_tech`, `education_highlight`, `faq_company`, `quote`, `gallery`, etc.) enabling the graph expansion and future metadata-filtered queries.

### Incremental per-document ingest

On every startup, `run_ingest()` diffs the current document set against `.doc_hashes.json` (per-document SHA-256 hashes stored on the Lightsail SSD alongside ChromaDB). Only what changed is re-embedded:

| Change | Action |
|---|---|
| New document | `collection.upsert()` — embedded and added |
| Modified document | `collection.upsert()` — re-embedded in place |
| Removed document | `collection.delete()` — purged from ChromaDB |
| Unchanged document | Skipped — no embedding call, no I/O |

Before building the document list, `run_ingest()` calls `_sync_content_db()` — a lazy-import function that calls `regenerate_blog_json()`, `regenerate_lab_json()`, and `regenerate_quotes_json()` in sequence, syncing content.db → JSON before the diff runs. This ensures the knowledge base always reflects the live content.db state, not a stale snapshot.

Adding one blog post embeds one document, not the entire corpus. A forced full re-embed via `POST /admin/reingest?force=true` (requires `ADMIN_TOKEN` bearer token) wipes ChromaDB with `reset_collection()` and rebuilds all 124 documents from scratch — useful after structural changes to ingest.py.

**Embedding model change detection**: If the stored `EMBED_MODEL` name in `.doc_hashes.json` differs from the current constant, `reset_collection()` wipes the ChromaDB collection and a full reingest runs automatically. No manual ChromaDB deletion needed when switching embedding models.

### Gemini fallback chain

On 503 (UNAVAILABLE) or 429 (RESOURCE_EXHAUSTED), the backend retries through the chain automatically:

```
GEMINI_MODEL           primary     (default: gemini-2.5-flash)
GEMINI_FALLBACK_MODELS fallbacks   (gemini-2.0-flash, gemini-2.0-flash-lite, gemini-flash-latest)
```

---

## Content API — CRUD without git

Blog posts, lab entries, and quotes are stored in `content.db` (SQLite on Lightsail SSD). The `/content/*` API exposes public GET endpoints and token-gated write endpoints.

After every write, a background task calls the appropriate `regenerate_*_json()` function (`regenerate_blog_json()`, `regenerate_lab_json()`, or `regenerate_quotes_json()`) and then `run_ingest()` so ChromaDB stays in sync with zero user-visible latency (only changed documents are re-embedded).

The database is seeded from existing JSON files on first startup — no manual migration needed.

---

## Data Flow — Single Source of Truth

```
backend/data/knowledge/*.json   ← EDIT HERE ONLY (for profile, experience, etc.)
        │
        │  scripts/sync-knowledge.mjs
        │  (auto-runs via npm predev / prebuild)
        │
        ├──► frontend/src/data/knowledge/   (synced copies — do not edit directly)
        │    TypeScript files import from these with typed interfaces
        │
        └──► blog.json + lab.json are also regenerated from content.db
             after any content API write (background task → run_ingest())
```

### CI/CD pipeline on every push to main

```
git push origin main
        │
        ▼  GitHub Actions
        │
        ├── npm install
        ├── npm run build
        │     └── prebuild: sync-knowledge.mjs
        │           ├── parses all MDX frontmatter + body
        │           └── writes blog.json + lab.json
        │
        ├── commits synced files [skip ci]
        │     (prevents infinite workflow loop)
        │
        ├── uploads frontend/out/ → GitHub Pages (jayaremala.com)
        │
        └── SSH into AWS Lightsail (infra/scripts/deploy.sh)
              │
              ├── AUTO-RESTORE: if /data/analytics.db missing
              │     └── aws s3 cp latest_analytics.db /data/analytics.db
              ├── tag :latest as :previous (enables 1-command rollback)
              ├── docker build → itsjaya-backend:latest
              ├── docker run on port 8001 (staging container)
              ├── health check loop — up to 120s for ONNX warmup
              │     ├── PASS → stop old :8000, start new :8000, done
              │     └── FAIL → remove staging container, old stays live
              └── docker image prune -f (keep :previous)

Rollback anytime:  bash /home/ubuntu/itsjaya/infra/scripts/rollback.sh
```

---

## Analytics Architecture

All engagement data lives in `analytics.db`. Content lives in `content.db`. IPs are SHA-256 hashed — never stored raw. Daily backup to S3 with 7-day retention.

```
/data/analytics.db  (Lightsail SSD)
├── interactions
│   ├── ip_hash     TEXT       SHA-256 of visitor IP / x-visitor-id UUID
│   └── created_at  TIMESTAMP
│       → unique_visitors, total_responses
│       → time-filtered: 7d / 30d / 1y / all-time
│
├── site_visits
│   ├── ip_hash     TEXT
│   ├── page        TEXT       e.g. "/portfolio", "/blog/my-post"
│   ├── country     TEXT       resolved async via geo API
│   ├── city        TEXT
│   └── created_at  TIMESTAMP
│
├── blog_views
│   ├── slug        TEXT
│   ├── ip_hash     TEXT
│   └── created_at  TIMESTAMP
│   UNIQUE(slug, ip_hash)   ← one view per IP per post (idempotent)
│
├── blog_claps
│   ├── slug        TEXT
│   ├── ip_hash     TEXT
│   ├── count       INTEGER    cumulative, capped at 50 per user per post
│   └── updated_at  TIMESTAMP
│   UNIQUE(slug, ip_hash)
│
├── feedback
│   ├── message_hash  TEXT
│   ├── rating        INTEGER    +1 or -1
│   └── created_at    TIMESTAMP
│
├── questions
│   ├── text        TEXT
│   ├── count       INTEGER    incremented on each occurrence
│   └── updated_at  TIMESTAMP
│
└── experience_ratings
    ├── rating      INTEGER    1–5 UX star rating
    └── created_at  TIMESTAMP

/data/content.db  (Lightsail SSD)
├── blog_posts   (slug, title, date, published_at, description, tags, content, published)
├── lab_entries  (slug, title, status, description, started_at, tech, links, content)
└── quotes       (quote_id, text, author, source, category, favorite, featured, added_at)

Daily S3 backup → s3://itsjaya-backups-analytics/analytics_db/
  Keeps 7 days of timestamped snapshots + latest_analytics.db
  Restore: aws s3 cp s3://itsjaya-backups-analytics/analytics_db/latest_analytics.db /data/analytics.db
  Auto-restore on deploy if /data/analytics.db is missing
```

---

## Frontend Architecture

### Routing

| Route | Notes |
|---|---|
| `/` | Avocado — full-screen chatbot, no nav/footer |
| `/chat` | Same chatbot, accessible from portfolio nav |
| `/portfolio` | Hero with domain chips, featured projects, skills, testimonials, contact |
| `/experience` | Work history timeline |
| `/education` | Education cards |
| `/projects` | Project grid with source link pill tag buttons |
| `/blog` | Index sorted by `publishedAt` (immutable sort key) |
| `/blog/[slug]` | Post rendered in Source Serif 4 font |
| `/lab` | Living system design docs index |
| `/lab/[slug]` | Individual system design entry |
| `/quotes` | Curated quotes by category (Philosophy, Engineering, Science, etc.) |
| `/gallery` | Photo grid — milestones, events, and achievements |
| `/now` | What Jaya is currently building, learning, and reading |
| `/admin` | Stats dashboard + content editors (no-index, token-gated) |

All portfolio routes share a layout via the `(portfolio)` route group — adds no URL segment.

### Static export + custom domain

Next.js outputs a fully static site (`output: "export"`) deployed to GitHub Pages at `jayaremala.com`. No `basePath` — the site lives at the domain root. Always use `<Link>` from `next/link` for internal navigation, never plain `<a>` tags.

### Blog engagement components

| Component | Responsibility |
|---|---|
| `BlogIndexStats` | Card grid with sort controls (Latest / Oldest / Popular), tag filter with horizontal scroll on mobile, and per-post stats. Fetches engagement summary from `/blog/stats/summary`. |
| `BlogCoverSVG` | Deterministic SVG cover art generated from slug — 4 pattern types (dot constellation, sine waves, geometric rings, circuit traces) selected by FNV-1a hash. All colours use CSS custom properties for light/dark mode. |
| `BlogEngagement` | Client component on each post page — records view on mount, clap button with 1.5s debounce batching, max 50 claps/user/post, float-up animation |
| `BlogGuideDrawer` | Floating button — MDX reference + live stats dashboard (`/stats/overview`) with 7d/30d/1y/all-time period table + per-post breakdown |

---

## Repository Layout

```
itsjaya/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx                    Avocado chatbot
│   │   │   ├── (portfolio)/layout.tsx      Nav + Footer + mobile FAB
│   │   │   ├── (portfolio)/page.tsx        Portfolio home
│   │   │   ├── (portfolio)/blog/page.tsx   Blog index
│   │   │   ├── (portfolio)/blog/[slug]/    Blog post
│   │   │   ├── (portfolio)/lab/page.tsx    Lab index
│   │   │   ├── (portfolio)/lab/[slug]/     Lab entry
│   │   │   ├── (portfolio)/quotes/page.tsx QuotesFeed
│   │   │   ├── (portfolio)/gallery/page.tsx Photo grid — milestones + achievements
│   │   │   ├── (portfolio)/now/page.tsx    Current status (building/learning/reading)
│   │   │   └── admin/                      Stats dashboard + content editors
│   │   ├── components/
│   │   │   ├── chat/                       ChatInterface, ChatMessage, ChatInput
│   │   │   ├── blog/                       BlogIndexStats (card grid + sort + SVG art),
│   │   │   │                               BlogCoverSVG (4-pattern FNV-1a),
│   │   │   │                               BlogEngagement, BlogGuideDrawer
│   │   │   ├── lab/                        LabMDXComponents (Status, Decision,
│   │   │   │                               Update, Stack, Metric, ArchBlock)
│   │   │   ├── admin/                      ContentBlogEditor, ContentLabEditor,
│   │   │   │                               ContentQuotesEditor, KnowledgeBaseEditor,
│   │   │   │                               AvailabilityEditor, KnowledgeDataView,
│   │   │   │                               ProfileEditor (all page descriptions editable)
│   │   │   ├── GalleryGrid.tsx             Photo grid client component
│   │   │   └── QuotesClient.tsx            Quotes feed with category filter
│   │   ├── data/knowledge/                 Synced JSON copies (do not edit)
│   │   ├── data/*.ts                       Typed re-exports
│   │   ├── lib/blog.ts                     MDX loader, sorts by publishedAt
│   │   ├── lib/lab.ts                      Lab entry loader
│   │   ├── content/blog/*.mdx              Blog post source files
│   │   └── content/lab/*.mdx              Lab system design entries
│   ├── public/
│   │   ├── blog/                           Blog images
│   │   └── CNAME                           jayaremala.com (GitHub Pages domain)
│   └── next.config.ts                      output: export (no basePath)
│
├── backend/
│   ├── src/app/
│   │   ├── main.py                         FastAPI + lifespan + SlowAPI middleware
│   │   ├── core/settings.py                Pydantic settings (incl. content_db_path)
│   │   ├── core/limiter.py                 SlowAPI Limiter (X-Forwarded-For aware)
│   │   ├── routers/admin.py                POST /admin/reingest (token-gated)
│   │   ├── routers/ai.py                   /ai/* endpoints + HyDE + RAG orchestration
│   │   ├── routers/blog.py                 /blog/* engagement endpoints
│   │   ├── routers/content.py              /content/* CRUD (blog, lab, quotes)
│   │   ├── routers/stats.py                /stats · /stats/overview · /stats/admin
│   │   ├── rag/store.py                    ChromaDB + BM25 + RRF (fastembed ONNX, bge-base-en-v1.5 768-dim)
│   │   ├── rag/ingest.py                   Per-doc hash diff · auto-wipe on model change ·
│   │   │                                   _sync_content_db() · _build_faq_documents() (fully dynamic)
│   │   │                                   _build_system_faq_documents() · ~124 docs / 11 types
│   │   ├── rag/graph.py                    Static knowledge graph — build_graph() + expand_context()
│   │   ├── db/analytics.py                 Chat + site analytics (period-aware, geo lookup)
│   │   ├── db/blog_stats.py                Blog views + claps (period-aware)
│   │   └── db/content.py                   Blog/lab/quotes CRUD + regenerate_blog_json()
│   │                                       regenerate_lab_json() · regenerate_quotes_json()
│   ├── data/knowledge/                     Single source of truth (edit here)
│   │   ├── profile.json  experience.json  education.json  projects.json
│   │   ├── skills.json   testimonials.json   gallery.json
│   │   └── quotes.json  blog.json  lab.json  (quotes·blog·lab auto-regenerated from content.db)
│   └── Dockerfile                          python:3.11-slim
│
├── infra/
│   ├── compose.yml                         Docker Compose (local dev)
│   ├── docker/                             Dockerfiles for local dev
│   └── scripts/
│       ├── deploy.sh                       Zero-downtime blue-green deploy
│       ├── rollback.sh                     1-command rollback to :previous image
│       └── backup.sh                       analytics.db → S3 (daily cron)
│
├── scripts/sync-knowledge.mjs              MDX → blog.json + lab.json + JSON → frontend sync
└── .github/workflows/deploy.yml           GH Actions: frontend + backend CI/CD
```

---

## Local Development

```bash
# 1. Environment
cp .env.example .env
# Fill in: GOOGLE_API_KEY, NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# 2. Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --app-dir src --reload
# → http://localhost:8000  (auto-ingests knowledge base on first start)

# 3. Frontend (separate terminal)
cd frontend
npm install
npm run dev
# → Runs sync-knowledge.mjs first, then http://localhost:3000

# 4. Or with Docker Compose
docker compose -f infra/compose.yml up --build
```

```bash
# Sync backend JSON → frontend (after editing any knowledge/*.json)
node scripts/sync-knowledge.mjs

# Force full re-ingest of ChromaDB
cd backend/src && python -m app.rag.ingest

# Lint / test
cd frontend && npm run lint
cd backend  && ruff check src && pytest
```

---

## Environment Variables

### Frontend

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000` | Backend URL (production: `https://api.jayaremala.com`) |
| `NEXT_PUBLIC_BLOG_FONT` | `Source_Serif_4` | Documents font choice (static import in layout.tsx) |

### Backend (set in `/home/ubuntu/itsjaya.env` on Lightsail)

| Variable | Default | Purpose |
|---|---|---|
| `GOOGLE_API_KEY` | — | Required — Google AI API key |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Primary model |
| `GEMINI_FALLBACK_MODELS` | `gemini-2.0-flash,...` | Comma-separated fallbacks on 503/429 |
| `ANALYTICS_DB_PATH` | `./chroma_db/analytics.db` | Set to `/data/analytics.db` on Lightsail |
| `CONTENT_DB_PATH` | `./chroma_db/content.db` | Set to `/data/content.db` on Lightsail |
| `CHROMA_DB_PATH` | `./chroma_db` | Set to `/data/chroma_db` on Lightsail |
| `FRONTEND_ORIGIN` | `http://localhost:3000` | CORS allowed origins |
| `APP_ENV` | `dev` | Set to `production` on Lightsail |
| `ADMIN_TOKEN` | `` | Bearer token for write endpoints + admin stats; empty = disabled |

---

## Deployment

| Layer | Platform | Trigger |
|---|---|---|
| Frontend | GitHub Pages → `jayaremala.com` | Push to `main` → GH Actions builds + deploys |
| Backend API | AWS Lightsail 2GB (`api.jayaremala.com`) | Push to `main` → SSH → zero-downtime deploy |
| Knowledge base | Lightsail SSD (`/data/chroma_db`) | Incremental ingest on startup — only changed docs re-embedded |
| Analytics DB | Lightsail SSD (`/data/analytics.db`) | Persists on disk, daily backup to S3 |
| Content DB | Lightsail SSD (`/data/content.db`) | Persists on disk; writes trigger background re-ingest |
| Analytics backup | S3 `itsjaya-backups-analytics` | Daily cron at 02:00 UTC, 7-day retention |

The only action required for any update — portfolio data, new blog post, or code change — is `git push`. For content edits, the admin panel triggers updates immediately via the content API.

### Best practices in production

| Practice | Implementation |
|---|---|
| Zero-downtime deploy | New container health-checked on :8001 before old :8000 is stopped |
| Automatic rollback | `bash infra/scripts/rollback.sh` → restarts `:previous` image |
| Data backup | Daily S3 backup; auto-restored from S3 if `/data/analytics.db` missing on deploy |
| Log rotation | Docker `json-file` driver, `max-size=10m`, `max-file=3` |
| HTTPS | Nginx + Let's Encrypt (Certbot auto-renews) |
| IP privacy | All IPs SHA-256 hashed before storage, never stored raw |
| Rate limiting | SlowAPI 10 req/min on `/ai/chat/stream` |
| Secrets | `.env` file on server only, never committed; GitHub secrets for CI/CD |

---

Built by [Jaya Sabarish Reddy Remala](https://linkedin.com/in/jayasabarishreddyr) — NYU Tandon CS MS · Qualcomm Edge AI Hackathon Winner · formerly NYU IT, Shell PLC, Wipro.

→ [Resume](https://drive.google.com/drive/u/0/folders/1vm35z-6VQjtO9A8ZBgCvvSP_7_POPTrV) · [GitHub](https://github.com/sabarishreddy99) · [LinkedIn](https://linkedin.com/in/jayasabarishreddyr)

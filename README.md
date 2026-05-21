# itsjaya — AI Portfolio

Live at **[jayaremala.com](https://jayaremala.com)**

Personal AI-assisted portfolio for **Jaya Sabarish Reddy Remala**. Two entry points: a full-screen RAG-powered AI chatbot (Avocado) and a classic portfolio with experience, projects, education, and a blog with engagement tracking.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT BROWSER                                 │
│                                                                             │
│  ┌────────────────────────┐        ┌────────────────────────────────────┐   │
│  │   Avocado Chatbot      │        │    Portfolio + Blog + Lab          │   │
│  │   /  and  /chat        │        │  /portfolio  /blog  /experience    │   │
│  │                        │        │  /education  /projects  /lab       │   │
│  │  ChatInterface (SSE)   │        │  BlogPostList  BlogEngagement      │   │
│  │  ChatMessage (md)      │        │  BlogIndexStats  BlogGuideDrawer   │   │
│  │  Model badge + stats   │        │  (live stats dashboard inside)     │   │
│  └───────────┬────────────┘        └─────────────┬──────────────────────┘   │
│              │                                   │                          │
└──────────────┼───────────────────────────────────┼──────────────────────────┘
               │ HTTPS / SSE                       │ HTTPS REST
               ▼                                   ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│               api.jayaremala.com  (Nginx → Docker :8000)                    │
│                    AWS Lightsail 2GB  ·  Ubuntu 24.04                        │
│                                                                              │
│   POST /ai/chat/stream   ──►  RAG Pipeline  ──►  Gemini SSE stream           │
│   POST /ai/chat          ──►  RAG Pipeline  ──►  Gemini sync                 │
│   POST /blog/{slug}/view ──►  SQLite — unique view per IP                   │
│   POST /blog/{slug}/clap ──►  SQLite — cumulative claps (max 50/user/post)  │
│   GET  /blog/{slug}/stats                                                    │
│   GET  /blog/stats/summary                                                   │
│   GET  /stats                 total_responses, unique_visitors               │
│   GET  /stats/overview        7d / 30d / 1y / all-time for all metrics      │
│   GET  /health                                                               │
│   POST /admin/reingest        force re-embed (ADMIN_TOKEN required)          │
│                                                                              │
│  ┌──────────────────────────┐    ┌────────────────────────────────────────┐  │
│  │      RAG Store           │    │  SQLite  analytics.db                  │  │
│  │  ChromaDB (persistent)   │    │  /data/analytics.db (Lightsail SSD)   │  │
│  │  fastembed ONNX embed    │    │   ├─ interactions  (chat analytics)   │  │
│  │  all-MiniLM-L6-v2        │    │   ├─ blog_views   (unique/IP/post)    │  │
│  │  BM25 (rank_bm25)        │    │   └─ blog_claps   (≤50/user/post)    │  │
│  │  RRF merge               │    │  Daily backup ──► S3 (7-day retain)   │  │
│  └──────────────────────────┘    └────────────────────────────────────────┘  │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  Knowledge Base  backend/data/knowledge/                               │  │
│  │  profile.json  experience.json  education.json  projects.json          │  │
│  │  skills.json   testimonials.json   blog.json (auto-generated)          │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
               │
               │ Google AI API
               ▼
┌───────────────────────────────────┐
│  Gemini 2.5 Flash  (primary)      │
│  + fallback chain on 503 / 429    │
└───────────────────────────────────┘
```

---

## RAG Pipeline

Every `/ai/chat/stream` request runs a 4-stage hybrid retrieval pipeline before Gemini sees the message.

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
         ┌───────────┴────────────┐
         ▼                        ▼
┌─────────────────┐    ┌──────────────────────────┐
│ Stage 2a DENSE  │    │ Stage 2b LEXICAL          │
│ ChromaDB query  │    │ BM25 (rank_bm25 Okapi)    │
│ all-MiniLM-L6   │    │ Catches exact keyword     │
│ fastembed ONNX  │    │ matches: "3000 RPS",      │
│ HNSW cosine     │    │ "Qualcomm", "SnapLog",    │
│ Batched encode  │    │ company names, numbers    │
│ top-6 / query   │    │ top-15 results            │
└────────┬────────┘    └────────────┬─────────────┘
         └──────────┬───────────────┘
                    ▼
┌────────────────────────────────────────────────┐
│  Stage 3 — RECIPROCAL RANK FUSION              │
│  score(doc) = Σ 1 / (60 + rank_i)             │
│  k=60 from Cormack et al. 2009                 │
│  Merges dense + lexical → up to 20 candidates  │
└────────────────────┬───────────────────────────┘
                     ▼
┌────────────────────────────────────────────────┐
│  Stage 4 — TOP-N BY RRF SCORE                  │
│  Returns top 5 chunks ordered by RRF score     │
│  (fastembed ONNX replaces PyTorch/torch)        │
└────────────────────┬───────────────────────────┘
                     ▼
         Chunks injected into Gemini
         system prompt as context
                     │
                     ▼
         SSE tokens streamed to client
```

### Knowledge document types

| Type | Source | Strategy |
|---|---|---|
| `profile` | profile.json | 3 docs: overview, bio, contact |
| `experience` | experience.json | Overview + one doc per bullet per role |
| `education` | education.json | Overview + one doc per highlight per degree |
| `project` | projects.json | Overview + tech stack per project |
| `skills` | skills.json | One doc per category + one aggregated |
| `faq` | Hard-coded in ingest.py | Pre-answers common recruiter questions |
| `blog` | blog.json (auto-generated) | One doc per post (title + description + 2k body chars) |

### Incremental per-document ingest

On every startup, `run_ingest()` diffs the current document set against `.doc_hashes.json` (per-document SHA-256 hashes stored on the Lightsail SSD alongside ChromaDB). Only what changed is re-embedded:

| Change | Action |
|---|---|
| New document | `collection.upsert()` — embedded and added |
| Modified document | `collection.upsert()` — re-embedded in place |
| Removed document | `collection.delete()` — purged from ChromaDB |
| Unchanged document | Skipped — no embedding call, no I/O |

Adding one blog post embeds one document, not the entire corpus. A forced full re-embed is available via `POST /admin/reingest?force=true` (requires `ADMIN_TOKEN` bearer token).

### Gemini fallback chain

On 503 (UNAVAILABLE) or 429 (RESOURCE_EXHAUSTED), the backend retries through the chain automatically:

```
GEMINI_MODEL           primary     (default: gemini-2.5-flash)
GEMINI_FALLBACK_MODELS fallbacks   (gemini-2.0-flash, gemini-2.0-flash-lite, gemini-flash-latest)
```

---

## Data Flow — Single Source of Truth

```
backend/data/knowledge/*.json   ← EDIT HERE ONLY
        │
        │  scripts/sync-knowledge.mjs
        │  (auto-runs via npm predev / prebuild)
        │
        ├──► frontend/src/data/knowledge/   (synced copies — do not edit directly)
        │    TypeScript files import from these with typed interfaces
        │
        └──► backend/data/knowledge/blog.json
             (generated from frontend/src/content/blog/*.mdx)
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
        │           └── writes blog.json
        │
        ├── commits synced files [skip ci]
        │     (prevents infinite workflow loop)
        │
        ├── uploads frontend/out/ → GitHub Pages (jayaremala.com)
        │
        └── SSH into AWS Lightsail (infra/scripts/deploy.sh)
              │
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

All engagement data lives in a single SQLite file on the Lightsail SSD. IPs are SHA-256 hashed — never stored raw. Daily backup to S3 with 7-day retention.

```
/data/analytics.db  (Lightsail SSD)
├── interactions
│   ├── ip_hash     TEXT       SHA-256 of visitor IP
│   └── created_at  TIMESTAMP
│       → unique_visitors, total_responses
│       → time-filtered: 7d / 30d / 1y / all-time
│
├── blog_views
│   ├── slug        TEXT
│   ├── ip_hash     TEXT
│   └── created_at  TIMESTAMP
│   UNIQUE(slug, ip_hash)   ← one view per IP per post (idempotent)
│
└── blog_claps
    ├── slug        TEXT
    ├── ip_hash     TEXT
    ├── count       INTEGER    cumulative, capped at 50 per user per post
    └── updated_at  TIMESTAMP
    UNIQUE(slug, ip_hash)

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

All portfolio routes share a layout via the `(portfolio)` route group — adds no URL segment.

### Static export + custom domain

Next.js outputs a fully static site (`output: "export"`) deployed to GitHub Pages at `jayaremala.com`. No `basePath` — the site lives at the domain root. Always use `<Link>` from `next/link` for internal navigation, never plain `<a>` tags.

### Blog engagement components

| Component | Responsibility |
|---|---|
| `BlogPostList` | Client component — owns summary fetch + renders post cards with per-post stats |
| `BlogIndexStats` | Client component — total claps + views in blog header |
| `BlogEngagement` | Client component on each post page — records view on mount, clap button with 1.5s debounce batching, max 50 claps/user/post, float-up animation |
| `BlogGuideDrawer` | Floating button above Avocado FAB on mobile — MDX reference + live stats dashboard (`/stats/overview`) with 7d/30d/1y/all-time period table + per-post breakdown |

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
│   │   │   └── (portfolio)/lab/[slug]/     Lab entry
│   │   ├── components/
│   │   │   ├── chat/                       ChatInterface, ChatMessage, ChatInput
│   │   │   ├── blog/                       BlogEngagement, BlogIndexStats,
│   │   │   │                               BlogPostList, BlogGuideDrawer
│   │   │   └── lab/                        LabMDXComponents (Status, Decision,
│   │   │                                   Update, Stack, Metric, ArchBlock)
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
│   │   ├── main.py                         FastAPI + lifespan
│   │   ├── core/settings.py                Pydantic settings (incl. chroma_db_path)
│   │   ├── routers/admin.py                POST /admin/reingest (token-gated)
│   │   ├── routers/ai.py                   /ai/* endpoints + RAG orchestration
│   │   ├── routers/blog.py                 /blog/* engagement endpoints
│   │   ├── routers/stats.py                /stats  /stats/overview
│   │   ├── rag/store.py                    ChromaDB + BM25 + RRF (fastembed ONNX)
│   │   ├── rag/ingest.py                   Incremental ingest — per-doc hash diff, upsert/delete
│   │   ├── db/analytics.py                 Chat analytics (period-aware)
│   │   └── db/blog_stats.py                Blog views + claps (period-aware)
│   ├── data/knowledge/                     Single source of truth (edit here)
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
├── scripts/sync-knowledge.mjs              MDX → blog.json + JSON → frontend sync
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
| `CHROMA_DB_PATH` | `./chroma_db` | Set to `/data/chroma_db` on Lightsail |
| `FRONTEND_ORIGIN` | `http://localhost:3000` | CORS allowed origins |
| `APP_ENV` | `dev` | Set to `production` on Lightsail |
| `ADMIN_TOKEN` | `` | Bearer token for `POST /admin/reingest`; empty = endpoint disabled |

---

## Deployment

| Layer | Platform | Trigger |
|---|---|---|
| Frontend | GitHub Pages → `jayaremala.com` | Push to `main` → GH Actions builds + deploys |
| Backend API | AWS Lightsail 2GB (`api.jayaremala.com`) | Push to `main` → SSH → zero-downtime deploy |
| Knowledge base | Lightsail SSD (`/data/chroma_db`) | Incremental ingest on startup — only changed docs re-embedded |
| Analytics DB | Lightsail SSD (`/data/analytics.db`) | Persists on disk, daily backup to S3 |
| Analytics backup | S3 `itsjaya-backups-analytics` | Daily cron at 02:00 UTC, 7-day retention |

The only action required for any update — portfolio data, new blog post, or code change — is `git push`.

### Best practices in production

| Practice | Implementation |
|---|---|
| Zero-downtime deploy | New container health-checked on :8001 before old :8000 is stopped |
| Automatic rollback | `bash infra/scripts/rollback.sh` → restarts `:previous` image |
| Data backup | Daily S3 backup; auto-restored from S3 if `/data/analytics.db` missing on deploy |
| Log rotation | Docker `json-file` driver, `max-size=10m`, `max-file=3` |
| HTTPS | Nginx + Let's Encrypt (Certbot auto-renews) |
| IP privacy | All IPs SHA-256 hashed before storage, never stored raw |
| Secrets | `.env` file on server only, never committed; GitHub secrets for CI/CD |

---

Built by [Jaya Sabarish Reddy Remala](https://linkedin.com/in/jayasabarishreddyr) — NYU Tandon CS MS · Qualcomm Edge AI Hackathon Winner · formerly NYU IT, Shell PLC, Wipro.

→ [Resume](https://drive.google.com/drive/u/0/folders/1vm35z-6VQjtO9A8ZBgCvvSP_7_POPTrV) · [GitHub](https://github.com/sabarishreddy99) · [LinkedIn](https://linkedin.com/in/jayasabarishreddyr)

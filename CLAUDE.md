# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

For the full human-facing tour (system diagram, deployment topology, design
notes) read the root [`README.md`](README.md). This file is the working map.

---

## What this project is

Personal AI-assisted portfolio for Jaya Sabarish Reddy Remala (`jayaremala.com`),
plus two additional sites that ship from the same static export. Three surfaces:

| Surface | Where | What |
|---|---|---|
| Portfolio + Avocado chatbot | `jayaremala.com` | The main site |
| gradeVITian | `gradevitian.jayaremala.com` | VIT student-tools app |
| VRF Bricks | `vrfbricks.jayaremala.com` | A real brick-yard business site |

The frontend is a **Next.js static export** (`output: "export"`). There is no
Node server in production — GitHub Pages serves the apex domain and nginx on a
Lightsail box serves the two subdomains from the same `out/` directory.

The backend is a **FastAPI** app on the same Lightsail box behind
`api.jayaremala.com`, deployed as a Docker image from GHCR.

---

## Repository layout

```
backend/          FastAPI service (RAG chatbot, analytics, gradeVITian, admin)
  data/knowledge/   ← SINGLE SOURCE OF TRUTH for all portfolio content
  data/gradevitian/ curated VIT regulations + rulebook retrieval corpus
  src/app/          application package (installed editable, src layout)
  Dockerfile        the image CI builds and ships
frontend/         Next.js 16 static export — all three sites
docs/             long-form docs and reference material
infra/            compose file, nginx vhosts, deploy/rollback scripts
scripts/          repo-level codegen (knowledge sync, sitemap generation)
```

Each service owns its own `Dockerfile` and `.dockerignore`. `infra/compose.yml`
builds from those same files so the local image matches what CI builds.

---

## Routing

`/` is the **portfolio home**, not the chatbot. There is no `/portfolio` route —
the `(portfolio)` route group adds no URL segment.

| Route | Purpose |
|---|---|
| `/` | Portfolio home — hero, featured work, skills, testimonials, contact |
| `/chat` | Avocado — full-screen RAG chatbot (no nav/footer) |
| `/experience` `/education` `/projects` `/apps` | Career + work surfaces |
| `/blog`, `/blog/[slug]`, `/blog/tag/[tag]` | Blog index, post, tag index |
| `/lab`, `/lab/[slug]` | Living build logs (MDX, same loader shape as blog) |
| `/gallery` `/quotes` `/now` `/system` `/mcp` | Supporting pages |
| `/admin`, `/admin/google-callback` | Content admin, Google sign-in on an email allow-list (no-index) |
| `/gradevitian/*` | gradeVITian (served at its subdomain root) |
| `/vrfbricks/*` | VRF Bricks (served at its subdomain root) |

Portfolio routes live in `frontend/src/app/(portfolio)/` and share a
`Nav` + `Footer` layout. `/chat`, `/admin`, `/gradevitian` and `/vrfbricks` sit
outside that group and bring their own chrome.

A mobile FAB on portfolio pages links to `/chat`.

---

## Frontend structure

`frontend/src` is organised by **feature vertical**. Everything that belongs to
one product lives together; only genuinely cross-cutting code sits at a root.

```
components/
  ui/           generic primitives — no product content
                (theme, scroll/reveal, parallax, PWA, JsonLd, StackSection)
  portfolio/    the portfolio's own sections and chrome (Nav, Footer, Hero*, …)
  chat/         Avocado chatbot
  blog/  lab/   content surfaces
  system/       the /system observability dashboard
  admin/        the token-gated editor UI
  gradevitian/  vrfbricks/    the two subdomain sites

lib/
  api/          backend client (`apiPost`, content API)
  content/      MDX loaders — blog.ts, lab.ts
  portfolio/    seo.ts, searchIndex.ts, site-nav.tsx, pages.ts
  admin/        GitHub staging + file hooks
  gradevitian/  vrfbricks/    per-site helpers (nav, seo, base-path hooks)
  session.ts sound.ts visitor.ts    small cross-cutting utilities

data/
  knowledge/    synced copies of backend JSON — GENERATED, never edit
  *.ts          typed re-exports of the above
  gradevitian/  vrfbricks/    per-site data
```

**Rule of thumb when adding a component:** if it renders product-specific
content it goes in that product's folder. It only belongs in `components/ui/`
if it is content-free and at least two verticals could use it.

---

## Subdomains

Both subdomain sites ship from the **same static export** as the portfolio. Each
lives as a route segment under `frontend/src/app/`, and nginx maps the
subdomain's root onto that segment so visitors see clean URLs.

| Subdomain | Segment | nginx vhost | Docs |
|---|---|---|---|
| `gradevitian.jayaremala.com` | `app/gradevitian/` | `infra/nginx/gradevitian.conf` | `docs/GRADEVITIAN.md` |
| `vrfbricks.jayaremala.com` | `app/vrfbricks/` | `infra/nginx/vrfbricks.conf` | `docs/VRFBRICKS.md` |

Shared conventions for both:

- **Internal hrefs are written CLEAN** (`/bricks/`, not `/vrfbricks/bricks/`). A
  `useVrfBase` / `useGvBase` hook prepends the segment prefix only when the page
  is actually mounted under the main domain. Always link via `VRFLink` / `GVLink`,
  never `next/link` directly.
- Each declares the **subdomain** as its canonical URL, and a client-side
  `*CanonicalRedirect` bounces the path form to the subdomain.
- Each has its own `robots.txt` + `sitemap.xml` in `public/<segment>/`, served at
  the subdomain root by nginx. Sitemaps are generated by `scripts/gen-*-sitemap.mjs`
  from the frontend `prebuild`/`predev` hooks.
- The `404/` route exists because a static export never emits a segment's
  `not-found.tsx`; nginx serves it as `error_page 404`.
- `opengraph-image.tsx` exports extension-less, so each vhost sets
  `default_type image/png` for that exact path or no scraper will render the card.

**VRF Bricks is a real business** (the owner's father's brick yard). Its
`business.ts` ends with a `NEEDS_CONFIRMATION` block — unverified facts are
skipped at render time rather than guessed. Do not invent details about it, and
do not caption sourced stock photography as if it documents that yard. See
`docs/VRFBRICKS.md`.

---

## Commands

### Frontend (Next.js 16, React 19, Tailwind 4)

```bash
cd frontend
npm install
npm run dev        # runs sync first, then http://localhost:3000
npm run build      # runs sync first, then static export → out/
npm run sync       # sync backend JSON → frontend (run after editing backend JSON)
npm run lint
npx tsc --noEmit   # typecheck
```

### Backend (FastAPI, Python 3.11+)

Run everything from `backend/` — the package is installed editable (src layout),
so `app` imports fine from there. **Do not run from `backend/src/`**: the DB
paths below default to cwd-relative `./chroma_db`, so a different cwd silently
creates a second, empty vector store.

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --app-dir src --reload   # http://localhost:8000
python -m app.rag.ingest                       # manual re-ingest
pytest
ruff check src
```

Ingest runs automatically at startup and re-ingests only when the SHA256 of the
knowledge JSON has changed (hash cached at `chroma_db/.ingest_hash`).

### Codegen (repo root)

```bash
node scripts/sync-knowledge.mjs   # MDX → blog.json/lab.json; backend JSON → frontend
node scripts/gen-gv-sitemap.mjs
node scripts/gen-vrf-sitemap.mjs
```

All three run automatically via the frontend `predev` / `prebuild` hooks.

### Docker (local full stack)

```bash
cp .env.example .env   # fill in GOOGLE_API_KEY
docker compose -f infra/compose.yml up --build
```

---

## Backend architecture (`backend/src/app/`)

- `main.py` — FastAPI app; runs `run_ingest()` via lifespan, mounts the public
  MCP server at `/mcp`, applies path-aware CORS (permissive for `/mcp`, strict
  elsewhere)
- `routers/` — `admin.py` `ai.py` `blog.py` `content.py` `gradevitian.py`
  `stats.py` `tools.py`
- `rag/` — `store.py` (Chroma + embeddings), `ingest.py` (hash-gated ingest),
  `graph.py`, `gv_rulebook.py` (gradeVITian regulation retrieval)
- `db/` — SQLite access: `analytics.py` `blog_stats.py` `content.py` `gradevitian.py`
- `integrations/` — Google `calendar` / `drive` / `gmail` / `google_auth`, `digest`
- `agent/tools.py` — the read-only tool surface shared by Agent mode and MCP
- `obs/trace.py` — per-request tracing feeding the `/system` dashboard
- `core/` — `settings.py`, `limiter.py`, `gv_auth.py`, `gv_moderation.py`,
  `admin_auth.py` (admin Google sign-in + the shared admin credential check)

### API surface

| Prefix | Router | Notes |
|---|---|---|
| `/ai` | `ai.py` | `/chat`, `/chat/stream` (SSE), `/chat/agentic`, `/summarize`, `/draft`, `/rewrite`, `/followups`, `/lead-capture`, `/feedback`, `/warmup` |
| `/blog` | `blog.py` | `/{slug}/view`, `/{slug}/clap`, `/{slug}/stats`, `/stats/summary` |
| `/content` | `content.py` | CRUD for blog / lab / quotes (admin-authored, DB-backed) |
| `/gv` | `gradevitian.py` | auth, calculators, comments, rulebook `/ask`, metrics |
| `/stats` | `stats.py` | `/overview`, `/system`, `/system/traces`, `/visit` |
| `/tools` | `tools.py` | agent tool listing + invocation |
| `/admin` | `admin.py` | `/auth/google` sign-in, reingest, Google OAuth, Drive/Gmail sync, digest |
| `/mcp/` | mounted | public read-only MCP server (`fastmcp`) |

### RAG flow for `/ai/chat`

1. Embed the message with `BAAI/bge-base-en-v1.5` (fastembed ONNX — no PyTorch)
2. Query ChromaDB for top-k chunks, plus BM25 hybrid retrieval
3. RRF merge → top 5 by score
4. Inject as context into the model system prompt
5. Return `{ reply, sources }`

### Model fallback chain

Configured in `core/settings.py` as `provider:model` entries, tried in order and
deduped. Gemini first, then Groq, then OpenRouter — each included only when its
API key is set, so behaviour is unchanged when they are absent.

| Env var | Default |
|---|---|
| `GEMINI_MODEL` | `gemini-2.0-flash` |
| `GEMINI_FALLBACK_MODELS` | `gemini-2.5-flash,gemini-2.0-flash-lite,gemini-flash-latest` |
| `GROQ_API_KEY` / `GROQ_MODELS` | optional free tier |
| `OPENROUTER_API_KEY` / `OPENROUTER_MODELS` | optional free tier |

---

## Knowledge base — single source of truth

**Always edit `backend/data/knowledge/`. Never edit `frontend/src/data/knowledge/`**
— it is overwritten by the sync script.

| File | Controls |
|---|---|
| `profile.json` | name, tagline, bio, obsession, `prev_domain`, `interested_domain`, location, contact links, resume |
| `experience.json` | roles, companies, bullets |
| `education.json` | degrees, institutions, GPA, highlights |
| `projects.json` | title, description, tags[], featured, award, `sourceLinks[{label,url}]`, note |
| `skills.json` | skill categories and items |
| `testimonials.json` | name, designation, company, linkedin, description, givenAt, source |
| `apps.json` | live apps listed on `/apps` |
| `gallery.json` | `/gallery` images and captions |
| `quotes.json` | `/quotes` entries |
| `spotlights.json` | homepage spotlight cards |
| `inbox_signals.json` | weekly-digest inputs |
| `site.json` | page names, one-liners and what each page holds (menu, footer, page map, Avocado's links) + home chapter copy |
| `case-studies.json` | case-study cards and links |
| `blog.json` / `lab.json` | **generated** from MDX by the sync script (full bodies, headings kept) — do not edit |
| `case-study-text.json` | **generated** — readable text of each case-study deck, for Avocado/MCP only |

**Everything in these files reaches Avocado and MCP.** `rag/ingest.py` chunks
long bodies by section (never truncates), has a phrased builder for each known
file and profile block, and a catch-all that ingests any new file or profile key.
Avocado's system prompt (`rag/persona.py`) and the role→project graph links
(`experience.json` → `projects`) are derived from the data too.
`backend/tests/test_knowledge_contract.py` fails if any of that drifts.

After editing any JSON run `npm run sync` from `frontend/`, or just restart `npm run dev`.

---

## Blog and lab posts

- Blog: `frontend/src/content/blog/[slug].mdx` → `/blog/[slug]`
- Lab: `frontend/src/content/lab/[slug].mdx` → `/lab/[slug]`
- Blog frontmatter: `title`, `date` (display), `publishedAt` (sort key — set once,
  never change), `description`, `tags[]`
- Images live in `frontend/public/blog/`, referenced as `/blog/filename.jpg`
- `Callout`, `BlogImage`, `Divider` are auto-injected MDX components — no import needed
- Posts are indexed into ChromaDB via the sync script on the next backend deploy

---

## Blog engagement + analytics

SQLite, on the same persistent volume as ChromaDB. Visitor IPs are hashed
SHA-256 and never stored raw.

- `POST /blog/{slug}/view` — unique per IP, idempotent
- `POST /blog/{slug}/clap` — max 50 per IP per post, body `{ count: 1–10 }`
- `GET /blog/{slug}/stats` — `{ views, claps, user_claps }`
- `GET /blog/stats/summary` — totals for the blog index

Frontend: `components/blog/BlogEngagement.tsx` (claps debounced 1.5s before
sending) and `components/blog/BlogIndexStats.tsx`.

Avocado analytics: every completed stream records a hashed IP; `/stats` exposes
totals shown in the chatbot footer, and the active model appears as a pill badge
(updating if a fallback was used).

---

## Deploy pipeline

`.github/workflows/deploy.yml`, triggered on push to `main`:

```
detect-changes (paths-filter)
├─ frontend → build static export
│             ├─ upload to GitHub Pages  (jayaremala.com)
│             └─ rsync out/ to Lightsail (the two subdomains)
│             └─ sync-knowledge job commits generated JSON with [skip ci]
└─ backend  → build image → push to GHCR → ssh Lightsail → infra/scripts/deploy.sh
              (blue-green: health-check on :8001, then swap to :8000)
```

The `paths-filter` block decides what deploys. **Keep it in step with what each
job actually reads** — a missing entry means an edit silently ships nothing.

---

## Key conventions

- **Single source of truth**: edit `backend/data/knowledge/*.json`
- **Feature-first layout**: co-locate by product; `components/ui` and the small
  `lib/` root utilities are the only shared buckets
- **Tailwind 4**: configured in `src/app/globals.css` via `@theme inline` — there
  is no `tailwind.config.js`
- **Static export**: no server components with runtime data, no route handlers
  that need a Node runtime in production. `new Date()` in a client component is a
  hydration hazard — use `NEXT_PUBLIC_BUILD_YEAR` (see `next.config.ts`)
- **Blog sort**: by `publishedAt` (immutable), not `date` (editable display date)
- **Backend cwd**: run from `backend/`, never `backend/src/` (see Commands)
- **DB paths**: default cwd-relative; production overrides them to absolute
  `/data/…` paths via env
- **Favicon**: `src/app/icon.png` (App Router auto-detects)

---

## gstack

- **Team install** (each developer runs once):
  ```bash
  git clone --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
  cd ~/.claude/skills/gstack && ./setup --team
  ```
- **Web browsing**: use the `/browse` skill from gstack for all web browsing. **Never** use `mcp__claude-in-chrome__*` tools.
- **Available gstack skills**: `/office-hours`, `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`, `/design-consultation`, `/design-shotgun`, `/design-html`, `/review`, `/ship`, `/land-and-deploy`, `/canary`, `/benchmark`, `/browse`, `/connect-chrome`, `/qa`, `/qa-only`, `/design-review`, `/setup-browser-cookies`, `/setup-deploy`, `/setup-gbrain`, `/retro`, `/investigate`, `/document-release`, `/document-generate`, `/codex`, `/cso`, `/autoplan`, `/plan-devex-review`, `/devex-review`, `/careful`, `/freeze`, `/guard`, `/unfreeze`, `/gstack-upgrade`, `/learn`

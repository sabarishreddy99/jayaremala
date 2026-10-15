"""Build the RAG knowledge base from backend/data/knowledge/*.json.

Strategy: atomic chunking — each bullet point, project, and skill category gets
its own document so retrieval is precise rather than scanning large blobs.
Also includes synthesized FAQ documents that pre-answer common recruiter questions.

Incremental upsert: on each startup, per-document SHA-256 hashes are compared
against .doc_hashes.json. Only changed or new documents are re-embedded;
documents removed from the source are deleted from ChromaDB. This keeps
startup fast as blog/lab content grows — adding one post embeds one document.
"""

import gc
import hashlib
import json
import logging
import re
import threading
import time
from pathlib import Path

from app.rag.store import EMBED_MODEL, build_bm25_index, clear_query_cache, get_collection, reset_collection

# Number of documents sent to the embedding model per ChromaDB upsert call.
# BAAI/bge-base-en-v1.5 holds ~440 MB of ONNX weights; embedding all docs in
# one shot spikes peak RAM to ~1.5 GB on a 2 GB server. Batching to 16 keeps
# each forward pass small, and gc.collect() between batches frees intermediate
# tensors before the next one loads.
_INGEST_BATCH_SIZE = 16

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).parents[3] / "data" / "knowledge"
SITE_URL = "https://jayaremala.com"

# ── Per-document hash helpers ──────────────────────────────────────────────────

def _doc_hashes_path() -> Path:
    from app.core.settings import settings
    return Path(settings.chroma_db_path) / ".doc_hashes.json"


def _short_hash(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()[:16]


def _load_doc_hashes() -> dict[str, str]:
    p = _doc_hashes_path()
    try:
        return json.loads(p.read_text())
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def _save_doc_hashes(hashes: dict[str, str]) -> None:
    p = _doc_hashes_path()
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(hashes, indent=2))


# ── Entity type helper ────────────────────────────────────────────────────────

def _entity_type(doc_id: str, doc_type: str) -> str:
    """Return a fine-grained entity type stored in ChromaDB metadata."""
    if "_part_" in doc_id:
        return f"{doc_type}_part"
    if "_bullet_" in doc_id:
        return "experience_bullet"
    if "_highlight_" in doc_id:
        return "education_highlight"
    if doc_id.endswith("_overview"):
        return f"{doc_type}_overview"
    if doc_id.endswith("_tech"):
        return "project_tech"
    if doc_id == "skills_all":
        return "skills_all"
    if doc_id == "profile_bio":
        return "profile_bio"
    if doc_id == "profile_contact":
        return "profile_contact"
    if doc_id == "profile_now":
        return "profile_now"
    if doc_id == "profile_focus":
        return "profile_focus"
    if doc_id == "profile_availability":
        return "profile_availability"
    if doc_id.startswith("quote_"):
        return "quote"
    if doc_id.startswith("gallery_"):
        return "gallery"
    if doc_id.startswith("faq_company_"):
        return "faq_company"
    if doc_id.startswith("faq_"):
        return "faq"
    return doc_type


# ── Document loaders ───────────────────────────────────────────────────────────

def _load(filename: str) -> dict | list | None:
    path = DATA_DIR / filename
    if not path.exists():
        logger.warning("Missing knowledge file: %s", path)
        return None
    return json.loads(path.read_text())


# ── Chunking ───────────────────────────────────────────────────────────────────
#
# Long bodies (blog posts, lab logs, case-study decks, the résumé) are split into
# overlapping, section-aware chunks instead of being truncated. Sections come
# from "## " heading lines (scripts/sync-knowledge.mjs normalises MDX headings to
# that form); paragraphs are packed up to CHUNK_CHARS, and each chunk repeats the
# tail of the previous one so an answer that straddles a boundary still lands.

CHUNK_CHARS = 1100
CHUNK_OVERLAP = 160
_SENTENCE = re.compile(r"(?<=[.!?])\s+")


def _split_long(paragraph: str, limit: int) -> list[str]:
    """Break one over-long paragraph on sentence boundaries (hard-wrap as a last resort)."""
    out, cur = [], ""
    for sent in _SENTENCE.split(paragraph):
        while len(sent) > limit:
            out.append(sent[:limit])
            sent = sent[limit:]
        if cur and len(cur) + len(sent) + 1 > limit:
            out.append(cur)
            cur = sent
        else:
            cur = f"{cur} {sent}".strip()
    if cur:
        out.append(cur)
    return out


def _tail(text: str, n: int) -> str:
    """Last ~n characters of `text`, starting on a word boundary."""
    if len(text) <= n:
        return text
    cut = text[-n:]
    return cut[cut.find(" ") + 1:] if " " in cut else cut


def chunk_text(text: str, max_chars: int = CHUNK_CHARS, overlap: int = CHUNK_OVERLAP) -> list[tuple[str, str]]:
    """Split `text` into [(section_heading, chunk)] — every character is kept."""
    sections: list[tuple[str, list[str]]] = [("", [])]
    for line in (text or "").splitlines():
        if line.startswith("## "):
            sections.append((line[3:].strip(), []))
        else:
            sections[-1][1].append(line)

    chunks: list[tuple[str, str]] = []
    for heading, lines in sections:
        paras = [p.strip() for p in "\n".join(lines).split("\n\n") if p.strip()]
        pieces = [piece for p in paras for piece in (_split_long(p, max_chars) if len(p) > max_chars else [p])]
        cur = ""
        for piece in pieces:
            if cur and len(cur) + len(piece) + 2 > max_chars:
                chunks.append((heading, cur))
                cur = f"{_tail(cur, overlap)} … {piece}" if overlap else piece
            else:
                cur = f"{cur}\n\n{piece}" if cur else piece
        if cur:
            chunks.append((heading, cur))
    return chunks


def _first_sentence(text: str, limit: int = 220) -> str:
    """The opening sentence of `text`, capped at `limit` characters."""
    first = _SENTENCE.split((text or "").strip(), maxsplit=1)[0]
    return first if len(first) <= limit else first[:limit].rsplit(" ", 1)[0] + "…"


def _section_list(text: str) -> str:
    heads = [ln[3:].strip() for ln in (text or "").splitlines() if ln.startswith("## ")]
    return "; ".join(h for h in heads if h)


def _chunked_body_docs(prefix: str, label: str, body: str, doc_type: str) -> list[tuple[str, str, str]]:
    """One document per chunk of `body`, each carrying where it came from."""
    docs = []
    for n, (heading, chunk) in enumerate(chunk_text(body)):
        where = f"{label}, section '{heading}'" if heading else label
        docs.append((f"{prefix}_part_{n}", f"From {where}: {chunk}", doc_type))
    return docs


def _build_blog_documents() -> list[tuple[str, str, str]]:
    """A summary document per post plus its full body, chunked by section."""
    path = DATA_DIR / "blog.json"
    if not path.exists():
        return []
    docs = []
    for post in json.loads(path.read_text()):
        slug = post.get("slug", "unknown")
        title = post.get("title", "")
        date = post.get("publishedAt") or post.get("date", "")
        desc = post.get("description", "")
        tags = ", ".join(post.get("tags", []))
        body = post.get("content", "")
        sections = _section_list(body)
        docs.append((
            f"blog_{slug}",
            f"Blog post by Jaya: '{title}' (published {date}). {desc} Tags: {tags}. "
            + (f"It covers: {sections}. " if sections else "")
            + f"Read it at {SITE_URL}/blog/{slug}.",
            "blog",
        ))
        docs.extend(_chunked_body_docs(f"blog_{slug}", f"Jaya's blog post '{title}'", body, "blog"))
    return docs


def _build_testimonial_documents() -> list[tuple[str, str, str]]:
    """One document per testimonial — lets Avocado answer 'What do people say about Jaya?'
    IDs are stable (name + date slug) so adding a new testimonial only upserts that one doc.
    """
    path = DATA_DIR / "testimonials.json"
    if not path.exists():
        return []
    docs = []
    for t in json.loads(path.read_text()):
        name        = t.get("name", "")
        designation = t.get("designation", "")
        company     = t.get("company", "")
        description = t.get("description", "").strip().replace("\n", " ")
        given_at    = t.get("givenAt", "")
        stable_key  = re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")
        date_key    = given_at.replace("-", "")
        docs.append((
            f"testimonial_{stable_key}_{date_key}",
            f'{name} ({designation} at {company}) gave this recommendation about Jaya: '
            f'"{description}" — written on {given_at}.',
            "testimonial",
        ))
    return docs


def _build_quotes_documents() -> list[tuple[str, str, str]]:
    """One document per curated quote from quotes.json."""
    path = DATA_DIR / "quotes.json"
    if not path.exists():
        return []
    docs = []
    for q in json.loads(path.read_text()):
        qid      = q.get("id", "") or q.get("quote_id", "")
        text     = q.get("text", "").strip()
        author   = q.get("author", "")
        source   = q.get("source", "")
        category = q.get("category", "")
        favorite = q.get("favorite", False)
        stable   = re.sub(r"[^a-z0-9]+", "_", str(qid).lower()).strip("_") or re.sub(r"[^a-z0-9]+", "_", text[:30].lower()).strip("_")
        fav_note = ", a personal favorite of Jaya" if favorite else ""
        src_note = f", {source}" if source else ""
        docs.append((
            f"quote_{stable}",
            f'A quote in Jaya\'s curated collection ({category}{fav_note}): "{text}" — {author}{src_note}.',
            "quote",
        ))
    return docs


def _build_gallery_documents() -> list[tuple[str, str, str]]:
    """One document per gallery item from gallery.json — milestones, events, achievements."""
    path = DATA_DIR / "gallery.json"
    if not path.exists():
        return []
    docs = []
    for item in json.loads(path.read_text()):
        iid     = item.get("id", "")
        title   = item.get("title", "")
        caption = item.get("caption", item.get("description", ""))
        category = item.get("category", "")
        date    = item.get("date", "")
        stable  = re.sub(r"[^a-z0-9]+", "_", str(iid).lower()).strip("_") or re.sub(r"[^a-z0-9]+", "_", title[:30].lower()).strip("_")
        parts = [p for p in [title, caption, category, date] if p]
        docs.append((
            f"gallery_{stable}",
            f"Gallery milestone for Jaya: {' — '.join(parts)}.",
            "gallery",
        ))
    return docs


def _sync_content_db() -> None:
    """Regenerate JSON files from content.db before ingesting.
    Lazy imports avoid circular dependency (content.py also imports run_ingest).
    """
    try:
        from app.db.content import (  # noqa: PLC0415
            regenerate_blog_json, regenerate_lab_json, regenerate_quotes_json,
            sync_blog_json_to_db, sync_lab_json_to_db, sync_quotes_json_to_db,
        )
        # Step 1: pull any new content from JSON files → content.db
        # (must run before regenerate_* so new entries survive the overwrite)
        sync_blog_json_to_db()
        sync_lab_json_to_db()
        sync_quotes_json_to_db()
        # Step 2: regenerate all JSON files from the now-complete content.db
        regenerate_blog_json()
        regenerate_lab_json()
        regenerate_quotes_json()
        logger.info("Synced content.db → knowledge JSON files")
    except Exception as exc:
        logger.warning("content.db sync failed (non-fatal): %s", exc)


def _build_lab_documents() -> list[tuple[str, str, str]]:
    """A summary document per lab entry plus its full body, chunked by section."""
    path = DATA_DIR / "lab.json"
    if not path.exists():
        return []
    docs = []
    for entry in json.loads(path.read_text()):
        slug      = entry.get("slug", "unknown")
        title     = entry.get("title", "")
        status    = entry.get("status", "")
        desc      = entry.get("description", "")
        tech      = ", ".join(entry.get("tech", []))
        started   = entry.get("startedAt", "")
        updated   = entry.get("updatedAt", "")
        body      = entry.get("content", "")
        links     = "; ".join(f"{lk.get('label', '')}: {lk.get('url', '')}" for lk in entry.get("links", []) if lk.get("url"))
        sections  = _section_list(body)
        docs.append((
            f"lab_{slug}",
            (
                f"Lab project by Jaya: '{title}' (status: {status}, started {started}, "
                f"last updated {updated}). {desc} Tech stack: {tech}. "
                + (f"The build log covers: {sections}. " if sections else "")
                + (f"Links: {links}. " if links else "")
                + f"Read it at {SITE_URL}/lab/{slug}."
            ),
            "lab",
        ))
        docs.extend(_chunked_body_docs(f"lab_{slug}", f"Jaya's lab build log '{title}'", body, "lab"))
    return docs


def _build_apps_documents() -> list[tuple[str, str, str]]:
    """Build one chunk per hosted app/property from apps.json, plus a summary doc.

    The apps registry lists everything Jaya hosts under his domain (the portfolio
    itself, Gradevitian, and any future products/sub-domains). Read fresh each
    ingest, so new entries appear automatically with no code change.
    """
    path = DATA_DIR / "apps.json"
    if not path.exists():
        return []
    apps = json.loads(path.read_text())
    if not apps:
        return []
    docs: list[tuple[str, str, str]] = []
    for app in apps:
        slug   = app.get("slug", "unknown")
        name   = app.get("name", "")
        url    = app.get("url", "")
        status = app.get("status", "")
        cat    = app.get("category", "")
        tag    = app.get("tagline", "")
        desc   = app.get("description", "")
        tech   = ", ".join(app.get("tech", []))
        docs.append((
            f"app_{slug}",
            (
                f"{name} is an application Jaya builds and hosts under his domain "
                f"(jayaremala.com). Live at {url} (status: {status}, category: {cat}). "
                f"{tag}. {desc} Tech stack: {tech}."
            ),
            "app",
        ))
    # Summary doc — answers "what else has Jaya built / what's hosted on his domain".
    names = ", ".join(f"{a.get('name', '')} ({a.get('url', '')})" for a in apps)
    docs.append((
        "faq_hosted_apps",
        (
            f"Beyond the portfolio itself, Jaya hosts {len(apps)} live "
            f"application(s)/product(s) under his domain (jayaremala.com): {names}. "
            "These are independent apps he designed, built, and operates — ask about "
            "any of them by name for details."
        ),
        "app",
    ))
    return docs


def _build_faq_documents(
    p: dict | None,
    exp_list: list | None,
    edu_list: list | None,
    proj_list: list | None,
    skills_list: list | None,  # noqa: ARG001 — reserved for future skill-based FAQs
) -> list[tuple[str, str, str]]:
    """Build personal-content FAQ docs dynamically from loaded JSON data.
    Every field comes from the JSON files — nothing is hardcoded.
    """
    docs: list[tuple[str, str, str]] = []

    # ── WHO ──────────────────────────────────────────────────────────────────
    if p:
        name     = p.get("name", "Jaya Sabarish Reddy Remala")
        tagline  = p.get("tagline", "")
        bio      = p.get("summary", p.get("bio", ""))
        location = p.get("location", "")

        award_projs = [pr for pr in (proj_list or []) if pr.get("award")]
        award_str = ("He won " + ", ".join(pr["award"] for pr in award_projs[:2]) + ". ") if award_projs else ""

        edu_str = ""
        if edu_list:
            e = edu_list[0]
            school = e.get("school", "")
            full_inst = f"{e['institution']}, {school}" if school else e["institution"]
            gpa = e.get("gpa", "")
            edu_str = (
                f"He holds a {e['degree']} in {e['field']} from {full_inst}"
                + (f" (GPA {gpa})" if gpa else "") + ". "
            )

        companies = list(dict.fromkeys(e["company"] for e in (exp_list or [])))[:4]
        exp_str = f"He has professional experience at {', '.join(companies)}. " if companies else ""

        docs.append(("faq_who", (
            f"Who is {name}? {name} is a {tagline}. "
            f"{bio} "
            f"{award_str}{edu_str}{exp_str}"
            f"He is based in {location}."
        ), "faq"))

    # ── EXPERIENCE SUMMARY ────────────────────────────────────────────────────
    if exp_list:
        parts = []
        for e in exp_list:
            desc = e.get("description", "")
            parts.append(
                f"{e['role']} at {e['company']} ({e['start']}–{e['end']})"
                + (f": {_first_sentence(desc)}" if desc else "")
            )
        docs.append(("faq_experience_summary", (
            "Jaya's work experience: " + ". ".join(parts) + "."
        ), "faq"))

    # ── PROJECTS SUMMARY ──────────────────────────────────────────────────────
    if proj_list:
        parts = []
        for pr in proj_list:
            award = pr.get("award", "")
            note  = f" (Award: {award})" if award else ""
            # First sentence only: each project's full description is already
            # its own document, and this overview must fit the embedding window.
            parts.append(f"{pr['title']}{note} — {_first_sentence(pr.get('description', ''))}")
        docs.append(("faq_projects_summary", (
            "Jaya's projects: " + ". ".join(parts)
        ), "faq"))

    # ── EDUCATION SUMMARY ─────────────────────────────────────────────────────
    if edu_list:
        parts = []
        for e in edu_list:
            school = e.get("school", "")
            full_inst = f"{e['institution']}, {school}" if school else e["institution"]
            gpa = e.get("gpa", "")
            highlights = e.get("highlights", [])
            h_str = f" Highlights: {'; '.join(highlights[:2])}." if highlights else ""
            parts.append(
                f"{e['degree']} in {e['field']} from {full_inst} ({e['start']}–{e['end']}"
                + (f", GPA {gpa}" if gpa else "") + f").{h_str}"
            )
        docs.append(("faq_education_summary", (
            "Jaya's education: " + " ".join(parts)
        ), "faq"))

    # ── AWARDS ───────────────────────────────────────────────────────────────
    if proj_list:
        award_projs = [pr for pr in proj_list if pr.get("award")]
        if award_projs:
            parts = [
                f"{pr['title']} — {pr['award']}: {pr.get('description', '')}"
                for pr in award_projs
            ]
            docs.append(("faq_awards", (
                "Jaya's awards and recognition: " + ". ".join(parts)
            ), "faq"))

    # ── PER-COMPANY FAQ (one per experience entry) ───────────────────────────
    if exp_list:
        for idx, e in enumerate(exp_list):
            company_slug = re.sub(r"[^a-z0-9]+", "_", e["company"].lower()).strip("_")
            role_slug    = re.sub(r"[^a-z0-9]+", "_", e["role"].lower()).strip("_")[:30]
            bullets = e.get("bullets", [])
            bullet_str = " ".join(bullets)
            docs.append((f"faq_company_{company_slug}_{role_slug}_{idx}", (
                f"What did Jaya do at {e['company']}? "
                f"Jaya was {e['role']} at {e['company']} ({e['start']}–{e['end']}). "
                f"{e.get('description', '')} "
                f"{bullet_str}"
            ).strip(), "faq"))

    # ── RESUME ────────────────────────────────────────────────────────────────
    if p:
        resume = p.get("resume", "")
        email  = p.get("email", "")
        phone  = p.get("phone", "")
        if resume or email:
            docs.append(("faq_resume", (
                f"Jaya's resume/CV is available at: {resume}. "
                f"For direct contact: {email}"
                + (f" or {phone}." if phone else ".")
            ), "faq"))

    # ── CONTACT / HIRE ────────────────────────────────────────────────────────
    if p:
        email    = p.get("email", "")
        phone    = p.get("phone", "")
        linkedin = p.get("linkedin", "")
        github   = p.get("github", "")
        location = p.get("location", "")
        resume   = p.get("resume", "")
        booking  = p.get("booking_url", "")
        avail    = p.get("availability", {})
        docs.append(("faq_contact_hire", (
            f"How to contact or hire Jaya: "
            f"Email: {email}, Phone: {phone}, "
            f"LinkedIn: {linkedin}, GitHub: {github}. "
            f"Location: {location}."
            + (f" Resume: {resume}." if resume else "")
            + (f" Book a call: {booking}." if booking else "")
            + (
                f" Availability: {avail.get('label', '')} — "
                f"{', '.join(avail.get('types', []))} in {', '.join(avail.get('locations', []))}."
                if avail else ""
            )
        ), "faq"))

    # ── BLOG ─────────────────────────────────────────────────────────────────
    blog_path = DATA_DIR / "blog.json"
    if blog_path.exists():
        blog_data = json.loads(blog_path.read_text())
        count = len(blog_data)
        page_desc = (p or {}).get("page_blog", "")
        recent = [b["title"] for b in blog_data[:3]]
        recent_str = f" Recent posts: {', '.join(recent)}." if recent else ""
        docs.append(("faq_blog", (
            f"Jaya's blog at jayaremala.com/blog has {count} published posts. "
            + (f"{page_desc} " if page_desc else "")
            + recent_str
        ), "faq"))

    # ── LAB ──────────────────────────────────────────────────────────────────
    lab_path = DATA_DIR / "lab.json"
    if lab_path.exists():
        lab_data = json.loads(lab_path.read_text())
        count = len(lab_data)
        page_desc = (p or {}).get("page_lab", "")
        active_titles = [
            e["title"] for e in lab_data
            if e.get("status", "").lower() in ("active", "building", "in-progress", "in progress")
        ]
        active_str = f" Active: {', '.join(active_titles[:3])}." if active_titles else ""
        docs.append(("faq_lab", (
            f"Jaya's Lab at jayaremala.com/lab documents {count} projects. "
            + (f"{page_desc} " if page_desc else "")
            + active_str
        ), "faq"))

    # ── QUOTES COLLECTION ─────────────────────────────────────────────────────
    quotes_path = DATA_DIR / "quotes.json"
    if quotes_path.exists():
        qdata = json.loads(quotes_path.read_text())
        count = len(qdata)
        page_desc = (p or {}).get("page_quotes", "")
        docs.append(("faq_quotes_collection", (
            f"Jaya curates a collection of {count} quotes at jayaremala.com/quotes. "
            + (page_desc if page_desc else "")
        ), "faq"))

    return docs


def _build_system_faq_documents(approx_content_docs: int) -> list[tuple[str, str, str]]:
    """Build portfolio-architecture FAQ documents.
    These describe the technical infrastructure and are updated when the stack changes.
    """
    docs: list[tuple[str, str, str]] = []

    docs.append(("faq_portfolio_how_it_works", (
        "How does this portfolio work? How is Avocado built? "
        "jayaremala.com is Jaya's AI-powered portfolio. It has two parts: "
        "(1) Avocado — a full-screen RAG-powered AI chatbot at the homepage that answers questions about Jaya in real time. "
        "(2) A classic portfolio with experience, projects, education, blog, lab, gallery, quotes, and a /now page. "
        "Avocado works like this: when you type a question, the backend runs a 4-stage hybrid retrieval pipeline — "
        "query expansion (up to 4 variants), dense search via ChromaDB (BAAI/bge-base-en-v1.5 ONNX embeddings, 768-dim), "
        "lexical search via BM25 (catches exact names, numbers, company names), "
        "Reciprocal Rank Fusion to merge results, then the top 5 chunks are injected into Gemini's system prompt "
        "and the response streams token-by-token back to the browser via Server-Sent Events. "
        "The knowledge base is fully dynamic — every blog post, lab entry, quote, gallery item, and bullet point "
        "from each job is its own document, auto-synced on every ingest."
    ), "faq"))

    docs.append(("faq_services_connected", (
        "How are the services connected in this portfolio? What is the system architecture? "
        "The portfolio has three layers: "
        "(1) Frontend: Next.js 16 static export hosted on GitHub Pages at jayaremala.com. "
        "No server-side rendering — fully static HTML/CSS/JS served from GitHub's CDN for free. "
        "(2) Backend API: FastAPI (Python) running in Docker on AWS Lightsail 2GB VPS at api.jayaremala.com. "
        "Nginx sits in front as a reverse proxy (port 443 → Docker port 8000) with Let's Encrypt HTTPS. "
        "(3) External AI: Google Gemini API for LLM responses. "
        "The frontend calls the backend directly from the browser — no middleman. "
        "The backend talks to Gemini over HTTPS and streams tokens back to the browser via SSE. "
        "All data (blog views, claps, chat analytics, blog/lab/quotes CRUD) is stored in SQLite on the Lightsail SSD, "
        "backed up daily to Amazon S3 with 7-day retention. "
        "ChromaDB vector database persists at /data/chroma_db and auto-rebuilds from knowledge JSON on deploy if the content hash changed."
    ), "faq"))

    docs.append(("faq_rag_pipeline", (
        "How does Avocado retrieve information? What RAG pipeline does it use? "
        "Avocado uses a 4-stage hybrid RAG pipeline: "
        "Stage 1 — Query Expansion: the user message is expanded into up to 4 query variants "
        "(verbatim, name-anchored, topic keyword, conversation context) to catch different phrasings. "
        "Stage 2a — Dense retrieval: all 4 queries are embedded in a single batched ONNX forward pass "
        "using BAAI/bge-base-en-v1.5 (768-dim) via fastembed, then searched against ChromaDB using HNSW cosine similarity. "
        "Stage 2b — Lexical retrieval: BM25 (rank_bm25 BM25Okapi) catches exact keyword matches — "
        "specific numbers like '3000 RPS', company names like 'Qualcomm', project names like 'SnapLog'. "
        "Stage 3 — Reciprocal Rank Fusion: merges dense and lexical results using RRF (k=60, Cormack 2009). "
        "Stage 4 — Top 5 by RRF score injected into Gemini's system prompt as context. "
        f"The knowledge base has {approx_content_docs}+ atomic documents: each bullet point, blog post, lab entry, "
        "project, quote, and gallery item is its own chunk so retrieval is precise."
    ), "faq"))

    docs.append(("faq_tech_choices_tradeoffs", (
        "What technology choices did Jaya make for this portfolio and why? What are the trade-offs? "
        "Key decisions and trade-offs: "
        "(1) BAAI/bge-base-en-v1.5 via fastembed ONNX (768-dim, 12-layer BERT) instead of PyTorch — saves ~600MB RAM, no GPU needed, "
        "runs on a $10/month VPS with better retrieval quality than smaller distilled models. Trade-off: ~90MB model download vs 45MB. "
        "(2) ChromaDB + BM25 hybrid instead of pure dense search — BM25 catches exact keyword matches "
        "(numbers, names) that dense search misses. Trade-off: BM25 index is in-memory, rebuilt on every startup (~5ms). "
        "(3) SQLite instead of managed Postgres for analytics — zero cost, same-process, one file to back up. "
        "Trade-off: not suitable for concurrent writers, but the single Docker container has no concurrency issue. "
        "(4) Static Next.js export on GitHub Pages instead of Vercel/SSR — free, CDN-served, no cold starts. "
        "Trade-off: no server-side rendering, all dynamic data fetched client-side. "
        "(5) AWS Lightsail $10/month instead of Railway PaaS — persistent SSD storage, full control, no trial limits. "
        "Trade-off: more DevOps responsibility (Docker, Nginx, Certbot, backups). "
        "(6) Gemini 2.5 Flash with fallback chain instead of a single model — high availability even at peak times. "
        "Trade-off: response quality varies slightly across fallback models. "
        "(7) Fully dynamic knowledge base — every content change auto-syncs from content.db to JSON to ChromaDB. "
        "Trade-off: reingest takes a few seconds on every deploy."
    ), "faq"))

    docs.append(("faq_deployment_cicd", (
        "How is the portfolio deployed? What is the CI/CD pipeline? "
        "Everything deploys automatically on every git push to main via GitHub Actions: "
        "(1) Frontend: npm build runs sync-knowledge.mjs (generates blog.json from MDX posts), "
        "then Next.js builds a static export to frontend/out/, which is uploaded to GitHub Pages at jayaremala.com. "
        "(2) Backend: GitHub Actions SSHes into AWS Lightsail and runs infra/scripts/deploy.sh — "
        "a zero-downtime blue-green deployment script. It builds the new Docker image, "
        "starts it on port 8001, health-checks it for up to 120 seconds (ONNX model warmup), "
        "then swaps to port 8000 only if the health check passes. "
        "If the new container fails health check, the old container keeps running — zero downtime. "
        "The previous Docker image is tagged :previous for instant rollback with one command. "
        "Analytics data is backed up daily to S3 and auto-restored from S3 if missing on a fresh instance. "
        "The total monthly cost is $10 for Lightsail — the frontend, CI/CD, and SSL are all free."
    ), "faq"))

    docs.append(("faq_data_persistence", (
        "How is data stored and protected in this portfolio? "
        "All analytics data (blog views, claps, Avocado chat stats) and all CRUD content (blog posts, lab entries, quotes) "
        "live in SQLite files on the AWS Lightsail 60GB SSD. "
        "IPs are SHA-256 hashed before storage — never stored raw, privacy-preserving by design. "
        "The file is backed up daily at 02:00 UTC to Amazon S3 with 7 days of timestamped history kept automatically. "
        "On every deploy, if the SQLite file is missing (e.g. fresh instance after disaster), "
        "the deploy script automatically restores the latest backup from S3 before starting the container. "
        "ChromaDB (the vector database) does not need backup — it is fully rebuilt from the knowledge JSON files "
        "on every deploy when the content hash changes. Docker logs are rotated automatically: "
        "json-file driver, 10MB max per file, 3 files kept."
    ), "faq"))

    docs.append(("faq_portfolio_vs_standard", (
        "How is this portfolio different from a standard portfolio website? "
        "A standard portfolio is a one-way broadcast — you decide what to highlight, the visitor reads it, done. "
        "The visitor's actual question ('does he have Redis caching experience?') rarely aligns with what's on the page. "
        "This portfolio inverts the model: the visitor asks in natural language, the RAG system retrieves "
        "the most relevant evidence from Jaya's actual experience, and Gemini synthesises a grounded answer. "
        "Every claim Avocado makes is backed by a retrieved document from the knowledge base — "
        "not hallucinated. The knowledge base is the resume; Avocado is the interface. "
        "Additionally, the blog has real engagement tracking (views, claps), the lab section has living "
        "system design documentation updated as the project evolves, and the entire system auto-deploys "
        "on every git push with zero manual steps."
    ), "faq"))

    docs.append(("faq_knowledge_base", (
        "What is in Avocado's knowledge base? What can it answer questions about? "
        f"The knowledge base has {approx_content_docs}+ atomic documents across 10+ types: "
        "Profile (overview, bio, contact, focus/obsession, now block, availability). "
        "Experience: one overview + one document per bullet point per job. "
        "Education: one overview + one per academic highlight. "
        "Projects: one overview + one tech-stack doc per project. "
        "Skills: one per category + one aggregated. "
        "Testimonials: one per recommendation. "
        "Quotes: one per curated quote (synced from content.db). "
        "Gallery: one per milestone or achievement. "
        "Blog: one document per published post (synced from content.db — title, description, tags, body up to 2000 chars). "
        "Lab: one document per lab entry (synced from content.db — title, status, tech, content up to 3000 chars). "
        "FAQ: synthesized answers per employer, per award, education summary, contact info, and portfolio architecture. "
        "Avocado can answer questions about work history, projects, skills, education, awards, "
        "current status, availability, curated quotes, gallery milestones, blog posts, lab projects, "
        "contact information, resume, and how this portfolio itself is built."
    ), "faq"))

    return docs


def _build_inbox_signals_documents() -> list[tuple[str, str, str]]:
    """Build a single profile_signals chunk from inbox_signals.json (Feature 3).
    File is written by POST /admin/gmail/digest. Skip if file is older than 7 days.
    """
    path = DATA_DIR / "inbox_signals.json"
    if not path.exists():
        return []
    try:
        import time as _time
        age_days = (_time.time() - path.stat().st_mtime) / 86400
        if age_days > 7:
            return []
        data = json.loads(path.read_text())
        summary = data.get("summary_text", "")
        if not summary:
            return []
        companies = ", ".join(data.get("companies", [])[:5])
        role_types = ", ".join(data.get("role_types", [])[:4])
        updated = data.get("updated_at", "")[:10]
        text = (
            f"Recent recruiter market signals for Jaya (week of {updated}): {summary}"
            + (f" Companies showing interest: {companies}." if companies else "")
            + (f" Role types: {role_types}." if role_types else "")
        )
        return [("profile_signals", text, "profile")]
    except Exception as exc:
        logger.warning("_build_inbox_signals_documents failed: %s", exc)
        return []


def _build_drive_resume_documents() -> list[tuple[str, str, str]]:
    """Build a profile_resume chunk from drive_resume.json (Feature 4).
    File is written by POST /admin/drive/sync-resume.
    """
    path = DATA_DIR / "drive_resume.json"
    if not path.exists():
        return []
    try:
        data = json.loads(path.read_text())
        text_content = data.get("text", "").strip()
        if not text_content:
            return []
        modified = data.get("modified_time", "")[:10]
        link = data.get("web_view_link", "")
        header = f"Jaya's resume (last updated {modified}" + (f", view at {link}" if link else "") + "): "
        parts = chunk_text(text_content)
        docs = [("profile_resume", header + parts[0][1], "profile")] if parts else []
        for n, (_, chunk) in enumerate(parts[1:], start=1):
            docs.append((f"profile_resume_part_{n}", f"From Jaya's resume (continued): {chunk}", "profile"))
        return docs
    except Exception as exc:
        logger.warning("_build_drive_resume_documents failed: %s", exc)
        return []


def _build_case_study_documents() -> list[tuple[str, str, str]]:
    """Build one chunk per case study from case-studies.json.

    Case study bodies are self-contained HTML decks under
    frontend/public/case-studies/, not MDX, so only the metadata is indexed —
    enough for Avocado to say what each one argues, who it was for, and where
    to read it. New entries appear automatically with no code change.
    """
    path = DATA_DIR / "case-studies.json"
    if not path.exists():
        return []
    docs = []
    entries = json.loads(path.read_text())
    for cs in entries:
        slug     = cs.get("slug", "unknown")
        title    = cs.get("title", "")
        headline = cs.get("headline", "")
        context  = cs.get("context", "")
        brief    = cs.get("brief", "")
        role     = cs.get("role", "")
        date     = cs.get("date", "")
        summary  = cs.get("summary", "")
        sections = ", ".join(cs.get("sections", []))
        tags     = ", ".join(cs.get("tags", []))
        links    = "; ".join(
            f"{link.get('label','')}: https://jayaremala.com{link.get('href','')}"
            for link in cs.get("links", [])
        )
        docs.append((
            f"case_study_{slug}",
            (
                f"Case study by Jaya: '{title}' — {headline} Context: {context}"
                f"{', brief: ' + brief if brief else ''}"
                f"{', role: ' + role if role else ''}, {date}. {summary} "
                f"It is structured as: {sections}. Topics: {tags}. "
                f"Read it at https://jayaremala.com/case-studies. {links}"
            ),
            "case_study",
        ))
    # Full deck text, extracted at sync time (case-study-text.json).
    text_path = DATA_DIR / "case-study-text.json"
    if text_path.exists():
        titles = {c.get("slug"): c.get("title", "") for c in entries}
        for deck in json.loads(text_path.read_text()):
            slug = deck.get("slug", "unknown")
            label = f"Jaya's case study '{titles.get(slug) or deck.get('title', slug)}'"
            docs.extend(_chunked_body_docs(f"case_study_{slug}", label, deck.get("text", ""), "case_study"))

    if entries:
        names = ", ".join(f"{c.get('title','')} ({c.get('context','')})" for c in entries)
        docs.append((
            "case_studies_summary",
            (
                f"Jaya has written {len(entries)} long-form case "
                f"{'study' if len(entries) == 1 else 'studies'}: {names}. "
                "Each one works a brief end to end — challenge, research, root causes, "
                "solution and impact, execution — and ships with a working prototype. "
                "They are listed at https://jayaremala.com/case-studies."
            ),
            "case_study",
        ))
    return docs


# ── Profile story blocks ───────────────────────────────────────────────────────
#
# Everything the home page says about Jaya lives in profile.json, so Avocado and
# MCP can say it too. Known blocks get phrased documents; any key not handled
# here is still ingested by the catch-all at the bottom, so a new block added
# from the admin is never invisible to Avocado.

_PROFILE_HANDLED = {
    # identity/contact — _build_documents()
    "name", "tagline", "bio", "summary", "location", "email", "phone", "github",
    "linkedin", "resume", "booking_url", "obsession", "currently", "now", "availability",
    # story blocks — below
    "hero", "hire", "avocadoPreview", "why", "hopeMolecules", "opinions", "shipped",
    "shippedLabel", "shippedNote", "heroStats", "heroStatsLabel", "award",
    "previous", "prev_domain", "interested_domain", "contact_description",
}
_SKIP_KEYS = re.compile(r"(image|logo|icon|cover|src|avatar|color|href|slug|id)$", re.I)


def _slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", str(text).lower()).strip("_")[:48] or "item"


def _flatten(value, depth: int = 0) -> str:
    """Readable text from any JSON value — used by the catch-all builders."""
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return str(value)
    if isinstance(value, list):
        return "; ".join(t for t in (_flatten(v, depth + 1) for v in value) if t)
    if isinstance(value, dict):
        parts = []
        for k, v in value.items():
            if _SKIP_KEYS.search(k) or isinstance(v, bool):
                continue
            t = _flatten(v, depth + 1)
            if t:
                parts.append(f"{k}: {t}" if depth < 2 else t)
        return ". ".join(parts)
    return ""


def _build_profile_story_documents(p: dict | None) -> list[tuple[str, str, str]]:
    if not p:
        return []
    docs: list[tuple[str, str, str]] = []

    hero = p.get("hero") or {}
    if hero:
        docs.append(("profile_hero", (
            f"How Jaya introduces himself on his site: \"{hero.get('headline', '')}\" "
            f"{hero.get('discipline', '')}. Known for: {', '.join(hero.get('proof', []))}. "
            f"{hero.get('lead', '')} {hero.get('sub', '')} "
            + (f"His motto: \"{hero['signature']}\"" if hero.get("signature") else "")
        ), "profile"))

    if p.get("previous") or p.get("prev_domain") or p.get("interested_domain"):
        docs.append(("profile_domains", (
            "Where Jaya has worked and where he wants to go: "
            + (f"previously {p['previous']}. " if p.get("previous") else "")
            + (f"Past domain: {p['prev_domain']}. " if p.get("prev_domain") else "")
            + (f"Interested in: {p['interested_domain']}." if p.get("interested_domain") else "")
        ), "profile"))

    hire = p.get("hire") or {}
    if hire:
        docs.append(("profile_hire_fit", (
            f"What a hiring team gets with Jaya ({hire.get('label', '')}): {hire.get('fit', '')} "
            f"{hire.get('deck', '')}"
        ), "profile"))
        for need in hire.get("needs", []):
            docs.append((f"profile_hire_{_slug(need.get('need', ''))}", (
                f"If your team needs {need.get('need', '').lower()}: Jaya delivered "
                f"{need.get('metric', '')} {need.get('metricLabel', '')}. {need.get('context', '')} "
                f"Where: {need.get('where', '')}. How: {need.get('how', '')}"
            ), "profile"))

    for qa in p.get("avocadoPreview") or []:
        if qa.get("q") and qa.get("a"):
            docs.append((f"faq_preview_{_slug(qa['q'])}", (
                f"Q: {qa['q']} A: {qa['a']}" + (f" (Source: {qa['source']}.)" if qa.get("source") else "")
            ), "faq"))

    why = p.get("why") or {}
    if why:
        art = why.get("artifact") or {}
        docs.append(("profile_why", (
            f"Why Jaya builds — his origin story: {' '.join(why.get('paragraphs', []))} "
            + (f"{why['pullQuote']} " if why.get("pullQuote") else "")
            + (f"The first project, {art.get('projectTitle', '')} ({art.get('year', '')}): {art.get('caption', '')}"
               if art else "")
        ), "profile"))

    hope = p.get("hopeMolecules") or {}
    if hope:
        docs.append(("profile_values", (
            f"What Jaya optimizes for — {hope.get('term', '')}: {hope.get('definition', '')} "
            f"{hope.get('belief', '')} {hope.get('closing', '')} {hope.get('footnote', '')}"
        ), "profile"))

    ops = p.get("opinions") or {}
    if ops:
        fors = ops.get("for", [])
        againsts = ops.get("against", [])
        docs.append(("profile_how_i_work", (
            f"How Jaya works ({ops.get('label', 'How I work')}): {ops.get('deck', '')} "
            f"Principles: {'; '.join(o.get('term', '') for o in fors)}. "
            f"Don'ts: {'; '.join(o.get('term', '') for o in againsts)}."
        ), "profile"))
        for o in fors:
            docs.append((f"profile_principle_{_slug(o.get('term', ''))}", (
                f"One of Jaya's working principles: {o.get('term', '')}. {o.get('line', '')}"
            ), "profile"))
        for o in againsts:
            docs.append((f"profile_dont_{_slug(o.get('term', ''))}", (
                f"Something Jaya won't do when he works: {o.get('term', '')}. {o.get('line', '')}"
            ), "profile"))

    shipped = p.get("shipped") or []
    if shipped:
        docs.append(("profile_still_running", (
            f"{p.get('shippedLabel', 'Still running')}: {p.get('shippedNote', '')} "
            + "; ".join(
                f"{s.get('name', '')} — {s.get('what', '')}, used by {s.get('who', '')}, live {s.get('sinceLabel', '')} at {s.get('url', '')}"
                for s in shipped
            ) + "."
        ), "profile"))

    stats = p.get("heroStats") or []
    if stats:
        docs.append(("profile_headline_numbers", (
            f"Jaya's headline numbers ({p.get('heroStatsLabel', '')}): "
            + "; ".join(f"{s.get('value', '')}{s.get('suffix', '')} {s.get('label', '')} ({s.get('sub', '')})" for s in stats)
            + "."
        ), "profile"))

    if p.get("award"):
        docs.append(("profile_award", f"Award: Jaya is a {p['award']}.", "profile"))

    intros = [(k[5:].replace("_", " ").title(), v) for k, v in p.items() if k.startswith("page_") and isinstance(v, str) and v]
    if p.get("contact_description"):
        intros.append(("Contact", p["contact_description"]))
    if intros:
        docs.append(("profile_page_intros", (
            "How Jaya introduces each section of his site: "
            + " ".join(f"{name}: {text}" for name, text in intros)
        ), "profile"))

    # Catch-all: any other profile key (a new block added from the admin).
    for key, value in p.items():
        if key in _PROFILE_HANDLED or key.startswith("page_"):
            continue
        text = _flatten(value)
        if text:
            docs.append((f"profile_extra_{_slug(key)}", f"About Jaya ({key}): {text}", "profile"))
    return docs


# ── The site itself ────────────────────────────────────────────────────────────

def _build_site_documents() -> list[tuple[str, str, str]]:
    """Where things live on jayaremala.com — lets Avocado send people to the right page."""
    site = _load("site.json") or {}
    pages = site.get("pages", [])
    if not pages:
        return []
    base = site.get("url", SITE_URL)
    docs = [(
        "site_map",
        "The pages on Jaya's website, jayaremala.com: "
        + "; ".join(f"{pg.get('label', '')} ({base}{pg.get('href', '')}) — {pg.get('desc', '')}" for pg in pages)
        + ".",
        "site",
    )]
    for pg in pages:
        docs.append((
            f"site_page_{_slug(pg.get('href', '').strip('/') or 'home')}",
            f"The {pg.get('label', '')} page on Jaya's site ({pg.get('group', '')}), at {base}{pg.get('href', '')}: "
            f"{pg.get('about') or pg.get('desc', '')}",
            "site",
        ))
    return docs


# ── Catch-all for knowledge files without a dedicated builder ──────────────────
#
# Drop a new JSON file into data/knowledge/ (or start editing one from the admin)
# and it is chunked and searchable on the next ingest, with no code change.

_FILES_WITH_BUILDERS = {
    "profile.json", "experience.json", "education.json", "projects.json", "skills.json",
    "testimonials.json", "blog.json", "lab.json", "case-studies.json", "case-study-text.json",
    "apps.json", "quotes.json", "gallery.json", "inbox_signals.json", "drive_resume.json",
    "site.json", "mdx-index.json",  # mdx-index is bookkeeping, not content
}
_GENERIC_LABEL = {"spotlights.json": "A spotlight on Jaya's homepage"}


def _build_generic_documents() -> list[tuple[str, str, str]]:
    docs: list[tuple[str, str, str]] = []
    for path in sorted(DATA_DIR.glob("*.json")):
        if path.name in _FILES_WITH_BUILDERS:
            continue
        try:
            data = json.loads(path.read_text())
        except json.JSONDecodeError:
            logger.warning("Skipping invalid knowledge file %s", path.name)
            continue
        stem = path.stem.replace("-", "_")
        label = _GENERIC_LABEL.get(path.name, f"From Jaya's {path.stem.replace('-', ' ')}")
        items = data if isinstance(data, list) else [data]
        for i, item in enumerate(items):
            if isinstance(item, dict) and item.get("enabled") is False:
                continue
            key = _slug(item.get("slug") or item.get("id") or item.get("name") or item.get("title") or i) if isinstance(item, dict) else str(i)
            text = _flatten(item)
            for n, (_, chunk) in enumerate(chunk_text(text)):
                suffix = "" if n == 0 else f"_part_{n}"
                docs.append((f"{stem}_{key}{suffix}", f"{label}: {chunk}", stem))
    return docs


def _build_documents() -> list[tuple[str, str, str]]:
    """Return list of (id, text, type) tuples — atomic chunks for precise retrieval."""
    docs: list[tuple[str, str, str]] = []

    # ── PROFILE ──────────────────────────────────────────────────────────────
    p = _load("profile.json")
    if p:
        docs.append(("profile_overview", (
            f"Jaya Sabarish Reddy Remala is a {p['tagline']}. "
            f"{p.get('summary', p['bio'])} "
            f"He is based in {p['location']}."
        ), "profile"))

        docs.append(("profile_bio", (
            f"About Jaya: {p['bio']}"
        ), "profile"))

        docs.append(("profile_contact", (
            f"Jaya's contact information — "
            f"Email: {p['email']}, "
            f"Phone: {p['phone']}, "
            f"GitHub: {p['github']}, "
            f"LinkedIn: {p['linkedin']}, "
            f"Location: {p['location']}. "
            f"Resume: {p.get('resume', '')}."
            + (f" Book a call: {p['booking_url']}." if p.get('booking_url') else "")
        ), "profile"))

        obsession = p.get("obsession", "")
        currently = p.get("currently", "")
        if obsession or currently:
            docs.append(("profile_focus", (
                "What Jaya is currently focused on and passionate about: "
                + (f"{obsession} " if obsession else "")
                + (f"He is currently experimenting with: {currently}." if currently else "")
            ), "profile"))

        now = p.get("now", {})
        if now:
            docs.append(("profile_now", (
                f"What Jaya is currently doing (as of {now.get('updated', 'recently')}): "
                + (f"Building — {now['building']}. " if now.get('building') else "")
                + (f"Learning — {now['learning']}. " if now.get('learning') else "")
                + (f"Reading — {now['reading']}. " if now.get('reading') else "")
                + (f"Based in {now['location']}." if now.get('location') else "")
            ), "profile"))

        avail = p.get("availability", {})
        if avail:
            types     = ", ".join(avail.get("types", []))
            locations = ", ".join(avail.get("locations", []))
            status    = "open to work" if avail.get("open") else "not currently looking for new roles"
            docs.append(("profile_availability", (
                f"Jaya's current availability: {avail.get('label', '')}. "
                f"He is {status}. "
                + (f"Employment types: {types}. " if types else "")
                + (f"Work location preference: {locations}. " if locations else "")
                + (f"Book a call with him at: {p['booking_url']}." if p.get('booking_url') else "")
            ), "profile"))

    # ── EXPERIENCE ────────────────────────────────────────────────────────────
    exp_list = _load("experience.json")
    if exp_list:
        for i, e in enumerate(exp_list):
            company = e["company"]
            role = e["role"]
            period = f"{e['start']} – {e['end']}"
            tech = e.get("tech", "")

            docs.append((f"exp_{i}_overview", (
                f"Jaya worked as {role} at {company} ({period}). "
                f"{e.get('description', '')} "
                f"Technologies used: {tech}."
            ), "experience"))

            for j, bullet in enumerate(e.get("bullets", [])):
                docs.append((f"exp_{i}_bullet_{j}", (
                    f"At {company} as {role} ({period}): {bullet}"
                ), "experience"))

    # ── EDUCATION ─────────────────────────────────────────────────────────────
    edu_list = _load("education.json")
    if edu_list:
        for i, e in enumerate(edu_list):
            institution = e["institution"]
            school = e.get("school", "")
            full_institution = f"{institution}, {school}" if school else institution
            degree = f"{e['degree']} in {e['field']}"
            period = f"{e['start']} – {e['end']}"
            gpa = e.get("gpa", "")

            docs.append((f"edu_{i}_overview", (
                f"Jaya studied {degree} at {full_institution} ({period}). "
                f"{'GPA: ' + gpa + '.' if gpa else ''}"
            ), "education"))

            for j, h in enumerate(e.get("highlights", [])):
                docs.append((f"edu_{i}_highlight_{j}", (
                    f"At {full_institution}: {h}"
                ), "education"))

    # ── PROJECTS ──────────────────────────────────────────────────────────────
    proj_list = _load("projects.json")
    if proj_list:
        for i, proj in enumerate(proj_list):
            title = proj["title"]
            tags = ", ".join(proj.get("tags", []))
            award = proj.get("award", "")
            award_str = f" This project won the {award}." if award else ""

            docs.append((f"proj_{i}_overview", (
                f"Project: {title}.{award_str} {proj['description']}"
            ), "project"))

            docs.append((f"proj_{i}_tech", (
                f"Technologies used in {title}: {tags}."
                f"{' Award: ' + award if award else ''}"
            ), "project"))

    # ── SKILLS ────────────────────────────────────────────────────────────────
    skills_list = _load("skills.json")
    if skills_list:
        for group in skills_list:
            category = group["category"]
            items = ", ".join(group["items"])
            slug = category.lower().replace(" ", "_").replace("&", "and")
            docs.append((f"skills_{slug}", (
                f"Jaya's {category} skills: {items}."
            ), "skills"))

        all_items = [item for g in skills_list for item in g["items"]]
        docs.append(("skills_all", (
            f"Jaya's full technical skill set spans: {', '.join(all_items)}."
        ), "skills"))

    # ── PROFILE STORY BLOCKS (hero, hire, principles, origin, still running…) ──
    docs.extend(_build_profile_story_documents(p))

    # ── THE SITE ITSELF (page map) ────────────────────────────────────────────
    docs.extend(_build_site_documents())

    # ── TESTIMONIALS ──────────────────────────────────────────────────────────
    docs.extend(_build_testimonial_documents())

    # ── BLOG POSTS ────────────────────────────────────────────────────────────
    docs.extend(_build_blog_documents())

    # ── LAB ENTRIES ───────────────────────────────────────────────────────────
    docs.extend(_build_lab_documents())

    docs.extend(_build_case_study_documents())

    # ── HOSTED APPS (everything Jaya hosts under his domain) ──────────────────
    docs.extend(_build_apps_documents())

    # ── QUOTES ────────────────────────────────────────────────────────────────
    docs.extend(_build_quotes_documents())

    # ── GALLERY ───────────────────────────────────────────────────────────────
    docs.extend(_build_gallery_documents())

    # ── ANY OTHER KNOWLEDGE FILE (spotlights.json and anything added later) ──
    docs.extend(_build_generic_documents())

    # ── FAQ DOCUMENTS (fully dynamic — reads from JSON, no hardcoded content) ──
    docs.extend(_build_faq_documents(p, exp_list, edu_list, proj_list, skills_list))
    docs.extend(_build_system_faq_documents(len(docs)))

    # ── LIVE EXTERNAL DATA (Google integrations — skip gracefully if not set up) ──
    docs.extend(_build_inbox_signals_documents())
    docs.extend(_build_drive_resume_documents())

    return docs


# One ingest at a time. The startup ingest, the content API's background syncs
# and the admin's "Sync now" all write the same Chroma collection and hash file;
# run concurrently they could interleave upserts and save a hash file that does
# not match the index. A later caller waits, then sees the newest data.
_INGEST_LOCK = threading.Lock()

# The most recent ingest, whoever started it — shown in the admin.
LAST_INGEST: dict = {"at": None, "result": None, "error": None, "trigger": None}


def run_ingest(force: bool = False, trigger: str = "manual") -> dict:
    """Sync the knowledge files into ChromaDB (serialised; see _INGEST_LOCK).

    Incremental by default: only new or changed documents are re-embedded, and
    removed ones are deleted. `force=True` re-embeds every document *in place* —
    the live index keeps answering while it runs, instead of being wiped first.
    The collection is only dropped when the embedding model itself changed,
    because old vectors would then have the wrong dimension.

    Returns {added, updated, deleted, unchanged, total, by_type}.
    """
    with _INGEST_LOCK:
        try:
            result = _run_ingest_locked(force)
        except Exception as exc:
            LAST_INGEST.update(at=time.time(), result=None, error=str(exc), trigger=trigger)
            raise
        LAST_INGEST.update(at=time.time(), result=result, error=None, trigger=trigger)
        return result


def _run_ingest_locked(force: bool) -> dict:
    _sync_content_db()  # sync content.db → JSON files before building corpus
    docs = _build_documents()  # always build full corpus — BM25 needs it

    # ── Embedding model version check ─────────────────────────────────────────
    stored_raw = _load_doc_hashes()
    stored_model = stored_raw.pop("__embed_model__", None)
    if stored_model != EMBED_MODEL:
        logger.info(
            "Embedding model changed (%s → %s) — resetting ChromaDB collection for full reingest",
            stored_model, EMBED_MODEL,
        )
        reset_collection()
        gc.collect()
        stored_raw = {}
        force = True
    elif force:
        logger.info("Full re-embed requested — re-embedding every document in place")
    stored = {} if force else stored_raw

    collection = get_collection()
    current = {doc_id: _short_hash(text) for doc_id, text, _ in docs}

    to_upsert = [
        (doc_id, text, typ)
        for doc_id, text, typ in docs
        if force or stored.get(doc_id) != current[doc_id]
    ]
    if force:
        # Compare against what is actually in the index, not the hash file.
        indexed = set(collection.get(include=[])["ids"])
        to_delete = sorted(i for i in indexed if i not in current)
    else:
        to_delete = [doc_id for doc_id in stored if doc_id not in current]

    added = sum(1 for d in to_upsert if d[0] not in stored_raw)
    updated = len(to_upsert) - added

    if to_delete:
        collection.delete(ids=to_delete)
        clear_query_cache()
        logger.info("Deleted %d stale documents: %s", len(to_delete), to_delete)

    if to_upsert:
        # Batch upserts to cap peak RAM per embedding forward pass.
        # Each batch = one call to the ONNX model; gc.collect() + a short sleep
        # between batches lets the GC free intermediate tensors before the next
        # batch loads, keeping peak memory well under the server limit.
        for batch_start in range(0, len(to_upsert), _INGEST_BATCH_SIZE):
            batch = to_upsert[batch_start : batch_start + _INGEST_BATCH_SIZE]
            collection.upsert(
                ids=[d[0] for d in batch],
                documents=[d[1] for d in batch],
                metadatas=[
                    {"type": d[2], "id": d[0], "entity_type": _entity_type(d[0], d[2])}
                    for d in batch
                ],
            )
            gc.collect()
            time.sleep(0.05)  # yield to other threads between batches
            logger.debug(
                "Embedded batch %d/%d",
                min(batch_start + _INGEST_BATCH_SIZE, len(to_upsert)),
                len(to_upsert),
            )
        clear_query_cache()
        logger.info("Upserted %d documents (%d new, %d updated)", len(to_upsert), added, updated)
    else:
        logger.info("Knowledge base up to date — nothing to embed")

    build_bm25_index(docs)

    new_hashes = {**stored, **{d[0]: current[d[0]] for d in to_upsert}}
    for doc_id in to_delete:
        new_hashes.pop(doc_id, None)
    new_hashes["__embed_model__"] = EMBED_MODEL
    _save_doc_hashes(new_hashes)

    unchanged = len(docs) - len(to_upsert)
    total = collection.count()
    logger.info(
        "Ingest complete — added=%d updated=%d deleted=%d unchanged=%d total_in_db=%d",
        added, updated, len(to_delete), unchanged, total,
    )
    # Role → project links may have changed with the data.
    try:
        from app.rag.graph import build_graph  # noqa: PLC0415 — graph imports nothing from here
        build_graph()
    except Exception as exc:
        logger.warning("Knowledge graph rebuild failed (non-fatal): %s", exc)

    by_type: dict[str, int] = {}
    for _, _, typ in docs:
        by_type[typ] = by_type.get(typ, 0) + 1
    return {
        "added": added, "updated": updated, "deleted": len(to_delete), "unchanged": unchanged,
        "total": total, "by_type": dict(sorted(by_type.items(), key=lambda kv: -kv[1])),
    }


def remove_docs_by_id(doc_ids: list[str]) -> None:
    """Directly remove specific documents from ChromaDB and the hash file.

    Used on content deletion so the document disappears from the knowledge base
    immediately, before the next incremental ingest runs.
    """
    if not doc_ids:
        return
    try:
        collection = get_collection()
        existing = collection.get(ids=doc_ids, include=[])["ids"]
        if existing:
            collection.delete(ids=existing)
            clear_query_cache()
            logger.info("Removed %d doc(s) directly from ChromaDB: %s", len(existing), existing)
        hashes = _load_doc_hashes()
        changed = any(d in hashes for d in doc_ids)
        for doc_id in doc_ids:
            hashes.pop(doc_id, None)
        if changed:
            _save_doc_hashes(hashes)
    except Exception as exc:
        logger.warning("remove_docs_by_id failed (non-fatal): %s", exc)


def remove_entity_docs(doc_id: str) -> None:
    """Remove a document and all of its chunks (`<id>_part_<n>`) right away.

    Used when a blog post or lab entry is deleted, so its body stops being
    retrievable immediately rather than after the background ingest.
    """
    ids = {doc_id} | {k for k in _load_doc_hashes() if k.startswith(f"{doc_id}_part_")}
    remove_docs_by_id(sorted(ids))


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    result = run_ingest(force=True)
    print(f"Ingest result: {result}")

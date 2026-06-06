"""SQLite-backed content store — blog posts, lab entries, quotes.

Separate from analytics.db so content schema migrations never lock analytics writes.
DB path controlled by CONTENT_DB_PATH env var (defaults to ./chroma_db/content.db).

Seeded on first run from backend/data/knowledge/{blog,lab,quotes}.json so existing
content migrates automatically without a manual step.
"""
from __future__ import annotations

import json
import logging
import sqlite3
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

_DATA_DIR = Path(__file__).parents[3] / "data" / "knowledge"


def _db_path() -> Path:
    from app.core.settings import settings
    return Path(settings.content_db_path)


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(_db_path(), timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    conn.execute("PRAGMA busy_timeout=5000")
    return conn


# ── Schema ─────────────────────────────────────────────────────────────────────

def init_db() -> None:
    p = _db_path()
    p.parent.mkdir(parents=True, exist_ok=True)
    with _connect() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS blog_posts (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                slug         TEXT    NOT NULL UNIQUE,
                title        TEXT    NOT NULL,
                date         TEXT    NOT NULL DEFAULT '',
                published_at TEXT    NOT NULL DEFAULT '',
                description  TEXT    NOT NULL DEFAULT '',
                tags         TEXT    NOT NULL DEFAULT '[]',
                image        TEXT    DEFAULT NULL,
                content      TEXT    NOT NULL DEFAULT '',
                published    INTEGER NOT NULL DEFAULT 1,
                created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_blog_published_at ON blog_posts(published_at DESC)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_blog_published ON blog_posts(published)"
        )

        conn.execute("""
            CREATE TABLE IF NOT EXISTS lab_entries (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                slug         TEXT    NOT NULL UNIQUE,
                title        TEXT    NOT NULL,
                status       TEXT    NOT NULL DEFAULT 'active',
                description  TEXT    NOT NULL DEFAULT '',
                started_at   TEXT    NOT NULL DEFAULT '',
                updated_at   TEXT    NOT NULL DEFAULT '',
                tech         TEXT    NOT NULL DEFAULT '[]',
                links        TEXT    NOT NULL DEFAULT '[]',
                content      TEXT    NOT NULL DEFAULT '',
                created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_lab_status ON lab_entries(status)"
        )

        conn.execute("""
            CREATE TABLE IF NOT EXISTS quotes (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                quote_id    TEXT    NOT NULL UNIQUE,
                text        TEXT    NOT NULL,
                author      TEXT    NOT NULL,
                source      TEXT    DEFAULT NULL,
                category    TEXT    NOT NULL DEFAULT 'Philosophy',
                favorite    INTEGER NOT NULL DEFAULT 0,
                featured    INTEGER NOT NULL DEFAULT 0,
                added_at    TEXT    NOT NULL DEFAULT '',
                created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

    _seed_if_empty()


def _seed_if_empty() -> None:
    """One-time seed from existing JSON files if tables are empty."""
    with _connect() as conn:
        if conn.execute("SELECT COUNT(*) FROM blog_posts").fetchone()[0] == 0:
            _seed_blog(conn)
        if conn.execute("SELECT COUNT(*) FROM lab_entries").fetchone()[0] == 0:
            _seed_lab(conn)
        if conn.execute("SELECT COUNT(*) FROM quotes").fetchone()[0] == 0:
            _seed_quotes(conn)


def _seed_blog(conn: sqlite3.Connection) -> None:
    path = _DATA_DIR / "blog.json"
    if not path.exists():
        return
    posts = json.loads(path.read_text())
    # Also try to read full MDX content from disk
    mdx_dir = Path(__file__).parents[5] / "frontend" / "src" / "content" / "blog"
    for post in posts:
        slug = post.get("slug", "")
        content = post.get("content", "")
        mdx_file = mdx_dir / f"{slug}.mdx"
        if mdx_file.exists():
            # Strip frontmatter, keep body
            raw = mdx_file.read_text()
            content = _strip_frontmatter(raw)
        conn.execute(
            """INSERT OR IGNORE INTO blog_posts
               (slug, title, date, published_at, description, tags, content, published)
               VALUES (?, ?, ?, ?, ?, ?, ?, 1)""",
            (
                slug,
                post.get("title", ""),
                post.get("date", ""),
                post.get("publishedAt", post.get("date", "")),
                post.get("description", ""),
                json.dumps(post.get("tags", [])),
                content,
            ),
        )
    logger.info("Seeded %d blog posts from blog.json", len(posts))


def _seed_lab(conn: sqlite3.Connection) -> None:
    path = _DATA_DIR / "lab.json"
    if not path.exists():
        return
    entries = json.loads(path.read_text())
    mdx_dir = Path(__file__).parents[5] / "frontend" / "src" / "content" / "lab"
    for entry in entries:
        slug = entry.get("slug", "")
        content = entry.get("content", "")
        mdx_file = mdx_dir / f"{slug}.mdx"
        if mdx_file.exists():
            raw = mdx_file.read_text()
            content = _strip_frontmatter(raw)
        conn.execute(
            """INSERT OR IGNORE INTO lab_entries
               (slug, title, status, description, started_at, updated_at, tech, links, content)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                slug,
                entry.get("title", ""),
                entry.get("status", "active"),
                entry.get("description", ""),
                entry.get("startedAt", ""),
                entry.get("updatedAt", ""),
                json.dumps(entry.get("tech", [])),
                json.dumps(entry.get("links", [])),
                content,
            ),
        )
    logger.info("Seeded %d lab entries from lab.json", len(entries))


def _seed_quotes(conn: sqlite3.Connection) -> None:
    path = _DATA_DIR / "quotes.json"
    if not path.exists():
        return
    quotes = json.loads(path.read_text())
    for q in quotes:
        conn.execute(
            """INSERT OR IGNORE INTO quotes
               (quote_id, text, author, source, category, favorite, featured, added_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                q.get("id", ""),
                q.get("text", ""),
                q.get("author", ""),
                q.get("source"),
                q.get("category", "Philosophy"),
                1 if q.get("favorite") else 0,
                1 if q.get("featured") else 0,
                q.get("addedAt", ""),
            ),
        )
    logger.info("Seeded %d quotes from quotes.json", len(quotes))


def _strip_frontmatter(raw: str) -> str:
    """Remove YAML frontmatter block (--- ... ---) and return the body."""
    if raw.startswith("---"):
        end = raw.find("---", 3)
        if end != -1:
            return raw[end + 3:].lstrip("\n")
    return raw


# ── Row → dict helper ──────────────────────────────────────────────────────────

def _row(r: sqlite3.Row) -> dict[str, Any]:
    d = dict(r)
    for key in ("tags", "tech", "links"):
        if key in d and isinstance(d[key], str):
            try:
                d[key] = json.loads(d[key])
            except (json.JSONDecodeError, TypeError):
                d[key] = []
    for key in ("favorite", "featured", "published"):
        if key in d:
            d[key] = bool(d[key])
    return d


# ── Blog CRUD ──────────────────────────────────────────────────────────────────

def list_blog_posts(include_drafts: bool = False) -> list[dict]:
    with _connect() as conn:
        if include_drafts:
            rows = conn.execute(
                "SELECT * FROM blog_posts ORDER BY published_at DESC"
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM blog_posts WHERE published=1 ORDER BY published_at DESC"
            ).fetchall()
    return [_row(r) for r in rows]


def get_blog_post(slug: str) -> dict | None:
    with _connect() as conn:
        row = conn.execute(
            "SELECT * FROM blog_posts WHERE slug=?", (slug,)
        ).fetchone()
    return _row(row) if row else None


def create_blog_post(data: dict) -> dict:
    with _connect() as conn:
        conn.execute(
            """INSERT INTO blog_posts
               (slug, title, date, published_at, description, tags, image, content, published)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                data["slug"],
                data["title"],
                data.get("date", ""),
                data.get("published_at", data.get("date", "")),
                data.get("description", ""),
                json.dumps(data.get("tags", [])),
                data.get("image"),
                data.get("content", ""),
                1 if data.get("published", True) else 0,
            ),
        )
        row = conn.execute(
            "SELECT * FROM blog_posts WHERE slug=?", (data["slug"],)
        ).fetchone()
    return _row(row)


def update_blog_post(slug: str, data: dict) -> dict | None:
    with _connect() as conn:
        conn.execute(
            """UPDATE blog_posts SET
               title=?, date=?, published_at=?, description=?, tags=?,
               image=?, content=?, published=?, updated_at=CURRENT_TIMESTAMP
               WHERE slug=?""",
            (
                data["title"],
                data.get("date", ""),
                data.get("published_at", data.get("date", "")),
                data.get("description", ""),
                json.dumps(data.get("tags", [])),
                data.get("image"),
                data.get("content", ""),
                1 if data.get("published", True) else 0,
                slug,
            ),
        )
        row = conn.execute(
            "SELECT * FROM blog_posts WHERE slug=?", (slug,)
        ).fetchone()
    return _row(row) if row else None


def delete_blog_post(slug: str) -> bool:
    with _connect() as conn:
        cur = conn.execute("DELETE FROM blog_posts WHERE slug=?", (slug,))
    return cur.rowcount > 0


# ── Lab CRUD ───────────────────────────────────────────────────────────────────

def list_lab_entries() -> list[dict]:
    with _connect() as conn:
        rows = conn.execute(
            "SELECT * FROM lab_entries ORDER BY CASE status WHEN 'active' THEN 0 WHEN 'paused' THEN 1 ELSE 2 END, started_at DESC"
        ).fetchall()
    return [_row(r) for r in rows]


def get_lab_entry(slug: str) -> dict | None:
    with _connect() as conn:
        row = conn.execute(
            "SELECT * FROM lab_entries WHERE slug=?", (slug,)
        ).fetchone()
    return _row(row) if row else None


def create_lab_entry(data: dict) -> dict:
    with _connect() as conn:
        conn.execute(
            """INSERT INTO lab_entries
               (slug, title, status, description, started_at, updated_at, tech, links, content)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                data["slug"],
                data["title"],
                data.get("status", "active"),
                data.get("description", ""),
                data.get("started_at", ""),
                data.get("updated_at", ""),
                json.dumps(data.get("tech", [])),
                json.dumps(data.get("links", [])),
                data.get("content", ""),
            ),
        )
        row = conn.execute(
            "SELECT * FROM lab_entries WHERE slug=?", (data["slug"],)
        ).fetchone()
    return _row(row)


def update_lab_entry(slug: str, data: dict) -> dict | None:
    with _connect() as conn:
        conn.execute(
            """UPDATE lab_entries SET
               title=?, status=?, description=?, started_at=?, updated_at=?,
               tech=?, links=?, content=?
               WHERE slug=?""",
            (
                data["title"],
                data.get("status", "active"),
                data.get("description", ""),
                data.get("started_at", ""),
                data.get("updated_at", ""),
                json.dumps(data.get("tech", [])),
                json.dumps(data.get("links", [])),
                data.get("content", ""),
                slug,
            ),
        )
        row = conn.execute(
            "SELECT * FROM lab_entries WHERE slug=?", (slug,)
        ).fetchone()
    return _row(row) if row else None


def delete_lab_entry(slug: str) -> bool:
    with _connect() as conn:
        cur = conn.execute("DELETE FROM lab_entries WHERE slug=?", (slug,))
    return cur.rowcount > 0


# ── Quotes CRUD ────────────────────────────────────────────────────────────────

def list_quotes() -> list[dict]:
    with _connect() as conn:
        rows = conn.execute(
            "SELECT * FROM quotes ORDER BY featured DESC, favorite DESC, added_at DESC"
        ).fetchall()
    return [_row(r) for r in rows]


def get_quote(quote_id: str) -> dict | None:
    with _connect() as conn:
        row = conn.execute(
            "SELECT * FROM quotes WHERE quote_id=?", (quote_id,)
        ).fetchone()
    return _row(row) if row else None


def create_quote(data: dict) -> dict:
    with _connect() as conn:
        conn.execute(
            """INSERT INTO quotes
               (quote_id, text, author, source, category, favorite, featured, added_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                data["quote_id"],
                data["text"],
                data["author"],
                data.get("source"),
                data.get("category", "Philosophy"),
                1 if data.get("favorite") else 0,
                1 if data.get("featured") else 0,
                data.get("added_at", ""),
            ),
        )
        row = conn.execute(
            "SELECT * FROM quotes WHERE quote_id=?", (data["quote_id"],)
        ).fetchone()
    return _row(row)


def update_quote(quote_id: str, data: dict) -> dict | None:
    with _connect() as conn:
        conn.execute(
            """UPDATE quotes SET
               text=?, author=?, source=?, category=?, favorite=?, featured=?, added_at=?
               WHERE quote_id=?""",
            (
                data["text"],
                data["author"],
                data.get("source"),
                data.get("category", "Philosophy"),
                1 if data.get("favorite") else 0,
                1 if data.get("featured") else 0,
                data.get("added_at", ""),
                quote_id,
            ),
        )
        row = conn.execute(
            "SELECT * FROM quotes WHERE quote_id=?", (quote_id,)
        ).fetchone()
    return _row(row) if row else None


def delete_quote(quote_id: str) -> bool:
    with _connect() as conn:
        cur = conn.execute("DELETE FROM quotes WHERE quote_id=?", (quote_id,))
    return cur.rowcount > 0


# ── JSON regeneration helpers (used by content router after CRUD) ──────────────

def regenerate_blog_json() -> None:
    """Rewrite backend/data/knowledge/blog.json from content.db so run_ingest() stays current."""
    posts = list_blog_posts(include_drafts=False)
    output = []
    for p in posts:
        # Truncate body to 2000 chars for RAG (keeps ChromaDB doc size bounded)
        body = p.get("content", "")[:2000]
        output.append({
            "slug": p["slug"],
            "title": p["title"],
            "date": p["date"],
            "publishedAt": p["published_at"],
            "description": p["description"],
            "tags": p.get("tags", []),
            "content": body,
        })
    path = _DATA_DIR / "blog.json"
    path.write_text(json.dumps(output, indent=2, ensure_ascii=False))
    logger.info("Regenerated blog.json (%d posts)", len(output))


def regenerate_lab_json() -> None:
    """Rewrite backend/data/knowledge/lab.json from content.db."""
    entries = list_lab_entries()
    output = []
    for e in entries:
        body = e.get("content", "")[:3000]
        output.append({
            "slug": e["slug"],
            "title": e["title"],
            "status": e["status"],
            "description": e["description"],
            "startedAt": e["started_at"],
            "updatedAt": e["updated_at"],
            "tech": e.get("tech", []),
            "links": e.get("links", []),
            "content": body,
        })
    path = _DATA_DIR / "lab.json"
    path.write_text(json.dumps(output, indent=2, ensure_ascii=False))
    logger.info("Regenerated lab.json (%d entries)", len(output))


def regenerate_quotes_json() -> None:
    """Rewrite backend/data/knowledge/quotes.json from content.db."""
    quotes = list_quotes()
    output = []
    for q in quotes:
        output.append({
            "id": q["quote_id"],
            "text": q["text"],
            "author": q["author"],
            "source": q.get("source") or "",
            "category": q.get("category", "Philosophy"),
            "favorite": bool(q.get("favorite")),
            "featured": bool(q.get("featured")),
            "addedAt": q.get("added_at", ""),
        })
    path = _DATA_DIR / "quotes.json"
    path.write_text(json.dumps(output, indent=2, ensure_ascii=False))
    logger.info("Regenerated quotes.json (%d quotes)", len(output))

"""SQLite-backed blog engagement — views (unique per IP) and claps (up to 50 per IP per post).
Shares the same DB file as analytics.py, path controlled by ANALYTICS_DB_PATH env var.
"""
from __future__ import annotations

import hashlib
import logging
import sqlite3
from pathlib import Path

logger = logging.getLogger(__name__)
MAX_CLAPS_PER_USER = 50


def _db_path() -> Path:
    from app.core.settings import settings
    return Path(settings.analytics_db_path)


def init_db() -> None:
    p = _db_path()
    p.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(p) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS blog_views (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                slug       TEXT    NOT NULL,
                ip_hash    TEXT    NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(slug, ip_hash)
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS blog_claps (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                slug       TEXT    NOT NULL,
                ip_hash    TEXT    NOT NULL,
                count      INTEGER NOT NULL DEFAULT 0,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(slug, ip_hash)
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_view_slug  ON blog_views(slug)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_clap_slug  ON blog_claps(slug)")
    logger.info("Blog stats DB ready")


def _hash(ip: str) -> str:
    return hashlib.sha256(ip.encode()).hexdigest()


def record_view(slug: str, ip: str) -> dict[str, int]:
    """Record a unique view. Idempotent — duplicate IPs are silently ignored."""
    h = _hash(ip)
    try:
        with sqlite3.connect(_db_path()) as conn:
            conn.execute(
                "INSERT OR IGNORE INTO blog_views (slug, ip_hash) VALUES (?, ?)", (slug, h)
            )
    except Exception as exc:
        logger.warning("record_view failed: %s", exc)
    return get_post_stats(slug, ip)


def record_clap(slug: str, ip: str, count: int) -> dict[str, int]:
    """Add claps for a post. Caps total per-IP claps at MAX_CLAPS_PER_USER."""
    h = _hash(ip)
    try:
        with sqlite3.connect(_db_path()) as conn:
            row = conn.execute(
                "SELECT count FROM blog_claps WHERE slug=? AND ip_hash=?", (slug, h)
            ).fetchone()
            current = row[0] if row else 0
            allowed = min(count, MAX_CLAPS_PER_USER - current)
            if allowed > 0:
                conn.execute("""
                    INSERT INTO blog_claps (slug, ip_hash, count)
                    VALUES (?, ?, ?)
                    ON CONFLICT(slug, ip_hash) DO UPDATE SET
                        count = count + excluded.count,
                        updated_at = CURRENT_TIMESTAMP
                """, (slug, h, allowed))
    except Exception as exc:
        logger.warning("record_clap failed: %s", exc)
    return get_post_stats(slug, ip)


def get_post_stats(slug: str, ip: str) -> dict[str, int]:
    h = _hash(ip)
    try:
        with sqlite3.connect(_db_path()) as conn:
            views = conn.execute(
                "SELECT COUNT(*) FROM blog_views WHERE slug=?", (slug,)
            ).fetchone()[0]
            claps = conn.execute(
                "SELECT COALESCE(SUM(count),0) FROM blog_claps WHERE slug=?", (slug,)
            ).fetchone()[0]
            user_claps = conn.execute(
                "SELECT COALESCE(count,0) FROM blog_claps WHERE slug=? AND ip_hash=?", (slug, h)
            ).fetchone()
            user_claps = user_claps[0] if user_claps else 0
        return {"views": views, "claps": claps, "user_claps": user_claps}
    except Exception as exc:
        logger.warning("get_post_stats failed: %s", exc)
        return {"views": 0, "claps": 0, "user_claps": 0}


_CUTOFFS = {
    "week":  "datetime('now', '-7 days')",
    "month": "datetime('now', '-30 days')",
    "year":  "datetime('now', '-365 days')",
}


def get_summary(period: str = "all") -> dict:
    """Returns total claps and per-post stats. period: week | month | year | all."""
    view_where = f"AND created_at >= {_CUTOFFS[period]}" if period in _CUTOFFS else ""
    clap_where = f"AND updated_at >= {_CUTOFFS[period]}" if period in _CUTOFFS else ""
    try:
        with sqlite3.connect(_db_path()) as conn:
            total_claps = conn.execute(
                f"SELECT COALESCE(SUM(count),0) FROM blog_claps WHERE 1=1 {clap_where}"
            ).fetchone()[0]
            total_views = conn.execute(
                f"SELECT COUNT(*) FROM blog_views WHERE 1=1 {view_where}"
            ).fetchone()[0]
            rows = conn.execute(f"""
                SELECT slug,
                       (SELECT COUNT(*) FROM blog_views v WHERE v.slug = s.slug {view_where}) AS views,
                       (SELECT COALESCE(SUM(count),0) FROM blog_claps c WHERE c.slug = s.slug {clap_where}) AS claps
                FROM (SELECT DISTINCT slug FROM blog_views
                      UNION SELECT DISTINCT slug FROM blog_claps) s
            """).fetchall()
        posts = [{"slug": r[0], "views": r[1], "claps": r[2]} for r in rows]
        return {"total_claps": total_claps, "total_views": total_views, "posts": posts}
    except Exception as exc:
        logger.warning("get_summary failed: %s", exc)
        return {"total_claps": 0, "total_views": 0, "posts": []}

"""SQLite-backed analytics — tracks unique visitors (hashed IPs) and total responses.
DB path is controlled by ANALYTICS_DB_PATH env var so it always resolves to the
persistent volume regardless of working directory changes between deploys.
"""
from __future__ import annotations

import hashlib
import json
import logging
import sqlite3
from pathlib import Path
from urllib.request import urlopen

logger = logging.getLogger(__name__)

_PRIVATE_IP_PREFIXES = ("127.", "10.", "192.168.", "172.16.", "172.17.", "172.18.",
                        "172.19.", "172.20.", "172.21.", "172.22.", "172.23.",
                        "172.24.", "172.25.", "172.26.", "172.27.", "172.28.",
                        "172.29.", "172.30.", "172.31.", "::1")


def _db_path() -> Path:
    from app.core.settings import settings
    return Path(settings.analytics_db_path)


def _connect() -> sqlite3.Connection:
    """Open a WAL-mode connection with a busy timeout for concurrent safety."""
    conn = sqlite3.connect(_db_path(), timeout=10)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    conn.execute("PRAGMA busy_timeout=5000")
    return conn


def init_db() -> None:
    p = _db_path()
    p.parent.mkdir(parents=True, exist_ok=True)
    with _connect() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS interactions (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                ip_hash    TEXT    NOT NULL,
                country    TEXT    DEFAULT '',
                city       TEXT    DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_ip ON interactions(ip_hash)")
        conn.execute("""
            CREATE TABLE IF NOT EXISTS feedback (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                message_hash TEXT    NOT NULL,
                rating       INTEGER NOT NULL CHECK(rating IN (1, -1)),
                created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_feedback_hash ON feedback(message_hash)")
        conn.execute("""
            CREATE TABLE IF NOT EXISTS questions (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                text       TEXT    NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS experience_ratings (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                rating     INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS site_visits (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                ip_hash    TEXT    NOT NULL,
                page       TEXT    DEFAULT '/',
                country    TEXT    DEFAULT '',
                city       TEXT    DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_site_visit_ip ON site_visits(ip_hash)")
        # Migrate existing tables first (adds page/country/city if missing),
        # then create the page index — order matters: column must exist before index.
        _migrate(conn)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_site_visit_page ON site_visits(page)")
    logger.info("Analytics DB ready: %s", p.resolve())


def _migrate(conn: sqlite3.Connection) -> None:
    """Add new columns to tables that may have been created before these columns existed."""
    for table, col_def in [
        ("interactions", "country TEXT DEFAULT ''"),
        ("interactions", "city TEXT DEFAULT ''"),
        ("site_visits",  "page TEXT DEFAULT '/'"),
        ("site_visits",  "country TEXT DEFAULT ''"),
        ("site_visits",  "city TEXT DEFAULT ''"),
    ]:
        try:
            conn.execute(f"ALTER TABLE {table} ADD COLUMN {col_def}")
        except sqlite3.OperationalError:
            pass  # Column already exists


# ── Geo lookup ────────────────────────────────────────────────────────────────

def _geo_lookup(ip: str) -> tuple[str, str]:
    """Returns (country, city). Empty strings for private IPs or on any failure."""
    if not ip or ip in ("unknown", "localhost") or any(ip.startswith(p) for p in _PRIVATE_IP_PREFIXES):
        return "", ""
    try:
        url = f"http://ip-api.com/json/{ip}?fields=status,country,city"
        with urlopen(url, timeout=2) as resp:  # noqa: S310
            data = json.loads(resp.read())
        if data.get("status") == "success":
            return data.get("country", ""), data.get("city", "")
    except Exception:
        pass
    return "", ""


def update_visit_geo(table: str, row_id: int, country: str, city: str) -> None:
    if not country and not city:
        return
    try:
        with _connect() as conn:
            conn.execute(
                f"UPDATE {table} SET country=?, city=? WHERE id=?",  # noqa: S608
                (country, city, row_id),
            )
    except Exception as exc:
        logger.warning("update_visit_geo failed: %s", exc)


def geo_update_sync(table: str, row_id: int, ip: str) -> None:
    """Resolve geo for an already-inserted row. Designed to run in a daemon thread."""
    country, city = _geo_lookup(ip)
    update_visit_geo(table, row_id, country, city)


# ── Record helpers ────────────────────────────────────────────────────────────

_CUTOFFS = {
    "week":  "datetime('now', '-7 days')",
    "month": "datetime('now', '-30 days')",
    "year":  "datetime('now', '-365 days')",
}

SESSION_GAP_SECONDS = 600  # 10 minutes


def record(identifier: str) -> int | None:
    """Record a chat response. identifier is a visitor UUID or raw IP.
    Returns the new row id (for geo back-fill).
    """
    id_hash = hashlib.sha256(identifier.encode()).hexdigest()
    try:
        with _connect() as conn:
            cur = conn.execute("INSERT INTO interactions (ip_hash) VALUES (?)", (id_hash,))
            return cur.lastrowid
    except Exception as exc:
        logger.warning("Analytics record failed (non-fatal): %s", exc)
        return None


def record_site_visit(identifier: str, page: str = "/") -> int | None:
    """Insert a site-visit session row and return its id, or None if within the
    10-minute window for the same (identifier, page) pair.
    identifier is a visitor UUID (x-visitor-id header) or raw IP as fallback.
    Dedup is per (identifier, page) so each page is counted separately.
    """
    id_hash = hashlib.sha256(identifier.encode()).hexdigest()
    try:
        with _connect() as conn:
            cur = conn.execute(
                """
                INSERT INTO site_visits (ip_hash, page)
                SELECT ?, ?
                WHERE NOT EXISTS (
                    SELECT 1 FROM site_visits
                    WHERE ip_hash = ?
                    AND page = ?
                    AND created_at >= datetime('now', ?)
                )
                """,
                (id_hash, page, id_hash, page, f"-{SESSION_GAP_SECONDS} seconds"),
            )
            if cur.rowcount == 0:
                return None  # Same session on this page — skip
            return cur.lastrowid
    except Exception as exc:
        logger.warning("record_site_visit failed (non-fatal): %s", exc)
        return None


def record_feedback(message_hash: str, rating: int) -> None:
    try:
        with _connect() as conn:
            conn.execute(
                "INSERT INTO feedback (message_hash, rating) VALUES (?, ?)",
                (message_hash, rating),
            )
    except Exception as exc:
        logger.warning("Feedback record failed (non-fatal): %s", exc)


def record_question(text: str) -> None:
    normalized = text.strip()[:500]
    if not normalized:
        return
    try:
        with _connect() as conn:
            conn.execute("INSERT INTO questions (text) VALUES (?)", (normalized,))
    except Exception as exc:
        logger.warning("record_question failed (non-fatal): %s", exc)


def record_experience_rating(rating: int) -> None:
    if not 1 <= rating <= 5:
        return
    try:
        with _connect() as conn:
            conn.execute("INSERT INTO experience_ratings (rating) VALUES (?)", (rating,))
    except Exception as exc:
        logger.warning("record_experience_rating failed (non-fatal): %s", exc)


# ── Query helpers ─────────────────────────────────────────────────────────────

def get_top_questions(n: int = 15, period: str = "all") -> list[dict]:
    and_clause = f"AND created_at >= {_CUTOFFS[period]}" if period in _CUTOFFS else ""
    try:
        with _connect() as conn:
            rows = conn.execute(f"""
                SELECT text, COUNT(*) AS cnt
                FROM questions
                WHERE 1=1 {and_clause}
                GROUP BY lower(trim(text))
                ORDER BY cnt DESC
                LIMIT ?
            """, (n,)).fetchall()
        return [{"text": r[0], "count": r[1]} for r in rows]
    except Exception as exc:
        logger.warning("get_top_questions failed: %s", exc)
        return []


def get_feedback_summary(period: str = "all") -> dict:
    and_clause = f"AND created_at >= {_CUTOFFS[period]}" if period in _CUTOFFS else ""
    try:
        with _connect() as conn:
            row = conn.execute(f"""
                SELECT
                    COUNT(*) AS total,
                    SUM(CASE WHEN rating=1  THEN 1 ELSE 0 END) AS positive,
                    SUM(CASE WHEN rating=-1 THEN 1 ELSE 0 END) AS negative
                FROM feedback WHERE 1=1 {and_clause}
            """).fetchone()
        total, positive, negative = row[0], row[1] or 0, row[2] or 0
        satisfaction = round(positive / total * 100) if total > 0 else 0
        return {"total": total, "positive": positive, "negative": negative, "satisfaction_pct": satisfaction}
    except Exception as exc:
        logger.warning("get_feedback_summary failed: %s", exc)
        return {"total": 0, "positive": 0, "negative": 0, "satisfaction_pct": 0}


def get_experience_rating_summary(period: str = "all") -> dict:
    where = f"WHERE created_at >= {_CUTOFFS[period]}" if period in _CUTOFFS else ""
    try:
        with _connect() as conn:
            rows = conn.execute(
                f"SELECT rating, COUNT(*) FROM experience_ratings {where} GROUP BY rating"
            ).fetchall()
        dist = {i: 0 for i in range(1, 6)}
        for r, c in rows:
            dist[int(r)] = c
        total = sum(dist.values())
        avg = round(sum(r * c for r, c in dist.items()) / total, 1) if total > 0 else 0
        return {"total": total, "average": avg, "distribution": dist}
    except Exception as exc:
        logger.warning("get_experience_rating_summary failed: %s", exc)
        return {"total": 0, "average": 0, "distribution": {i: 0 for i in range(1, 6)}}


def get_stats(period: str = "all") -> dict[str, int]:
    """Chat interaction stats. sessions = distinct 10-min windows (via SQL LAG)."""
    where = f"WHERE created_at >= {_CUTOFFS[period]}" if period in _CUTOFFS else ""
    try:
        with _connect() as conn:
            total  = conn.execute(f"SELECT COUNT(*) FROM interactions {where}").fetchone()[0]
            unique = conn.execute(f"SELECT COUNT(DISTINCT ip_hash) FROM interactions {where}").fetchone()[0]
            # A new session starts when: first row for this IP, OR 10+ min gap since previous row
            sessions = conn.execute(f"""
                SELECT COUNT(*) FROM (
                    SELECT ip_hash, created_at,
                           LAG(created_at) OVER (PARTITION BY ip_hash ORDER BY created_at) AS prev
                    FROM interactions {where}
                ) WHERE prev IS NULL
                   OR (strftime('%s', created_at) - strftime('%s', prev)) >= {SESSION_GAP_SECONDS}
            """).fetchone()[0]
        return {"total_responses": total, "unique_visitors": unique, "sessions": sessions}
    except Exception as exc:
        logger.warning("Analytics query failed: %s", exc)
        return {"total_responses": 0, "unique_visitors": 0, "sessions": 0}


def get_site_visitor_stats(period: str = "all") -> dict[str, int]:
    """Each row in site_visits already represents a session (10-min dedup on insert)."""
    where = f"WHERE created_at >= {_CUTOFFS[period]}" if period in _CUTOFFS else ""
    try:
        with _connect() as conn:
            total  = conn.execute(f"SELECT COUNT(*) FROM site_visits {where}").fetchone()[0]
            unique = conn.execute(f"SELECT COUNT(DISTINCT ip_hash) FROM site_visits {where}").fetchone()[0]
        return {"total_visits": total, "unique_visitors": unique}
    except Exception as exc:
        logger.warning("get_site_visitor_stats failed: %s", exc)
        return {"total_visits": 0, "unique_visitors": 0}


def get_location_stats(table: str, period: str = "all") -> list[dict]:
    """Top countries for a given table (site_visits or interactions)."""
    and_clause = f"AND created_at >= {_CUTOFFS[period]}" if period in _CUTOFFS else ""
    try:
        with _connect() as conn:
            rows = conn.execute(f"""
                SELECT country, COUNT(*) AS visits, COUNT(DISTINCT ip_hash) AS unique_v
                FROM {table}
                WHERE country != '' {and_clause}
                GROUP BY country
                ORDER BY unique_v DESC
                LIMIT 8
            """).fetchall()
        return [{"country": r[0], "visits": r[1], "unique_visitors": r[2]} for r in rows]
    except Exception as exc:
        logger.warning("get_location_stats(%s) failed: %s", table, exc)
        return []


def get_page_stats(period: str = "all") -> list[dict]:
    """Top visited pages by session count."""
    and_clause = f"AND created_at >= {_CUTOFFS[period]}" if period in _CUTOFFS else ""
    try:
        with _connect() as conn:
            rows = conn.execute(f"""
                SELECT page, COUNT(*) AS sessions, COUNT(DISTINCT ip_hash) AS unique_v
                FROM site_visits
                WHERE 1=1 {and_clause}
                GROUP BY page
                ORDER BY sessions DESC
                LIMIT 10
            """).fetchall()
        return [{"page": r[0], "sessions": r[1], "unique_visitors": r[2]} for r in rows]
    except Exception as exc:
        logger.warning("get_page_stats failed: %s", exc)
        return []

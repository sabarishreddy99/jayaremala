"""SQLite-backed analytics — tracks unique visitors (hashed IPs) and total responses.
DB path is controlled by ANALYTICS_DB_PATH env var so it always resolves to the
Railway persistent volume regardless of working directory changes between deploys.
"""
from __future__ import annotations

import hashlib
import logging
import sqlite3
from pathlib import Path

logger = logging.getLogger(__name__)


def _db_path() -> Path:
    from app.core.settings import settings
    return Path(settings.analytics_db_path)


def init_db() -> None:
    p = _db_path()
    p.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(p) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS interactions (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                ip_hash    TEXT    NOT NULL,
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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_site_visit_ip ON site_visits(ip_hash)")
    logger.info("Analytics DB ready: %s", p.resolve())


def record(ip: str) -> None:
    ip_hash = hashlib.sha256(ip.encode()).hexdigest()
    try:
        with sqlite3.connect(_db_path()) as conn:
            conn.execute("INSERT INTO interactions (ip_hash) VALUES (?)", (ip_hash,))
    except Exception as exc:
        logger.warning("Analytics record failed (non-fatal): %s", exc)


_CUTOFFS = {
    "week":  "datetime('now', '-7 days')",
    "month": "datetime('now', '-30 days')",
    "year":  "datetime('now', '-365 days')",
}


def record_feedback(message_hash: str, rating: int) -> None:
    try:
        with sqlite3.connect(_db_path()) as conn:
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
        with sqlite3.connect(_db_path()) as conn:
            conn.execute("INSERT INTO questions (text) VALUES (?)", (normalized,))
    except Exception as exc:
        logger.warning("record_question failed (non-fatal): %s", exc)


def get_top_questions(n: int = 15) -> list[dict]:
    try:
        with sqlite3.connect(_db_path()) as conn:
            rows = conn.execute("""
                SELECT text, COUNT(*) AS cnt
                FROM questions
                GROUP BY lower(trim(text))
                ORDER BY cnt DESC
                LIMIT ?
            """, (n,)).fetchall()
        return [{"text": r[0], "count": r[1]} for r in rows]
    except Exception as exc:
        logger.warning("get_top_questions failed: %s", exc)
        return []


def get_feedback_summary() -> dict:
    try:
        with sqlite3.connect(_db_path()) as conn:
            total    = conn.execute("SELECT COUNT(*) FROM feedback").fetchone()[0]
            positive = conn.execute("SELECT COUNT(*) FROM feedback WHERE rating=1").fetchone()[0]
            negative = conn.execute("SELECT COUNT(*) FROM feedback WHERE rating=-1").fetchone()[0]
        satisfaction = round(positive / total * 100) if total > 0 else 0
        return {"total": total, "positive": positive, "negative": negative, "satisfaction_pct": satisfaction}
    except Exception as exc:
        logger.warning("get_feedback_summary failed: %s", exc)
        return {"total": 0, "positive": 0, "negative": 0, "satisfaction_pct": 0}


def record_experience_rating(rating: int) -> None:
    if not 1 <= rating <= 5:
        return
    try:
        with sqlite3.connect(_db_path()) as conn:
            conn.execute("INSERT INTO experience_ratings (rating) VALUES (?)", (rating,))
    except Exception as exc:
        logger.warning("record_experience_rating failed (non-fatal): %s", exc)


def get_experience_rating_summary() -> dict:
    try:
        with sqlite3.connect(_db_path()) as conn:
            rows = conn.execute(
                "SELECT rating, COUNT(*) FROM experience_ratings GROUP BY rating"
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


def record_site_visit(ip: str) -> None:
    ip_hash = hashlib.sha256(ip.encode()).hexdigest()
    try:
        with sqlite3.connect(_db_path()) as conn:
            conn.execute("INSERT INTO site_visits (ip_hash) VALUES (?)", (ip_hash,))
    except Exception as exc:
        logger.warning("record_site_visit failed (non-fatal): %s", exc)


def get_site_visitor_stats(period: str = "all") -> dict[str, int]:
    where = f"WHERE created_at >= {_CUTOFFS[period]}" if period in _CUTOFFS else ""
    try:
        with sqlite3.connect(_db_path()) as conn:
            total  = conn.execute(f"SELECT COUNT(*) FROM site_visits {where}").fetchone()[0]
            unique = conn.execute(f"SELECT COUNT(DISTINCT ip_hash) FROM site_visits {where}").fetchone()[0]
        return {"total_visits": total, "unique_visitors": unique}
    except Exception as exc:
        logger.warning("get_site_visitor_stats failed: %s", exc)
        return {"total_visits": 0, "unique_visitors": 0}


def get_stats(period: str = "all") -> dict[str, int]:
    where = f"WHERE created_at >= {_CUTOFFS[period]}" if period in _CUTOFFS else ""
    try:
        with sqlite3.connect(_db_path()) as conn:
            total  = conn.execute(f"SELECT COUNT(*) FROM interactions {where}").fetchone()[0]
            unique = conn.execute(f"SELECT COUNT(DISTINCT ip_hash) FROM interactions {where}").fetchone()[0]
        return {"total_responses": total, "unique_visitors": unique}
    except Exception as exc:
        logger.warning("Analytics query failed: %s", exc)
        return {"total_responses": 0, "unique_visitors": 0}

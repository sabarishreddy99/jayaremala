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

"""SQLite-backed gradeVITian store — user accounts, saved calculations, feedback
comments and notifications for the ported student-tools site (gradevitian.jayaremala.com).

Mirrors the connection pattern in blog_stats.py (WAL mode, busy timeout). The DB file
lives on the same persistent volume, path controlled by GV_DB_PATH.
"""
from __future__ import annotations

import json
import logging
import sqlite3
from pathlib import Path

logger = logging.getLogger(__name__)


def _db_path() -> Path:
    from app.core.settings import settings
    return Path(settings.gv_db_path)


def _connect() -> sqlite3.Connection:
    """Open a WAL-mode connection with a busy timeout for concurrent safety."""
    conn = sqlite3.connect(_db_path(), timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    conn.execute("PRAGMA busy_timeout=5000")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db() -> None:
    p = _db_path()
    p.parent.mkdir(parents=True, exist_ok=True)
    with _connect() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS gv_users (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                name       TEXT    NOT NULL,
                email      TEXT    NOT NULL UNIQUE,
                username   TEXT    NOT NULL UNIQUE,
                pwd_hash   TEXT    NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS gv_password_resets (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id    INTEGER NOT NULL REFERENCES gv_users(id) ON DELETE CASCADE,
                token_hash TEXT    NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                used       INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS gv_saved_calcs (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id    INTEGER NOT NULL REFERENCES gv_users(id) ON DELETE CASCADE,
                calc_type  TEXT    NOT NULL,
                payload    TEXT    NOT NULL DEFAULT '{}',
                result     TEXT    NOT NULL DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS gv_comments (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id    INTEGER REFERENCES gv_users(id) ON DELETE SET NULL,
                name       TEXT    NOT NULL,
                body       TEXT    NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS gv_notifications (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id    INTEGER REFERENCES gv_users(id) ON DELETE CASCADE,
                title      TEXT    NOT NULL,
                body       TEXT    NOT NULL DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS gv_notification_reads (
                user_id         INTEGER NOT NULL REFERENCES gv_users(id) ON DELETE CASCADE,
                notification_id INTEGER NOT NULL REFERENCES gv_notifications(id) ON DELETE CASCADE,
                read_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, notification_id)
            )
        """)
        # Live form state per (user, calculator) — autosaved field values so a logged-in
        # user sees exactly what they last typed, on any device.
        conn.execute("""
            CREATE TABLE IF NOT EXISTS gv_calc_state (
                user_id    INTEGER NOT NULL REFERENCES gv_users(id) ON DELETE CASCADE,
                calc_type  TEXT    NOT NULL,
                payload    TEXT    NOT NULL DEFAULT '{}',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, calc_type)
            )
        """)
        # Simple named counters (e.g. total site visits — counts every load/reload).
        conn.execute("""
            CREATE TABLE IF NOT EXISTS gv_counters (
                name  TEXT PRIMARY KEY,
                count INTEGER NOT NULL DEFAULT 0
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_gv_calcs_user  ON gv_saved_calcs(user_id)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_gv_resets_user ON gv_password_resets(user_id)")
    logger.info("gradeVITian DB ready")


# ── Counters (total site visits) ──────────────────────────────────────────────

def _bump(name: str) -> int:
    with _connect() as conn:
        conn.execute(
            "INSERT INTO gv_counters (name, count) VALUES (?, 1) "
            "ON CONFLICT(name) DO UPDATE SET count = count + 1",
            (name,),
        )
        row = conn.execute("SELECT count FROM gv_counters WHERE name=?", (name,)).fetchone()
    return row["count"] if row else 0


def record_page_load() -> int:
    """Every page load/reload."""
    return _bump("page_loads")


def record_visit() -> int:
    """One per browser session (the frontend gates this with sessionStorage)."""
    return _bump("visits")


def get_counts() -> dict:
    with _connect() as conn:
        rows = conn.execute(
            "SELECT name, count FROM gv_counters WHERE name IN ('page_loads', 'visits')"
        ).fetchall()
    d = {r["name"]: r["count"] for r in rows}
    return {"page_loads": d.get("page_loads", 0), "visits": d.get("visits", 0)}


# ── Users ─────────────────────────────────────────────────────────────────────

def get_user_by_id(user_id: int) -> dict | None:
    with _connect() as conn:
        row = conn.execute("SELECT * FROM gv_users WHERE id=?", (user_id,)).fetchone()
    return _public_user(row) if row else None


def get_user_by_login(identifier: str) -> dict | None:
    """Look up a user by email OR username (case-insensitive). Includes pwd_hash —
    for auth use only, never return directly to clients."""
    with _connect() as conn:
        row = conn.execute(
            "SELECT * FROM gv_users WHERE lower(email)=lower(?) OR lower(username)=lower(?)",
            (identifier, identifier),
        ).fetchone()
    return dict(row) if row else None


def email_or_username_taken(email: str, username: str) -> bool:
    with _connect() as conn:
        row = conn.execute(
            "SELECT 1 FROM gv_users WHERE lower(email)=lower(?) OR lower(username)=lower(?)",
            (email, username),
        ).fetchone()
    return row is not None


def create_user(name: str, email: str, username: str, pwd_hash: str) -> dict:
    with _connect() as conn:
        cur = conn.execute(
            "INSERT INTO gv_users (name, email, username, pwd_hash) VALUES (?, ?, ?, ?)",
            (name, email, username, pwd_hash),
        )
        user_id = cur.lastrowid
    return get_user_by_id(user_id)  # type: ignore[return-value]


def set_user_password(user_id: int, pwd_hash: str) -> None:
    with _connect() as conn:
        conn.execute("UPDATE gv_users SET pwd_hash=? WHERE id=?", (pwd_hash, user_id))


def _public_user(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
        "username": row["username"],
        "created_at": row["created_at"],
    }


# ── Password resets ─────────────────────────────────────────────────────────────

def create_password_reset(user_id: int, token_hash: str, expires_at: str) -> None:
    with _connect() as conn:
        conn.execute(
            "INSERT INTO gv_password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
            (user_id, token_hash, expires_at),
        )


def consume_password_reset(token_hash: str) -> int | None:
    """Validate an unused, unexpired reset token; mark it used; return its user_id."""
    with _connect() as conn:
        row = conn.execute(
            """SELECT id, user_id FROM gv_password_resets
               WHERE token_hash=? AND used=0 AND expires_at > datetime('now')
               ORDER BY id DESC LIMIT 1""",
            (token_hash,),
        ).fetchone()
        if not row:
            return None
        conn.execute("UPDATE gv_password_resets SET used=1 WHERE id=?", (row["id"],))
        return row["user_id"]


# ── Saved calculations ───────────────────────────────────────────────────────

def save_calc(user_id: int, calc_type: str, payload: dict, result: str) -> dict:
    with _connect() as conn:
        cur = conn.execute(
            "INSERT INTO gv_saved_calcs (user_id, calc_type, payload, result) VALUES (?, ?, ?, ?)",
            (user_id, calc_type, json.dumps(payload), result),
        )
        row = conn.execute("SELECT * FROM gv_saved_calcs WHERE id=?", (cur.lastrowid,)).fetchone()
    return _calc_row(row)


def list_calcs(user_id: int) -> list[dict]:
    with _connect() as conn:
        rows = conn.execute(
            "SELECT * FROM gv_saved_calcs WHERE user_id=? ORDER BY id DESC", (user_id,)
        ).fetchall()
    return [_calc_row(r) for r in rows]


def delete_calc(user_id: int, calc_id: int) -> bool:
    with _connect() as conn:
        cur = conn.execute(
            "DELETE FROM gv_saved_calcs WHERE id=? AND user_id=?", (calc_id, user_id)
        )
        return cur.rowcount > 0


# ── Live calculator form state (autosave) ────────────────────────────────────

def get_calc_state(user_id: int, calc_type: str):
    """Return the last-saved field values for a calculator (dict or list), or None."""
    with _connect() as conn:
        row = conn.execute(
            "SELECT payload FROM gv_calc_state WHERE user_id=? AND calc_type=?",
            (user_id, calc_type),
        ).fetchone()
    if not row:
        return None
    try:
        return json.loads(row["payload"])
    except Exception:
        return None


def get_all_calc_states(user_id: int) -> dict:
    """Return {calc_type: payload} for every saved calculator state of a user."""
    out: dict = {}
    with _connect() as conn:
        rows = conn.execute(
            "SELECT calc_type, payload FROM gv_calc_state WHERE user_id=?", (user_id,)
        ).fetchall()
    for r in rows:
        try:
            out[r["calc_type"]] = json.loads(r["payload"])
        except Exception:
            continue
    return out


def set_calc_state(user_id: int, calc_type: str, payload) -> None:
    with _connect() as conn:
        conn.execute(
            """
            INSERT INTO gv_calc_state (user_id, calc_type, payload)
            VALUES (?, ?, ?)
            ON CONFLICT(user_id, calc_type) DO UPDATE SET
                payload = excluded.payload,
                updated_at = CURRENT_TIMESTAMP
            """,
            (user_id, calc_type, json.dumps(payload)),
        )


def _calc_row(row: sqlite3.Row) -> dict:
    try:
        payload = json.loads(row["payload"])
    except Exception:
        payload = {}
    return {
        "id": row["id"],
        "calc_type": row["calc_type"],
        "payload": payload,
        "result": row["result"],
        "created_at": row["created_at"],
    }


# ── Comments (feedback wall) ─────────────────────────────────────────────────

def add_comment(name: str, body: str, user_id: int | None) -> dict:
    with _connect() as conn:
        cur = conn.execute(
            "INSERT INTO gv_comments (user_id, name, body) VALUES (?, ?, ?)",
            (user_id, name, body),
        )
        row = conn.execute("SELECT * FROM gv_comments WHERE id=?", (cur.lastrowid,)).fetchone()
    return _comment_row(row)


def list_comments(limit: int = 100) -> list[dict]:
    with _connect() as conn:
        rows = conn.execute(
            "SELECT * FROM gv_comments ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()
    return [_comment_row(r) for r in rows]


def _comment_row(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "body": row["body"],
        "created_at": row["created_at"],
    }


# ── Notifications ────────────────────────────────────────────────────────────

def list_notifications(user_id: int) -> list[dict]:
    """User-targeted notifications + broadcasts (user_id IS NULL), with read state."""
    with _connect() as conn:
        rows = conn.execute(
            """
            SELECT n.*, (r.notification_id IS NOT NULL) AS is_read
            FROM gv_notifications n
            LEFT JOIN gv_notification_reads r
              ON r.notification_id = n.id AND r.user_id = ?
            WHERE n.user_id = ? OR n.user_id IS NULL
            ORDER BY n.id DESC
            """,
            (user_id, user_id),
        ).fetchall()
    return [
        {
            "id": r["id"],
            "title": r["title"],
            "body": r["body"],
            "created_at": r["created_at"],
            "is_read": bool(r["is_read"]),
        }
        for r in rows
    ]


def mark_notification_read(user_id: int, notification_id: int) -> None:
    with _connect() as conn:
        conn.execute(
            "INSERT OR IGNORE INTO gv_notification_reads (user_id, notification_id) VALUES (?, ?)",
            (user_id, notification_id),
        )


def add_notification(title: str, body: str = "", user_id: int | None = None) -> None:
    """Insert a notification. user_id=None broadcasts to all users."""
    with _connect() as conn:
        conn.execute(
            "INSERT INTO gv_notifications (user_id, title, body) VALUES (?, ?, ?)",
            (user_id, title, body),
        )

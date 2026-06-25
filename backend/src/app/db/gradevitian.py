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
                status     TEXT    NOT NULL DEFAULT 'approved',
                reason     TEXT    NOT NULL DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        # Migrate older DBs that predate moderation columns.
        cols = {r[1] for r in conn.execute("PRAGMA table_info(gv_comments)").fetchall()}
        if "status" not in cols:
            conn.execute("ALTER TABLE gv_comments ADD COLUMN status TEXT NOT NULL DEFAULT 'approved'")
        if "reason" not in cols:
            conn.execute("ALTER TABLE gv_comments ADD COLUMN reason TEXT NOT NULL DEFAULT ''")
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
        conn.execute("""
            CREATE TABLE IF NOT EXISTS gv_achievements (
                user_id   INTEGER NOT NULL REFERENCES gv_users(id) ON DELETE CASCADE,
                badge     TEXT    NOT NULL,
                earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, badge)
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS gv_streaks (
                user_id     INTEGER PRIMARY KEY REFERENCES gv_users(id) ON DELETE CASCADE,
                last_active TEXT,
                count       INTEGER NOT NULL DEFAULT 0
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_gv_calcs_user  ON gv_saved_calcs(user_id)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_gv_resets_user ON gv_password_resets(user_id)")
    logger.info("gradeVITian DB ready")
    try:
        seed_legacy_comments()
    except Exception as exc:
        logger.warning("seed_legacy_comments failed (non-fatal): %s", exc)


def seed_legacy_comments() -> int:
    """One-time, idempotent import of feedback from the previous gradeVITian version.

    Reads data/gv_legacy_comments.json and inserts each comment (approved) only when a
    comment with the same name+body doesn't already exist in ANY status — so an admin
    removing one won't be undone on the next deploy, and re-runs never duplicate.
    Backdates created_at so they read as older entries.
    """
    path = Path(__file__).parents[3] / "data" / "gv_legacy_comments.json"
    try:
        items = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return 0

    inserted = 0
    with _connect() as conn:
        for i, item in enumerate(items):
            name = (item.get("name") or "").strip()
            body = (item.get("body") or "").strip()
            if not name or not body:
                continue
            if conn.execute(
                "SELECT 1 FROM gv_comments WHERE name=? AND body=? LIMIT 1", (name, body)
            ).fetchone():
                continue
            created_at = item.get("created_at") or f"2024-{(i % 12) + 1:02d}-15 12:00:00"
            conn.execute(
                "INSERT INTO gv_comments (user_id, name, body, status, reason, created_at) "
                "VALUES (NULL, ?, ?, 'approved', 'legacy import', ?)",
                (name, body, created_at),
            )
            inserted += 1
    if inserted:
        logger.info("seed_legacy_comments: imported %d legacy comment(s)", inserted)
    return inserted


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


def get_admin_metrics() -> dict:
    """Aggregate gradeVITian usage metrics for the admin dashboard.

    Single connection, all COUNT/GROUP BY — no per-row queries.
    `last_active` is a 'YYYY-MM-DD' string, so an ISO string comparison against
    date('now','-1 day') captures users active today or yesterday.
    """
    with _connect() as conn:
        users_total = conn.execute("SELECT COUNT(*) AS c FROM gv_users").fetchone()["c"]
        new_7d = conn.execute(
            "SELECT COUNT(*) AS c FROM gv_users WHERE created_at >= datetime('now','-7 days')"
        ).fetchone()["c"]
        new_30d = conn.execute(
            "SELECT COUNT(*) AS c FROM gv_users WHERE created_at >= datetime('now','-30 days')"
        ).fetchone()["c"]
        recent = [
            {"name": r["name"], "username": r["username"], "email": r["email"], "created_at": r["created_at"]}
            for r in conn.execute(
                "SELECT name, username, email, created_at FROM gv_users ORDER BY id DESC LIMIT 10"
            ).fetchall()
        ]

        calcs_total = conn.execute("SELECT COUNT(*) AS c FROM gv_saved_calcs").fetchone()["c"]
        calcs_by_type = [
            {"calc_type": r["calc_type"], "count": r["c"]}
            for r in conn.execute(
                "SELECT calc_type, COUNT(*) AS c FROM gv_saved_calcs GROUP BY calc_type ORDER BY c DESC"
            ).fetchall()
        ]

        status_counts = {
            r["status"]: r["c"]
            for r in conn.execute(
                "SELECT status, COUNT(*) AS c FROM gv_comments GROUP BY status"
            ).fetchall()
        }
        comments = {
            "approved": status_counts.get("approved", 0),
            "pending": status_counts.get("pending", 0),
            "rejected": status_counts.get("rejected", 0),
            "total": sum(status_counts.values()),
        }

        counters = {
            r["name"]: r["count"]
            for r in conn.execute(
                "SELECT name, count FROM gv_counters WHERE name IN ('page_loads','visits')"
            ).fetchall()
        }
        active_streaks = conn.execute(
            "SELECT COUNT(*) AS c FROM gv_streaks WHERE last_active >= date('now','-1 day')"
        ).fetchone()["c"]
        longest_streak = conn.execute(
            "SELECT COALESCE(MAX(count), 0) AS m FROM gv_streaks"
        ).fetchone()["m"]
        badges_total = conn.execute("SELECT COUNT(*) AS c FROM gv_achievements").fetchone()["c"]
        badges_by_type = [
            {"badge": r["badge"], "count": r["c"]}
            for r in conn.execute(
                "SELECT badge, COUNT(*) AS c FROM gv_achievements GROUP BY badge ORDER BY c DESC"
            ).fetchall()
        ]

    return {
        "users": {"total": users_total, "new_7d": new_7d, "new_30d": new_30d, "recent": recent},
        "saved_calcs": {"total": calcs_total, "by_type": calcs_by_type},
        "comments": comments,
        "engagement": {
            "page_loads": counters.get("page_loads", 0),
            "visits": counters.get("visits", 0),
            "active_streaks": active_streaks,
            "longest_streak": longest_streak,
            "badges_total": badges_total,
            "badges_by_type": badges_by_type,
        },
    }


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
    # Milestone badges (best-effort, never blocks the save)
    try:
        award_badge(user_id, f"first_{calc_type}")
        if len(list_calcs(user_id)) >= 10:
            award_badge(user_id, "ten_calcs")
    except Exception:
        pass
    return _calc_row(row)


# ── Achievements & streaks (gamification) ─────────────────────────────────────

def award_badge(user_id: int, badge: str) -> bool:
    """Award a badge if not already earned. Returns True only when newly awarded."""
    with _connect() as conn:
        cur = conn.execute(
            "INSERT OR IGNORE INTO gv_achievements (user_id, badge) VALUES (?, ?)",
            (user_id, badge),
        )
        return cur.rowcount > 0


def list_badges(user_id: int) -> list[dict]:
    with _connect() as conn:
        rows = conn.execute(
            "SELECT badge, earned_at FROM gv_achievements WHERE user_id=? ORDER BY earned_at",
            (user_id,),
        ).fetchall()
    return [{"badge": r["badge"], "earned_at": r["earned_at"]} for r in rows]


def bump_streak(user_id: int) -> dict:
    """Advance the daily-visit streak. Returns {count, last_active, advanced, new_badges}."""
    from datetime import date, timedelta
    today = date.today().isoformat()
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    with _connect() as conn:
        row = conn.execute("SELECT last_active, count FROM gv_streaks WHERE user_id=?", (user_id,)).fetchone()
        if row is None:
            conn.execute("INSERT INTO gv_streaks (user_id, last_active, count) VALUES (?, ?, 1)", (user_id, today))
            count, advanced = 1, True
        elif row["last_active"] == today:
            count, advanced = row["count"], False
        else:
            count = row["count"] + 1 if row["last_active"] == yesterday else 1
            conn.execute("UPDATE gv_streaks SET last_active=?, count=? WHERE user_id=?", (today, count, user_id))
            advanced = True
    new_badges: list[str] = []
    for milestone in (3, 7, 30):
        if count >= milestone and award_badge(user_id, f"streak_{milestone}"):
            new_badges.append(f"streak_{milestone}")
    return {"count": count, "last_active": today, "advanced": advanced, "new_badges": new_badges}


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

def add_comment(name: str, body: str, user_id: int | None, status: str = "approved", reason: str = "") -> dict:
    with _connect() as conn:
        cur = conn.execute(
            "INSERT INTO gv_comments (user_id, name, body, status, reason) VALUES (?, ?, ?, ?, ?)",
            (user_id, name, body, status, reason),
        )
        row = conn.execute("SELECT * FROM gv_comments WHERE id=?", (cur.lastrowid,)).fetchone()
    return _comment_row(row)


def list_comments(limit: int = 100) -> list[dict]:
    """Public list — only approved comments are ever returned, newest first.
    Sorts by created_at (then id) so backdated legacy imports sit below newer posts."""
    with _connect() as conn:
        rows = conn.execute(
            "SELECT * FROM gv_comments WHERE status='approved' ORDER BY created_at DESC, id DESC LIMIT ?",
            (limit,),
        ).fetchall()
    return [_comment_row(r) for r in rows]


def list_comments_for_review(status: str | None = None, limit: int = 200) -> list[dict]:
    """Admin list — defaults to everything not yet approved (pending + rejected)."""
    with _connect() as conn:
        if status:
            rows = conn.execute(
                "SELECT * FROM gv_comments WHERE status=? ORDER BY id DESC LIMIT ?", (status, limit)
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM gv_comments WHERE status!='approved' ORDER BY id DESC LIMIT ?", (limit,)
            ).fetchall()
    return [_comment_row(r, include_status=True) for r in rows]


def set_comment_status(comment_id: int, status: str) -> bool:
    with _connect() as conn:
        cur = conn.execute("UPDATE gv_comments SET status=? WHERE id=?", (status, comment_id))
        return cur.rowcount > 0


def _comment_row(row: sqlite3.Row, include_status: bool = False) -> dict:
    out = {
        "id": row["id"],
        "name": row["name"],
        "body": row["body"],
        "created_at": row["created_at"],
    }
    if include_status:
        out["status"] = row["status"]
        out["reason"] = row["reason"]
    return out


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

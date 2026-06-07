import asyncio
import json
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.settings import settings
from app.rag.ingest import DATA_DIR, run_ingest

router = APIRouter(prefix="/admin", tags=["admin"])
_bearer = HTTPBearer(auto_error=False)

# In-memory state for the long-running reingest task (single Railway instance)
_reingest_state: dict = {"running": False, "result": None, "error": None}


def _require_token(creds: HTTPAuthorizationCredentials | None = Depends(_bearer)) -> None:
    if not settings.admin_token:
        raise HTTPException(status_code=403, detail="Admin endpoint disabled")
    if creds is None or creds.credentials != settings.admin_token:
        raise HTTPException(status_code=401, detail="Invalid token")


async def _run_ingest_background(force: bool) -> None:
    """Run blocking ingest in a thread so the event loop stays free."""
    try:
        result = await asyncio.to_thread(run_ingest, force)
        _reingest_state["result"] = result
        _reingest_state["error"] = None
    except Exception as exc:
        _reingest_state["result"] = None
        _reingest_state["error"] = str(exc)
    finally:
        _reingest_state["running"] = False


@router.post("/reingest", dependencies=[Depends(_require_token)])
async def reingest(background_tasks: BackgroundTasks, force: bool = False) -> dict:
    """Start a knowledge-base rebuild in the background and return immediately.

    Poll GET /admin/reingest/status to check progress.
    Pass ?force=true to re-embed every document regardless of hash.
    """
    if _reingest_state["running"]:
        return {"status": "already_running"}
    _reingest_state["running"] = True
    _reingest_state["result"] = None
    _reingest_state["error"] = None
    background_tasks.add_task(_run_ingest_background, force)
    return {"status": "started"}


@router.get("/reingest/status", dependencies=[Depends(_require_token)])
def reingest_status() -> dict:
    """Poll this endpoint to check if a background reingest has finished."""
    return {
        "running": _reingest_state["running"],
        "result": _reingest_state["result"],
        "error": _reingest_state["error"],
    }


@router.get("/sync-status", dependencies=[Depends(_require_token)])
def sync_status() -> dict:
    """Return per-content-type counts from content.db, JSON knowledge files, and ChromaDB.

    Used by the admin Sync panel to surface what's indexed, what's in the DB,
    and when the last full sync completed. All reads are fast (no embedding).
    """
    from app.db import content as content_db  # noqa: PLC0415

    def count_json(filename: str) -> int:
        path = DATA_DIR / filename
        try:
            return len(json.loads(path.read_text())) if path.exists() else 0
        except Exception:
            return 0

    # content.db row counts
    db_blogs  = len(content_db.list_blog_posts(include_drafts=True))
    db_labs   = len(content_db.list_lab_entries())
    db_quotes = len(content_db.list_quotes())

    # Knowledge JSON file counts
    json_counts = {
        "blog":         count_json("blog.json"),
        "lab":          count_json("lab.json"),
        "quotes":       count_json("quotes.json"),
        "experience":   count_json("experience.json"),
        "education":    count_json("education.json"),
        "projects":     count_json("projects.json"),
        "skills":       count_json("skills.json"),
        "testimonials": count_json("testimonials.json"),
        "gallery":      count_json("gallery.json"),
    }

    # ChromaDB — total count + per-type by ID prefix (single get() call)
    chroma_total = 0
    chroma_by_type: dict[str, int] = {}
    try:
        from app.rag.store import get_collection  # noqa: PLC0415
        collection = get_collection()
        chroma_total = collection.count()
        if chroma_total > 0:
            all_ids: list[str] = collection.get(include=[])["ids"]
            prefixes = ["blog", "lab", "quote", "exp", "edu", "proj", "skills",
                        "testimonial", "gallery", "faq", "profile"]
            for prefix in prefixes:
                chroma_by_type[prefix] = sum(1 for id_ in all_ids if id_.startswith(f"{prefix}_"))
    except Exception:
        pass

    # Last ingest time — mtime of .doc_hashes.json
    last_ingest_ts: float | None = None
    try:
        hashes_path = Path(settings.chroma_db_path) / ".doc_hashes.json"
        if hashes_path.exists():
            last_ingest_ts = hashes_path.stat().st_mtime
    except Exception:
        pass

    return {
        "content_db": {"blogs": db_blogs, "labs": db_labs, "quotes": db_quotes},
        "json_files": json_counts,
        "chromadb": {"total": chroma_total, "by_type": chroma_by_type},
        "last_ingest_ts": last_ingest_ts,
        "ingest_running": _reingest_state["running"],
    }


@router.post("/prune-analytics", dependencies=[Depends(_require_token)])
def prune_analytics() -> dict:
    """Remove analytics rows for blog posts and lab entries that no longer exist in content.db.

    Reads the current live slug lists from content.db, then deletes orphaned rows from:
    - blog_views, blog_claps, blog_sessions (by slug)
    - site_visits for /blog/* and /lab/* paths

    Safe to call at any time — read-then-delete, no destructive side effects on live content.
    """
    from app.db import content as content_db
    from app.db.blog_stats import prune_orphaned_stats
    from app.db.analytics import prune_orphaned_page_visits

    blog_slugs = {p["slug"] for p in content_db.list_blog_posts(include_drafts=True)}
    lab_slugs  = {e["slug"] for e in content_db.list_lab_entries()}

    valid_pages = {f"/blog/{s}" for s in blog_slugs} | {f"/lab/{s}" for s in lab_slugs}

    blog_removed  = prune_orphaned_stats(blog_slugs)
    pages_removed = prune_orphaned_page_visits(valid_pages)

    return {
        "blog_views_removed":    blog_removed["views"],
        "blog_claps_removed":    blog_removed["claps"],
        "blog_sessions_removed": blog_removed["sessions"],
        "page_visits_removed":   pages_removed,
        "total_removed":         sum(blog_removed.values()) + pages_removed,
        "live_blogs":            len(blog_slugs),
        "live_labs":             len(lab_slugs),
    }

import asyncio
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.settings import settings
from app.rag.ingest import run_ingest

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

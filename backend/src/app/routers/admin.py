from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.settings import settings
from app.rag.ingest import run_ingest

router = APIRouter(prefix="/admin", tags=["admin"])
_bearer = HTTPBearer(auto_error=False)


def _require_token(creds: HTTPAuthorizationCredentials | None = Depends(_bearer)) -> None:
    if not settings.admin_token:
        raise HTTPException(status_code=403, detail="Admin endpoint disabled")
    if creds is None or creds.credentials != settings.admin_token:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/reingest", dependencies=[Depends(_require_token)])
def reingest(force: bool = False) -> dict:
    """Trigger an incremental knowledge-base sync.

    Pass ?force=true to re-embed every document regardless of hash.
    Returns {added, updated, deleted, unchanged, total}.
    Requires Bearer token matching ADMIN_TOKEN env var.
    """
    return run_ingest(force=force)

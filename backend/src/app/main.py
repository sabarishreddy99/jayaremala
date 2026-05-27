import logging
import threading
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.limiter import limiter
from app.core.settings import settings
from app.db import analytics, blog_stats, content
from app.rag import graph as rag_graph
from app.rag.ingest import run_ingest
from app.rag.store import warmup as rag_warmup
from app.routers.admin import router as admin_router
from app.routers.ai import router as ai_router
from app.routers.blog import router as blog_router
from app.routers.content import router as content_router
from app.routers.stats import router as stats_router

logger = logging.getLogger(__name__)


def _background_startup() -> None:
    logger.info("Starting up — ingesting knowledge base...")
    try:
        result = run_ingest()
        logger.info("Knowledge base ready: %s", result)
        rag_graph.build_graph()
    except Exception as exc:
        logger.warning("RAG ingest failed (non-fatal): %s", exc)
    try:
        rag_warmup()
    except Exception as exc:
        logger.warning("Model warmup failed (non-fatal): %s", exc)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        analytics.init_db()
    except Exception as exc:
        logger.error("analytics.init_db failed (non-fatal): %s", exc)
    try:
        blog_stats.init_db()
    except Exception as exc:
        logger.error("blog_stats.init_db failed (non-fatal): %s", exc)
    try:
        content.init_db()
    except Exception as exc:
        logger.error("content.init_db failed (non-fatal): %s", exc)
    threading.Thread(target=_background_startup, daemon=True).start()
    yield


app = FastAPI(title="Portfolio API", version="0.1.0", lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

_origins = [o.strip() for o in settings.frontend_origin.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin_router)
app.include_router(ai_router)
app.include_router(blog_router)
app.include_router(content_router)
app.include_router(stats_router)


@app.get("/health")
def health() -> dict:
    status: dict[str, str] = {
        "api": "ok",
        "analytics_db": "ok",
        "content_db": "ok",
        "rag": "ok",
    }
    try:
        with analytics._connect() as c:
            c.execute("SELECT 1")
    except Exception:
        status["analytics_db"] = "degraded"
    try:
        with content._connect() as c:
            c.execute("SELECT 1")
    except Exception:
        status["content_db"] = "degraded"
    try:
        from app.rag.store import get_collection
        get_collection().count()
    except Exception:
        status["rag"] = "degraded"
    overall = "ok" if all(v == "ok" for v in status.values()) else "degraded"
    return {"status": overall, **status}

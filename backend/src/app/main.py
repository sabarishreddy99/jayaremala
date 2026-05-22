import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.limiter import limiter
from app.core.settings import settings
from app.db import analytics, blog_stats
from app.rag import graph as rag_graph
from app.rag.ingest import run_ingest
from app.rag.store import warmup as rag_warmup
from app.routers.admin import router as admin_router
from app.routers.ai import router as ai_router
from app.routers.blog import router as blog_router
from app.routers.stats import router as stats_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    analytics.init_db()
    blog_stats.init_db()
    logger.info("Starting up — ingesting knowledge base...")
    try:
        result = run_ingest()
        logger.info("Knowledge base ready: %s", result)
        rag_graph.build_graph()
    except Exception as exc:
        logger.warning("RAG ingest failed (non-fatal): %s", exc)

    # Pre-warm embedding model + cross-encoder so the first user request doesn't
    # pay the model-load latency penalty
    loop = asyncio.get_running_loop()
    try:
        await asyncio.wait_for(loop.run_in_executor(None, rag_warmup), timeout=120.0)
    except Exception as exc:
        logger.warning("Model warmup failed (non-fatal): %s", exc)

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
app.include_router(stats_router)


@app.get("/health")
def health():
    return {"status": "ok"}

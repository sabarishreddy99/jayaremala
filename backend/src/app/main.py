import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.settings import settings
from app.rag.ingest import run_ingest
from app.routers.ai import router as ai_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up — ingesting knowledge base...")
    try:
        count = run_ingest()
        logger.info("Knowledge base ready: %d documents", count)
    except Exception as exc:
        logger.warning("RAG ingest failed (non-fatal): %s", exc)
    yield


app = FastAPI(title="Portfolio API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.frontend_origin.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai_router)


@app.get("/health")
def health():
    return {"status": "ok"}

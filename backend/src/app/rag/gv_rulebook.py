"""Isolated retrieval over VIT Academic Regulations for the gradeVITian
"Ask the Rulebook" assistant.

Deliberately self-contained — it does NOT touch the portfolio RAG (store.py)
collection or its module globals, so VIT regulations can never leak into Jaya's
portfolio Q&A. The corpus is small and static (~130 chunks), so a plain in-memory
BM25 index is enough; no embeddings, no ChromaDB, no extra model load.

Corpus source: backend/data/gradevitian/regulation_chunks.json
(regenerate via backend/scripts/parse_regulations.py).
"""
from __future__ import annotations

import json
import logging
import re
from pathlib import Path

logger = logging.getLogger(__name__)

_CHUNKS_PATH = Path(__file__).resolve().parents[3] / "data" / "gradevitian" / "regulation_chunks.json"

_chunks: list[dict] = []
_bm25 = None  # rank_bm25.BM25Okapi | None


def _tokenize(text: str) -> list[str]:
    """Same lightweight tokenizer shape as store._tokenize_for_bm25 (copied to
    avoid importing the heavy embedding stack)."""
    text = re.sub(r"[^a-z0-9\s]", " ", text.lower())
    return [tok for tok in text.split() if len(tok) > 1]


def build_rulebook_index() -> int:
    """Load chunks and build the BM25 index once. Idempotent and non-fatal —
    returns the number of indexed chunks (0 if unavailable)."""
    global _chunks, _bm25
    if _bm25 is not None:
        return len(_chunks)
    try:
        from rank_bm25 import BM25Okapi
    except ImportError:
        logger.warning("rank_bm25 not installed — rulebook search disabled")
        return 0
    try:
        if not _CHUNKS_PATH.exists():
            logger.warning("regulation_chunks.json missing at %s", _CHUNKS_PATH)
            return 0
        _chunks = json.loads(_CHUNKS_PATH.read_text(encoding="utf-8"))
        _bm25 = BM25Okapi([_tokenize(c["text"]) for c in _chunks])
        logger.info("Rulebook index built: %d regulation chunks", len(_chunks))
        return len(_chunks)
    except Exception as exc:
        logger.warning("Failed to build rulebook index: %s", exc)
        return 0


def rulebook_query(text: str, n: int = 6) -> list[dict]:
    """Return the top-n regulation chunks for a query, each with a relevance
    score. Returns [] if the index isn't available."""
    if _bm25 is None:
        build_rulebook_index()
    if _bm25 is None or not _chunks:
        return []
    scores = _bm25.get_scores(_tokenize(text))
    ranked = sorted(range(len(_chunks)), key=lambda i: scores[i], reverse=True)[:n]
    out: list[dict] = []
    for i in ranked:
        if scores[i] <= 0:
            continue
        c = _chunks[i]
        out.append({
            "id": c.get("id", ""),
            "section": c.get("section", ""),
            "heading": c.get("heading", ""),
            "text": c.get("text", ""),
            "source": c.get("source", "VIT Academic Regulations"),
            "score": round(float(scores[i]), 3),
        })
    return out

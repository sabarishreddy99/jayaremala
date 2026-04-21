from __future__ import annotations

import json
import logging
from typing import Iterator, Literal

import google.genai as genai
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.core.settings import settings
from app.rag import store as rag_store

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai", tags=["ai"])

_genai_client: genai.Client | None = None

SYSTEM_PROMPT = """You are Avocado, the personal AI assistant of Jaya Sabarish Reddy Remala (a Software Engineer).
Your role is to help recruiters and visitors understand Jaya's professional background accurately.

GUIDELINES:
- Refer to Jaya in third person ("He", "Jaya") — you represent him, you are not him
- Be direct and specific — cite exact numbers and metrics whenever the context contains them
- For broad questions ("tell me about Jaya"), lead with his most impressive achievements
- For technical questions, name specific technologies, frameworks, and measured outcomes
- Keep responses focused: 2–3 sentences for simple questions, structured paragraphs for detailed ones
- If the context section says NO_RELEVANT_CONTEXT, respond: "I don't have specific info on that — you can reach Jaya directly at jr6421@nyu.edu or browse the portfolio."
- If information is not in the provided context, say: "I don't have that detail — reach Jaya directly at jr6421@nyu.edu"
- Never fabricate skills, experiences, or facts not present in the context
- When asked what makes Jaya special, always highlight: Qualcomm Edge AI Hackathon winner, 78% RAG latency reduction at 3K+ RPS, zero-data-loss Shell maritime infrastructure
- Do not repeat the context verbatim — synthesize it into a natural, helpful answer"""


def _get_client() -> genai.Client:
    global _genai_client
    if _genai_client is None:
        if not settings.google_api_key:
            raise HTTPException(status_code=503, detail="GOOGLE_API_KEY is not configured")
        _genai_client = genai.Client(api_key=settings.google_api_key)
    return _genai_client


def _build_rag_queries(req: ChatRequest) -> list[str]:
    """Generate up to 4 targeted query angles: verbatim, name-anchored, topic keyword, follow-up context."""
    queries = [req.message]

    # Name-anchored variant improves person-specific retrieval
    queries.append(f"{req.message} Jaya Sabarish Reddy Remala")

    # Single topic-specific keyword variant (mutually exclusive, first match wins)
    stripped = req.message.lower()
    if any(kw in stripped for kw in ["experience", "work", "job", "role", "company", "wipro", "shell"]):
        queries.append("work experience roles companies")
    elif any(kw in stripped for kw in ["project", "built", "created", "developed", "snaplog", "codecollab"]):
        queries.append("projects built SnapLog CodeCollab Multi-Agent GeneCart")
    elif any(kw in stripped for kw in ["skill", "tech", "stack", "language", "know"]):
        queries.append("technical skills programming languages frameworks")
    elif any(kw in stripped for kw in ["educat", "degree", "study", "university", "nyu", "school", "master"]):
        queries.append("education degree NYU Tandon VIT")
    elif any(kw in stripped for kw in ["award", "win", "hackathon", "qualcomm", "achiev"]):
        queries.append("Qualcomm hackathon award SnapLog achievement")
    elif any(kw in stripped for kw in ["contact", "email", "reach", "hire", "linkedin", "resume", "cv"]):
        queries.append("contact email LinkedIn GitHub resume CV download")

    # Add recent conversation context for follow-up questions (only if slot remains)
    if len(queries) < 4:
        recent = [m.content for m in req.messages[-4:] if m.role == "user"][-1:]
        if recent:
            combined = recent[0] + " " + req.message
            if combined.strip() != req.message.strip():
                queries.append(combined)

    return queries[:4]


_STOP_WORDS = {"what", "tell", "about", "your", "have", "does", "that", "with", "from", "this",
               "jaya", "his", "the", "and", "for", "you", "can", "more", "some", "any"}


def _rerank_chunks(chunks: list[dict], user_message: str) -> list[dict]:
    """Boost chunks that contain keywords from the user message as a tie-breaker."""
    keywords = {w.lower() for w in user_message.split() if len(w) > 3 and w.lower() not in _STOP_WORDS}
    if not keywords:
        return chunks
    for chunk in chunks:
        text_lower = chunk["text"].lower()
        overlap = sum(1 for kw in keywords if kw in text_lower)
        chunk["_rank"] = chunk["score"] + overlap * 0.05
    return sorted(chunks, key=lambda c: c.get("_rank", c["score"]), reverse=True)


def _build_context(chunks: list[dict]) -> str:
    """Format retrieved chunks into a clean, structured context block."""
    if not chunks or all(c.get("rrf_score", c["score"]) < 0.005 for c in chunks):
        return "NO_RELEVANT_CONTEXT"

    # Group by type for cleaner context
    by_type: dict[str, list[str]] = {}
    for c in chunks:
        t = c["type"]
        by_type.setdefault(t, []).append(c["text"])

    sections = []
    type_labels = {
        "profile": "Profile",
        "experience": "Work Experience",
        "education": "Education",
        "project": "Projects",
        "skills": "Skills",
        "faq": "Key Facts",
    }
    for t in ["faq", "profile", "experience", "project", "education", "skills"]:
        if t in by_type:
            label = type_labels.get(t, t.title())
            content = "\n".join(f"• {text}" for text in by_type[t])
            sections.append(f"[{label}]\n{content}")

    return "\n\n".join(sections)


def _build_chat_prompt(req: ChatRequest, context: str) -> str:
    history_text = ""
    for m in req.messages[-4:]:
        prefix = "User" if m.role == "user" else "Avocado"
        history_text += f"{prefix}: {m.content}\n"

    return (
        f"{SYSTEM_PROMPT}\n\n"
        f"--- CONTEXT ABOUT JAYA ---\n{context}\n--- END CONTEXT ---\n\n"
        f"Conversation history:\n{history_text}"
        f"User: {req.message}\nAvocado:"
    )


def _generate(system: str, prompt: str) -> str:
    client = _get_client()
    response = client.models.generate_content(
        model=settings.gemma_model,
        contents=f"{system}\n\n{prompt}" if system else prompt,
    )
    return response.text or ""


def _stream_tokens(full_prompt: str) -> Iterator[str]:
    client = _get_client()
    for chunk in client.models.generate_content_stream(
        model=settings.gemma_model,
        contents=full_prompt,
    ):
        if chunk.text:
            yield chunk.text


# ── Models ────────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = []
    message: str


class ChatResponse(BaseModel):
    reply: str
    sources: list[str]


# ── /ai/chat (non-streaming fallback) ────────────────────────────────────────

@router.post("/chat", response_model=ChatResponse)
def ai_chat(req: ChatRequest) -> ChatResponse:
    queries = _build_rag_queries(req)
    dense = rag_store.query_batch(queries, n_per_query=6)
    bm25 = rag_store.bm25_query(req.message, n_results=15)
    merged = rag_store.rrf_merge(dense, bm25, k=60, top_n=20)
    top_chunks = rag_store.rerank_cross_encoder(req.message, merged, top_n=5)
    context = _build_context(top_chunks)
    sources = [f"{c['type']}:{c['id']}" for c in top_chunks]
    prompt = _build_chat_prompt(req, context)
    reply = _generate("", prompt)
    return ChatResponse(reply=reply.strip(), sources=sources)


# ── /ai/chat/stream (SSE streaming) ──────────────────────────────────────────

@router.post("/chat/stream")
async def ai_chat_stream(req: ChatRequest) -> StreamingResponse:
    queries = _build_rag_queries(req)
    # 1. Batched dense retrieval — ONE encode call for all 4 queries
    dense = await rag_store.query_batch_async(queries, n_per_query=6)
    # 2. BM25 lexical retrieval — catches exact matches dense misses
    bm25 = rag_store.bm25_query(req.message, n_results=15)
    # 3. Hybrid merge via Reciprocal Rank Fusion
    merged = rag_store.rrf_merge(dense, bm25, k=60, top_n=20)
    # 4. Cross-encoder rerank → top 5 for context (much higher precision than cosine)
    top_chunks = await rag_store.rerank_cross_encoder_async(req.message, merged, top_n=5)
    context = _build_context(top_chunks)
    sources = [f"{c['type']}:{c['id']}" for c in top_chunks]
    full_prompt = _build_chat_prompt(req, context)

    def event_stream():
        try:
            for token in _stream_tokens(full_prompt):
                yield f"data: {json.dumps({'token': token})}\n\n"
            yield f"data: {json.dumps({'done': True, 'sources': sources})}\n\n"
        except Exception as exc:
            logger.error("Streaming error: %s", exc)
            yield f"data: {json.dumps({'error': str(exc)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ── /ai/summarize ─────────────────────────────────────────────────────────────

class SummarizeRequest(BaseModel):
    text: str


@router.post("/summarize")
def ai_summarize(req: SummarizeRequest) -> dict:
    reply = _generate(
        "You are a concise writing assistant. Summarize clearly and briefly.",
        f"Summarize:\n{req.text}",
    )
    return {"result": reply.strip()}


# ── /ai/draft ─────────────────────────────────────────────────────────────────

class DraftRequest(BaseModel):
    prompt: str


@router.post("/draft")
def ai_draft(req: DraftRequest) -> dict:
    reply = _generate("You are a writing assistant. Write clear, engaging prose.", req.prompt)
    return {"result": reply.strip()}


# ── /ai/rewrite ───────────────────────────────────────────────────────────────

class RewriteRequest(BaseModel):
    text: str
    instruction: str = "Improve clarity and conciseness"


@router.post("/rewrite")
def ai_rewrite(req: RewriteRequest) -> dict:
    reply = _generate(
        "You are an expert editor. Rewrite the text according to the instruction.",
        f"Instruction: {req.instruction}\n\nText:\n{req.text}",
    )
    return {"result": reply.strip()}

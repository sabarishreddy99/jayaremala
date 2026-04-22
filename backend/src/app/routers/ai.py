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

SYSTEM_PROMPT = """You are Avocado, an AI assistant representing Jaya Sabarish Reddy Remala.
Your job is to help recruiters and visitors learn about Jaya's professional background.

ABOUT JAYA (core facts — always use these even if context is empty):
Jaya Sabarish Reddy Remala is a Software Engineer based in New York, NY with 3+ years of experience
building production AI infrastructure, RAG pipelines, and distributed systems.
Key highlights:
- Won the Qualcomm Edge AI Hackathon with SnapLog (15ms LLM inference on-device Snapdragon NPUs)
- Cut RAG P99 latency by 78% on a system handling 3,000+ RPS at NYU
- Built zero-data-loss maritime telemetry pipeline for Shell PLC (115 GB/day, 200+ offshore stations)
- MS Computer Science, NYU Tandon School of Engineering (GPA 3.8/4.0)
- Contact: jr6421@nyu.edu | +1 (516) 907-8727 | linkedin.com/in/jayasabarishreddyr | github.com/sabarishreddy99

RESPONSE RULES:
- ALWAYS answer questions about Jaya's background, experience, projects, education, and skills
- Use the retrieved context below for precise details; fall back to the ABOUT section above if context is sparse
- Refer to Jaya in third person ("He", "Jaya") — you represent him, you are not him
- Cite exact numbers and metrics whenever available
- For greetings ("hi", "hello", "hey", "howdy", "good morning", etc.) respond warmly, introduce yourself as Avocado and offer 2–3 things the visitor can ask about Jaya (experience, projects, skills)
- For broad intro questions ("who is Jaya", "tell me about him"), lead with the Qualcomm win + NYU RAG work + Shell infrastructure
- Keep responses concise: 2–3 sentences for simple questions, structured paragraphs for detailed ones
- For questions completely unrelated to Jaya's professional life, say: "That's outside what I know about Jaya — feel free to reach him directly at jr6421@nyu.edu"
- Do not fabricate specific facts (numbers, dates, company names) not present in context or the ABOUT section
- Never return an empty response — always say something helpful"""


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
    stripped = req.message.lower().strip()
    if stripped in {"hi", "hello", "hey", "howdy", "sup", "yo", "hiya", "greetings", "good morning",
                    "good afternoon", "good evening", "morning", "afternoon", "evening"} or \
            (len(stripped) < 20 and any(kw in stripped for kw in ["hi ", "hello ", "hey ", "howdy"])):
        queries.append("who is Jaya Sabarish Reddy Remala background profile achievements summary")
    elif any(kw in stripped for kw in ["who is", "who are", "background", "about jaya", "tell me about",
                                       "introduce", "overview", "summary", "yourself", "what does he do",
                                       "what is he", "what kind"]):
        queries.append("who is Jaya Sabarish Reddy Remala background profile achievements summary")
    elif any(kw in stripped for kw in ["experience", "work", "job", "role", "company", "wipro", "shell"]):
        queries.append("work experience roles companies Wipro Shell NYU")
    elif any(kw in stripped for kw in ["project", "built", "created", "developed", "snaplog", "codecollab"]):
        queries.append("projects built SnapLog CodeCollab Multi-Agent GeneCart")
    elif any(kw in stripped for kw in ["skill", "tech", "stack", "language", "know"]):
        queries.append("technical skills programming languages frameworks")
    elif any(kw in stripped for kw in ["educat", "degree", "study", "university", "nyu", "school", "master"]):
        queries.append("education degree NYU Tandon VIT")
    elif any(kw in stripped for kw in ["award", "win", "hackathon", "qualcomm", "achiev", "special", "stand out", "impress"]):
        queries.append("Qualcomm hackathon award SnapLog achievement strengths")
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
    """Format retrieved chunks into a clean, structured context block.
    Returns empty string when nothing is retrieved — the system prompt's ABOUT
    section already has core facts so the model can still answer.
    """
    if not chunks or all(c.get("rrf_score", c.get("score", 0)) < 0.005 for c in chunks):
        return ""

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

    context_block = (
        f"--- RETRIEVED CONTEXT ---\n{context}\n--- END CONTEXT ---\n\n"
        if context else ""
    )

    return (
        f"{SYSTEM_PROMPT}\n\n"
        f"{context_block}"
        f"Conversation history:\n{history_text}"
        f"User: {req.message}\nAvocado:"
    )


def _is_capacity_error(exc: Exception) -> bool:
    msg = str(exc)
    return "503" in msg or "429" in msg or "UNAVAILABLE" in msg or "RESOURCE_EXHAUSTED" in msg


def _generate(system: str, prompt: str) -> str:
    client = _get_client()
    contents = f"{system}\n\n{prompt}" if system else prompt
    last_exc: Exception | None = None
    for model in settings.model_chain:
        try:
            response = client.models.generate_content(model=model, contents=contents)
            if model != settings.gemini_model:
                logger.info("Fell back to model: %s", model)
            return response.text or ""
        except Exception as exc:
            if _is_capacity_error(exc):
                logger.warning("Model %s unavailable (%s), trying next...", model, exc)
                last_exc = exc
            else:
                raise
    raise last_exc or RuntimeError("All models exhausted")


def _stream_tokens(full_prompt: str) -> Iterator[str]:
    client = _get_client()
    last_exc: Exception | None = None
    for model in settings.model_chain:
        try:
            for chunk in client.models.generate_content_stream(model=model, contents=full_prompt):
                if chunk.text:
                    yield chunk.text
            if model != settings.gemini_model:
                logger.info("Streamed via fallback model: %s", model)
            return
        except Exception as exc:
            if _is_capacity_error(exc):
                logger.warning("Model %s unavailable (%s), trying next...", model, exc)
                last_exc = exc
            else:
                raise
    raise last_exc or RuntimeError("All models exhausted")


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
    try:
        # 1. Batched dense retrieval — ONE encode call for all 4 queries
        dense = await rag_store.query_batch_async(queries, n_per_query=6)
        # 2. BM25 lexical retrieval — catches exact matches dense misses
        bm25 = rag_store.bm25_query(req.message, n_results=15)
        # 3. Hybrid merge via Reciprocal Rank Fusion
        merged = rag_store.rrf_merge(dense, bm25, k=60, top_n=20)
        # 4. Cross-encoder rerank → top 5 (skipped gracefully if model not ready)
        top_chunks = await rag_store.rerank_cross_encoder_async(req.message, merged, top_n=5)
    except Exception as exc:
        logger.warning("Hybrid RAG pipeline failed, falling back to simple retrieval: %s", exc)
        top_chunks = await rag_store.query_multi_async(queries)
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

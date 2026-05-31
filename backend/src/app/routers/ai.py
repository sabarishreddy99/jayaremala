from __future__ import annotations

import asyncio
import json
import logging
import threading
from typing import Iterator, Literal

import google.genai as genai
from fastapi import APIRouter, HTTPException
from app.core.limiter import limiter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from fastapi import Request

from app.core.settings import settings
from app.db import analytics
from app.rag import graph as rag_graph
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
- Avocado uses BAAI/bge-base-en-v1.5 (768-dim ONNX) for dense retrieval + BM25 + RRF + knowledge graph expansion

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
- Never return an empty response — always say something helpful

PORTFOLIO SECTION LINKS (use these when relevant — the UI will render them as clickable pills):
- Full work history → /experience
- All projects → /projects
- Education details → /education
- Skills overview → /portfolio
- Blog posts → /blog  (individual post → /blog/[slug])
- Lab / system design docs → /lab  (individual entry → /lab/[slug])
- Resume → available via the Resume link in navigation"""


def _get_client() -> genai.Client:
    global _genai_client
    if _genai_client is None:
        if not settings.google_api_key:
            raise HTTPException(status_code=503, detail="GOOGLE_API_KEY is not configured")
        _genai_client = genai.Client(api_key=settings.google_api_key)
    return _genai_client


_GREETINGS = frozenset({
    "hi", "hello", "hey", "howdy", "sup", "yo", "hiya", "greetings",
    "good morning", "good afternoon", "good evening", "morning", "afternoon", "evening",
})

_HYDE_PROMPT = (
    "Write 2-3 sentences of factual biography text about Jaya Sabarish Reddy Remala that directly answers this question. "
    "Third person, specific details and numbers only. Be concise.\n"
    "Question: {question}"
)


async def _hyde_query(user_message: str) -> str | None:
    """HyDE — Hypothetical Document Embeddings (Gao et al. 2022).
    Generates a short hypothetical answer and embeds *that* for vector search.
    Hypothetical answers sit closer in embedding space to real KB chunks than
    the raw question does, improving retrieval precision for vague queries.
    Skipped for greetings and very short messages. Hard timeout keeps latency bounded.
    """
    stripped = user_message.lower().strip()
    if len(stripped) < 15 or stripped in _GREETINGS:
        return None
    prompt = _HYDE_PROMPT.format(question=user_message)
    try:
        loop = asyncio.get_running_loop()
        doc = await asyncio.wait_for(
            loop.run_in_executor(None, lambda: _generate("", prompt)),
            timeout=4.0,
        )
        logger.debug("HyDE doc: %s", doc[:120] if doc else "(empty)")
        return doc.strip() or None
    except Exception as exc:
        logger.debug("HyDE generation skipped: %s", exc)
        return None


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
        "profile":    "Profile",
        "experience": "Work Experience",
        "education":  "Education",
        "project":    "Projects",
        "skills":     "Skills",
        "faq":        "Key Facts",
        "blog":       "Blog Posts",
        "lab":        "Lab / System Design",
    }
    for t in ["faq", "profile", "experience", "project", "education", "skills", "blog", "lab"]:
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
    return (
        "503" in msg or "429" in msg
        or "UNAVAILABLE" in msg or "RESOURCE_EXHAUSTED" in msg
        or "exhausted" in msg.lower()
        # 404 means this model name is deprecated/removed — skip to next, not a code bug
        or ("404" in msg and "NOT_FOUND" in msg)
    )


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


_RESET_SENTINEL = object()  # yielded to signal "discard partial output, retrying next model"


def _stream_tokens(full_prompt: str, used_model: list[str]) -> Iterator:
    """Yields str tokens, or _RESET_SENTINEL when switching models mid-stream."""
    client = _get_client()
    last_exc: Exception | None = None
    for model in settings.model_chain:
        yielded_any = False
        try:
            for chunk in client.models.generate_content_stream(model=model, contents=full_prompt):
                if chunk.text:
                    yield chunk.text
                    yielded_any = True
            used_model.append(model)
            if model != settings.gemini_model:
                logger.info("Streamed via fallback model: %s", model)
            return
        except Exception as exc:
            if _is_capacity_error(exc):
                logger.warning("Model %s capacity error (%s), trying next...", model, exc)
                if yielded_any:
                    # Partial tokens already sent — tell the frontend to discard them
                    yield _RESET_SENTINEL
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
    graph_extras = rag_graph.expand_context(
        retrieved_ids=[c["id"] for c in top_chunks],
        rrf_pool=merged,
        max_expansion=2,
    )
    if graph_extras:
        top_chunks = top_chunks + graph_extras
    context = _build_context(top_chunks)
    sources = [f"{c['type']}:{c['id']}" for c in top_chunks]
    prompt = _build_chat_prompt(req, context)
    reply = _generate("", prompt)
    return ChatResponse(reply=reply.strip(), sources=sources)


# ── /ai/chat/stream (SSE streaming) ──────────────────────────────────────────

@router.post("/chat/stream")
@limiter.limit("10/minute")
async def ai_chat_stream(req: ChatRequest, request: Request) -> StreamingResponse:
    queries = _build_rag_queries(req)
    try:
        # 1. HyDE generation + original dense retrieval run in parallel.
        #    HyDE generates a hypothetical answer; embedding it yields higher cosine
        #    similarity to real KB chunks than the raw question (Gao et al. 2022).
        hyde_task = asyncio.create_task(_hyde_query(req.message))
        dense_task = asyncio.create_task(rag_store.query_batch_async(queries, n_per_query=6))
        # 2. BM25 is sync and fast (~2ms) — run while async tasks are in flight
        bm25 = rag_store.bm25_query(req.message, n_results=15)
        hyde_doc, dense_result = await asyncio.gather(hyde_task, dense_task, return_exceptions=True)
        if isinstance(dense_result, BaseException):
            raise dense_result
        dense: list[dict] = list(dense_result)
        # 3. If HyDE produced a doc, embed it and prepend results so RRF rewards
        #    chunks retrieved by both signals (accumulated score = double rank bonus).
        if isinstance(hyde_doc, str) and hyde_doc:
            try:
                hyde_chunks = await rag_store.query_batch_async([hyde_doc], n_per_query=8)
                dense = hyde_chunks + dense
                logger.debug("HyDE retrieved %d additional chunks", len(hyde_chunks))
            except Exception as exc:
                logger.debug("HyDE embedding step failed (non-fatal): %s", exc)
        # 4. Hybrid merge via Reciprocal Rank Fusion
        merged = rag_store.rrf_merge(dense, bm25, k=60, top_n=20)
        # 5. Cross-encoder rerank → top 5
        top_chunks = await rag_store.rerank_cross_encoder_async(req.message, merged, top_n=5)
        # 6. Graph expansion — pull in up to 2 related docs from the merged pool
        graph_extras = rag_graph.expand_context(
            retrieved_ids=[c["id"] for c in top_chunks],
            rrf_pool=merged,
            max_expansion=2,
        )
        if graph_extras:
            top_chunks = top_chunks + graph_extras
    except Exception as exc:
        logger.warning("Hybrid RAG pipeline failed, falling back to simple retrieval: %s", exc)
        top_chunks = await rag_store.query_multi_async(queries)
    context = _build_context(top_chunks)
    sources = [f"{c['type']}:{c['id']}" for c in top_chunks]
    full_prompt = _build_chat_prompt(req, context)

    ip = (
        request.headers.get("x-forwarded-for", "").split(",")[0].strip()
        or request.headers.get("x-real-ip", "").strip()
        or (request.client.host if request.client else "unknown")
    )
    # Prefer the stable per-device UUID so unique chat users counts devices, not IPs.
    identifier = request.headers.get("x-visitor-id", "").strip() or ip
    analytics.record_question(req.message)

    def event_stream():
        used_model: list[str] = []
        try:
            for item in _stream_tokens(full_prompt, used_model):
                if item is _RESET_SENTINEL:
                    yield f"data: {json.dumps({'reset': True})}\n\n"
                else:
                    yield f"data: {json.dumps({'token': item})}\n\n"
            row_id = analytics.record(identifier)
            yield f"data: {json.dumps({'done': True, 'sources': sources, 'model': used_model[0] if used_model else settings.gemini_model})}\n\n"
            if row_id:
                threading.Thread(
                    target=analytics.geo_update_sync,
                    args=("interactions", row_id, ip),
                    daemon=True,
                ).start()
        except Exception as exc:
            logger.error("Streaming error: %s", exc)
            error_code = "quota_exhausted" if _is_capacity_error(exc) else "stream_error"
            yield f"data: {json.dumps({'error': error_code})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ── /ai/feedback ──────────────────────────────────────────────────────────────

class FeedbackRequest(BaseModel):
    message_hash: str
    rating: int  # 1 = thumbs up, -1 = thumbs down


@router.post("/feedback")
def ai_feedback(req: FeedbackRequest) -> dict:
    if req.rating not in (1, -1):
        raise HTTPException(status_code=422, detail="rating must be 1 or -1")
    analytics.record_feedback(req.message_hash, req.rating)
    return {"ok": True}


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


# ── /ai/followups ──────────────────────────────────────────────────────────────

class FollowUpsRequest(BaseModel):
    message: str
    response: str


class FollowUpsResponse(BaseModel):
    followups: list[str]


@router.post("/followups", response_model=FollowUpsResponse)
def ai_followups(req: FollowUpsRequest) -> FollowUpsResponse:
    """Generate 2-3 dynamic follow-up questions from the last exchange."""
    prompt = (
        "A recruiter is chatting with an AI assistant about a software engineer named Jaya.\n\n"
        f"Recruiter asked: {req.message}\n\n"
        f"AI answered: {req.response[:700]}\n\n"
        "Generate exactly 2-3 short follow-up questions the recruiter would naturally ask next.\n"
        "Rules:\n"
        "- Reference specific things mentioned in the answer (technologies, companies, projects, metrics)\n"
        "- Each question must be under 12 words\n"
        "- Output only the questions, one per line, no numbering, bullets, or prefixes\n"
        "- Make them feel like natural curiosity, not generic questions"
    )
    try:
        text = _generate("", prompt)
        followups = [
            q.strip().lstrip("•-–—0123456789.) ").strip()
            for q in text.strip().splitlines()
            if q.strip() and len(q.strip()) > 8
        ][:3]
        return FollowUpsResponse(followups=followups)
    except Exception:
        return FollowUpsResponse(followups=[])

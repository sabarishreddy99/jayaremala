from __future__ import annotations

import asyncio
import json
import logging
import threading
import time
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
- Curated quotes collection → /quotes
- Photo gallery (milestones, events, achievements) → /gallery
- What Jaya is currently doing, building, reading → /now
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


# Strong category signals — these retrieve well via the name-anchored + topic
# query variants already, so HyDE's extra LLM round-trip adds latency without
# improving precision. Skip it for them; reserve HyDE for genuinely vague queries.
_HYDE_SKIP_KEYWORDS = (
    "experience", "work", "job", "role", "company", "wipro", "shell", "nyu", "intern",
    "project", "built", "build", "snaplog", "codecollab", "genecart", "hackathon", "qualcomm",
    "skill", "stack", "tech", "language", "framework", "python", "react", "aws", "kubernetes",
    "education", "degree", "university", "gpa", "tandon", "master",
    "contact", "email", "reach", "hire", "linkedin", "resume", "cv",
    "award", "win", "achiev", "available", "open to", "location", "based", "who is",
    "quote", "saying", "wisdom", "gallery", "photo", "milestone",
    "now", "currently", "right now", "these days",
)

_hyde_cache: dict[str, "str | None"] = {}
_HYDE_CACHE_MAX = 256


def _should_use_hyde(stripped: str) -> bool:
    if len(stripped) < 15 or stripped in _GREETINGS:
        return False
    if any(kw in stripped for kw in _HYDE_SKIP_KEYWORDS):
        return False
    return True


async def _hyde_query(user_message: str) -> str | None:
    """HyDE — Hypothetical Document Embeddings (Gao et al. 2022).
    Generates a short hypothetical answer and embeds *that* for vector search.
    Only runs for genuinely vague queries (no strong category signal); results
    are cached by normalized query and the call is hard-timeout bounded.
    """
    stripped = user_message.lower().strip()
    if not _should_use_hyde(stripped):
        return None
    if stripped in _hyde_cache:
        return _hyde_cache[stripped]

    prompt = _HYDE_PROMPT.format(question=user_message)
    try:
        loop = asyncio.get_running_loop()
        doc = await asyncio.wait_for(
            loop.run_in_executor(None, lambda: _generate("", prompt)),
            timeout=2.5,
        )
        result = doc.strip() or None
    except Exception as exc:
        logger.debug("HyDE generation skipped: %s", exc)
        result = None

    if len(_hyde_cache) >= _HYDE_CACHE_MAX:
        _hyde_cache.clear()
    _hyde_cache[stripped] = result
    return result


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
    elif any(kw in stripped for kw in ["quote", "saying", "wisdom", "words", "philosophy", "live by"]):
        queries.append("quotes curated collection favorite Jaya books reading wisdom")
    elif any(kw in stripped for kw in ["gallery", "photo", "milestone", "achievement photo", "event"]):
        queries.append("gallery milestones events achievements photos Jaya")
    elif any(kw in stripped for kw in ["now", "currently", "right now", "these days", "up to", "reading now", "building now"]):
        queries.append("Jaya currently building learning reading now page")

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


_CALENDAR_KEYWORDS = frozenset({
    "book", "schedule", "call", "meeting", "available", "availability",
    "slot", "free", "interview", "chat", "connect", "this week", "next week",
    "30 min", "30-min", "30 minute", "hop on", "catch up",
})


def _is_calendar_query(text: str) -> bool:
    lower = text.lower()
    return any(kw in lower for kw in _CALENDAR_KEYWORDS)


def _build_chat_prompt(req: ChatRequest, context: str, extra_blocks: dict[str, str] | None = None) -> str:
    history_text = ""
    for m in req.messages[-4:]:
        prefix = "User" if m.role == "user" else "Avocado"
        history_text += f"{prefix}: {m.content}\n"

    context_block = (
        f"--- RETRIEVED CONTEXT ---\n{context}\n--- END CONTEXT ---\n\n"
        if context else ""
    )

    persona_block = ""
    if req.persona and req.persona in _PERSONA_GUIDANCE:
        persona_block = f"AUDIENCE TAILORING: {_PERSONA_GUIDANCE[req.persona]}\n\n"

    extra_text = ""
    if extra_blocks:
        for label, content in extra_blocks.items():
            if content:
                extra_text += f"[{label}]\n{content}\n\n"

    return (
        f"{SYSTEM_PROMPT}\n\n"
        f"{persona_block}"
        f"{context_block}"
        f"{extra_text}"
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
    persona: str | None = None


_PERSONA_GUIDANCE = {
    "recruiter": (
        "The visitor is a RECRUITER or hiring manager. Lead with impact, outcomes, and fit: "
        "availability, target roles, standout achievements (Qualcomm Edge AI win, 78% P99 latency cut, "
        "Shell maritime scale), and how Jaya works with teams. Keep it crisp and results-focused, "
        "quantify wherever possible, and proactively surface availability and how to reach him."
    ),
    "engineer": (
        "The visitor is a SOFTWARE ENGINEER. Lead with technical depth: architecture, the stack, "
        "design tradeoffs, and how systems were actually built (hybrid RAG retrieval, HyDE, RRF, "
        "Edge AI inference on Snapdragon NPUs, distributed infra). Use precise technical language "
        "and concrete implementation details."
    ),
    "founder": (
        "The visitor is a FOUNDER or startup leader. Lead with ownership, shipping speed, and "
        "end-to-end capability: what Jaya can build solo and how fast, breadth across the stack, "
        "and the business impact of his work. Emphasize turning ambiguity into shipped product."
    ),
}


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
    top_chunks = rag_store.rerank_cross_encoder(req.message, merged, top_n=4)
    graph_extras = rag_graph.expand_context(
        retrieved_ids=[c["id"] for c in top_chunks],
        rrf_pool=merged,
        max_expansion=1,
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
        # 5. Cross-encoder rerank → top 4 (fewer context tokens = faster first token)
        top_chunks = await rag_store.rerank_cross_encoder_async(req.message, merged, top_n=4)
        # 6. Graph expansion — pull in 1 related doc from the merged pool
        graph_extras = rag_graph.expand_context(
            retrieved_ids=[c["id"] for c in top_chunks],
            rrf_pool=merged,
            max_expansion=1,
        )
        if graph_extras:
            top_chunks = top_chunks + graph_extras
    except Exception as exc:
        logger.warning("Hybrid RAG pipeline failed, falling back to simple retrieval: %s", exc)
        top_chunks = await rag_store.query_multi_async(queries)
    context = _build_context(top_chunks)
    sources = [f"{c['type']}:{c['id']}" for c in top_chunks]

    # Gather live context blocks in parallel (calendar + inbox signals)
    extra_blocks: dict[str, str] = {}
    live_tasks = []

    if _is_calendar_query(req.message):
        async def _fetch_calendar():
            try:
                from app.integrations.calendar import get_availability_summary
                loop = asyncio.get_running_loop()
                summary = await asyncio.wait_for(
                    loop.run_in_executor(None, get_availability_summary),
                    timeout=2.5,
                )
                if summary:
                    extra_blocks["Availability"] = summary
            except Exception as exc:
                logger.debug("Calendar availability fetch skipped: %s", exc)
        live_tasks.append(_fetch_calendar())

    if req.persona == "recruiter":
        async def _fetch_signals():
            try:
                import json
                from app.rag.ingest import DATA_DIR
                signals_path = DATA_DIR / "inbox_signals.json"
                if signals_path.exists():
                    from datetime import timezone as _tz
                    import time as _time
                    age_days = (_time.time() - signals_path.stat().st_mtime) / 86400
                    if age_days < 7:
                        data = json.loads(signals_path.read_text())
                        summary = data.get("summary_text", "")
                        if summary:
                            extra_blocks["Market Signals"] = summary
            except Exception as exc:
                logger.debug("Inbox signals injection skipped: %s", exc)
        live_tasks.append(_fetch_signals())

    if live_tasks:
        await asyncio.gather(*live_tasks, return_exceptions=True)

    # Inject Drive resume context for resume-intent queries
    _RESUME_KEYWORDS = {"resume", "cv", "curriculum", "download resume", "latest resume"}
    if any(kw in req.message.lower() for kw in _RESUME_KEYWORDS):
        try:
            import json as _json
            from app.rag.ingest import DATA_DIR as _DATA_DIR
            resume_path = _DATA_DIR / "drive_resume.json"
            if resume_path.exists():
                rdata = _json.loads(resume_path.read_text())
                modified = rdata.get("modified_time", "")[:10]
                link = rdata.get("web_view_link", "")
                if link:
                    extra_blocks["Resume"] = f"Jaya's latest resume (updated {modified}): {link}"
        except Exception:
            pass

    full_prompt = _build_chat_prompt(req, context, extra_blocks if extra_blocks else None)

    # Determine if lead-capture prompt should be shown after response
    user_turn_count = sum(1 for m in req.messages if m.role == "user") + 1
    show_lead_capture = user_turn_count >= 3

    ip = (
        request.headers.get("x-forwarded-for", "").split(",")[0].strip()
        or request.headers.get("x-real-ip", "").strip()
        or (request.client.host if request.client else "unknown")
    )
    # Prefer the stable per-device UUID so unique chat users counts devices, not IPs.
    identifier = request.headers.get("x-visitor-id", "").strip() or ip
    analytics.record_question(req.message)
    req_start = time.perf_counter()

    def event_stream():
        used_model: list[str] = []
        try:
            for item in _stream_tokens(full_prompt, used_model):
                if item is _RESET_SENTINEL:
                    yield f"data: {json.dumps({'reset': True})}\n\n"
                else:
                    yield f"data: {json.dumps({'token': item})}\n\n"
            model_used = used_model[0] if used_model else settings.gemini_model
            latency_ms = int((time.perf_counter() - req_start) * 1000)
            row_id = analytics.record(identifier, model_used, latency_ms)
            done_payload: dict = {"done": True, "sources": sources, "model": model_used}
            if show_lead_capture:
                done_payload["lead_capture_prompt"] = True
            yield f"data: {json.dumps(done_payload)}\n\n"
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


# ── /ai/warmup ────────────────────────────────────────────────────────────────

@router.get("/warmup")
async def ai_warmup() -> dict:
    """Pre-warm the ONNX embedder + retrieval path so the first real query is hot.
    Called by the chat page on mount to eliminate the cold-start cliff."""
    try:
        await rag_store.query_batch_async(["warmup"], n_per_query=1)
    except Exception as exc:
        logger.debug("warmup skipped: %s", exc)
    return {"status": "warm"}


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


# ── /ai/lead-capture ──────────────────────────────────────────────────────────

class LeadCaptureRequest(BaseModel):
    recruiter_name: str
    recruiter_email: str
    company: str
    note: str = ""
    messages: list[ChatMessage] = []
    persona: str | None = None


@router.post("/lead-capture")
@limiter.limit("2/hour")
def ai_lead_capture(req: LeadCaptureRequest, request: Request) -> dict:
    """Receive a recruiter intro form, send Jaya an email, record in analytics."""
    from app.db import analytics as _analytics

    # Build a short conversation summary for the email body
    history = "\n".join(
        f"{'Recruiter' if m.role == 'user' else 'Avocado'}: {m.content[:200]}"
        for m in req.messages[-8:]
    ) or "(no conversation history)"

    try:
        summary = _generate(
            "You are a concise assistant. Summarize in 2-3 sentences.",
            f"Summarize this recruiter conversation with Jaya's AI:\n\n{history}",
        ).strip()
    except Exception:
        summary = history[:500]

    try:
        from app.core.settings import settings as _settings
        from app.integrations.gmail import send_visitor_intro
        send_visitor_intro(
            name=req.recruiter_name.strip(),
            visitor_email=req.recruiter_email.strip(),
            company=req.company.strip(),
            note=req.note.strip(),
            summary=summary,
            recipient=_settings.gmail_digest_recipient,
            persona=req.persona,
        )
        email_sent = True
    except Exception as exc:
        logger.warning("Lead capture email failed (non-fatal): %s", exc)
        email_sent = False

    _analytics.record_lead_capture(req.recruiter_email, req.company)
    return {"ok": True, "email_sent": email_sent}


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

"""Shared, provider-agnostic tool registry.

One declarative source of truth for the read-only tools that expose Jaya's
portfolio. Consumed by two surfaces:
  - the public MCP server (app.mcp_server) — hiring managers connect their own
    Claude/Cursor and call these tools directly;
  - the agentic chat loop (routers/ai.py /chat/agentic) — Gemini function-calling
    picks tools per turn.

Every handler wraps an *existing* function or reads the knowledge JSON — there is
no new retrieval logic here, and **no LLM calls**, so the tools are cheap and
abuse-safe. Each Tool carries a JSON-Schema `parameters` block; the MCP and
Gemini adapters translate that into their respective declaration shapes.
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable

DATA_DIR = Path(__file__).parents[3] / "data" / "knowledge"


def _load(name: str) -> Any:
    try:
        return json.loads((DATA_DIR / f"{name}.json").read_text())
    except Exception:
        return None


# ── Handlers (pure data / retrieval — no LLM) ─────────────────────────────────

def _search_knowledge(query: str, limit: int = 5) -> list[dict]:
    """Run the same hybrid retrieval pipeline the chatbot uses, synchronously."""
    from app.rag import graph as rag_graph
    from app.rag import store as rag_store

    queries = [query, f"{query} Jaya Sabarish Reddy Remala"]
    dense = rag_store.query_batch(queries, n_per_query=6)
    bm25 = rag_store.bm25_query(query, n_results=15)
    merged = rag_store.rrf_merge(dense, bm25, k=60, top_n=20)
    top = rag_store.rerank_cross_encoder(query, merged, top_n=max(1, min(limit, 8)))
    extras = rag_graph.expand_context(
        retrieved_ids=[c["id"] for c in top], rrf_pool=merged, max_expansion=1
    )
    if extras:
        top = top + extras
    return [{"type": c["type"], "id": c["id"], "text": c["text"]} for c in top]


def _get_profile() -> dict:
    p = _load("profile") or {}
    return {k: p.get(k) for k in (
        "name", "tagline", "bio", "summary", "location", "email",
        "github", "linkedin", "interested_domain", "previous",
    )}


def _get_experience() -> list:
    return _load("experience") or []


def _get_projects() -> list:
    return _load("projects") or []


def _get_project(name: str) -> dict | None:
    name_l = (name or "").lower().strip()
    for p in _load("projects") or []:
        title = str(p.get("title", "")).lower()
        if name_l and (name_l in title or title in name_l):
            return p
    return None


def _get_skills() -> Any:
    return _load("skills") or []


def _get_education() -> list:
    return _load("education") or []


def _get_now() -> dict:
    p = _load("profile") or {}
    return {"now": p.get("now"), "currently": p.get("currently")}


def _get_resume() -> dict:
    p = _load("profile") or {}
    return {
        "resume_url": p.get("resume", ""),
        "linkedin": p.get("linkedin", ""),
        "github": p.get("github", ""),
        "email": p.get("email", ""),
    }


def _check_availability() -> str:
    try:
        from app.integrations.calendar import get_availability_summary
        return get_availability_summary() or "Availability is not currently published."
    except Exception:
        return "Availability is not currently published."


# ── Tool registry ─────────────────────────────────────────────────────────────

def _obj(props: dict | None = None, required: list[str] | None = None) -> dict:
    return {"type": "object", "properties": props or {}, "required": required or []}


@dataclass
class Tool:
    name: str
    description: str
    handler: Callable[..., Any]
    parameters: dict = field(default_factory=_obj)

    def run(self, **kwargs: Any) -> Any:
        return self.handler(**kwargs)


TOOLS: list[Tool] = [
    Tool(
        name="search_knowledge",
        description=(
            "Semantic + keyword search over Jaya's full portfolio knowledge base "
            "(experience, projects, skills, education, blog, lab notes). Returns the "
            "most relevant grounded snippets. Use this for open-ended questions."
        ),
        handler=_search_knowledge,
        parameters=_obj(
            {
                "query": {"type": "string", "description": "Natural-language question or topic."},
                "limit": {"type": "integer", "description": "Max snippets to return (1-8).", "default": 5},
            },
            required=["query"],
        ),
    ),
    Tool(
        name="get_profile",
        description="Jaya's headline profile: name, tagline, bio, summary, location, and contact links.",
        handler=_get_profile,
    ),
    Tool(
        name="get_experience",
        description="Full work history — companies, roles, dates, tech, and impact bullets.",
        handler=_get_experience,
    ),
    Tool(
        name="get_projects",
        description="All projects with title, description, tech tags, awards, and source links.",
        handler=_get_projects,
    ),
    Tool(
        name="get_project",
        description="Details for a single project matched by name (e.g. 'SnapLog', 'GeneCart').",
        handler=_get_project,
        parameters=_obj(
            {"name": {"type": "string", "description": "Project name or partial title."}},
            required=["name"],
        ),
    ),
    Tool(
        name="get_skills",
        description="Technical skills grouped by category.",
        handler=_get_skills,
    ),
    Tool(
        name="get_education",
        description="Degrees, institutions, GPA, and highlights.",
        handler=_get_education,
    ),
    Tool(
        name="get_now",
        description="What Jaya is currently building, learning, and focused on right now.",
        handler=_get_now,
    ),
    Tool(
        name="get_resume",
        description="Links to Jaya's latest resume, LinkedIn, GitHub, and email.",
        handler=_get_resume,
    ),
    Tool(
        name="check_availability",
        description="Whether Jaya is open to opportunities and a summary of his calendar availability for a call.",
        handler=_check_availability,
    ),
]

TOOLS_BY_NAME: dict[str, Tool] = {t.name: t for t in TOOLS}

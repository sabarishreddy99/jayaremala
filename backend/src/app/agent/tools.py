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
    """Who Jaya is, as the home page tells it: identity, the hero, the award and
    headline numbers, links. The story blocks have their own tools below."""
    p = _load("profile") or {}
    out = {k: p.get(k) for k in (
        "name", "tagline", "bio", "summary", "location", "email", "github", "linkedin",
        "resume", "booking_url", "previous", "prev_domain", "interested_domain",
        "obsession", "currently", "award", "hero", "heroStats",
    ) if p.get(k)}
    out["site"] = SITE_URL
    return out


def _get_how_i_work() -> dict:
    """Jaya's working principles and the don'ts that keep them honest."""
    o = (_load("profile") or {}).get("opinions") or {}
    return {
        "summary": o.get("deck", ""),
        "principles": [{"principle": x.get("term"), "why": x.get("line")} for x in o.get("for", [])],
        "donts": [{"dont": x.get("term"), "why": x.get("line")} for x in o.get("against", [])],
    }


def _get_hiring_fit() -> dict:
    """What a hiring team gets: role fit, each need with its proof, availability and booking."""
    p = _load("profile") or {}
    hire = p.get("hire") or {}
    return {
        "fit": hire.get("fit", ""),
        "needs": [
            {k: n.get(k) for k in ("need", "metric", "metricLabel", "context", "where", "how")}
            for n in hire.get("needs", [])
        ],
        "availability": p.get("availability"),
        "booking_url": p.get("booking_url", ""),
        "resume": p.get("resume", ""),
    }


def _get_story() -> dict:
    """Why Jaya builds: the origin story, what he optimizes for, and what is still running."""
    p = _load("profile") or {}
    why = p.get("why") or {}
    hope = p.get("hopeMolecules") or {}
    return {
        "origin": " ".join(why.get("paragraphs", [])),
        "pull_quote": why.get("pullQuote", ""),
        "values": {k: hope.get(k) for k in ("term", "definition", "belief", "closing") if hope.get(k)},
        "still_running": [
            {k: s.get(k) for k in ("name", "what", "who", "sinceLabel", "url", "status")}
            for s in p.get("shipped", [])
        ],
        "still_running_note": p.get("shippedNote", ""),
        "motto": (p.get("hero") or {}).get("signature", ""),
    }


def _get_site_map() -> list:
    """Every page on jayaremala.com with its URL and what is on it."""
    site = _load("site") or {}
    base = site.get("url", SITE_URL)
    return [
        {"page": pg.get("label"), "url": f"{base}{pg.get('href', '')}", "section": pg.get("group"),
         "what_is_there": pg.get("about") or pg.get("desc")}
        for pg in site.get("pages", [])
    ]


def _get_gallery(category: str = "") -> list:
    """Milestones and moments from the gallery, optionally filtered by category or keyword."""
    q = (category or "").lower().strip()
    items = []
    for g in _load("gallery") or []:
        row = {k: g.get(k) for k in ("title", "caption", "category", "date", "location") if g.get(k)}
        if not q or q in " ".join(str(v) for v in row.values()).lower():
            items.append(row)
    return items


def _get_quotes(category: str = "") -> list:
    """Quotes Jaya returns to, optionally filtered by category or keyword."""
    q = (category or "").lower().strip()
    out = []
    for x in _load("quotes") or []:
        row = {k: x.get(k) for k in ("text", "author", "source", "category", "favorite") if x.get(k) not in (None, "")}
        if not q or q in " ".join(str(v) for v in row.values()).lower():
            out.append(row)
    return out


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


def _get_blog(slug: str = "") -> Any:
    """List blog posts (metadata only), or one full post when `slug` is given.

    Reads blog.json fresh on every call, so new posts (admin-published or pushed
    as MDX and re-ingested on deploy) appear automatically with no MCP restart.
    """
    posts = _load("blog") or []
    if slug:
        s = slug.lower().strip()
        for p in posts:
            if s in str(p.get("slug", "")).lower() or s in str(p.get("title", "")).lower():
                return p  # full post incl. content
        return None
    # List view: metadata only — keep the payload small, omit the full body.
    return [
        {k: p.get(k) for k in ("slug", "title", "date", "description", "tags")}
        for p in posts
    ]


def _get_lab(slug: str = "") -> Any:
    """List lab / system-design entries (metadata only), or one full entry by `slug`."""
    entries = _load("lab") or []
    if slug:
        s = slug.lower().strip()
        for e in entries:
            if s in str(e.get("slug", "")).lower() or s in str(e.get("title", "")).lower():
                return e  # full entry incl. content
        return None
    return [
        {k: e.get(k) for k in ("slug", "title", "status", "description", "startedAt", "updatedAt", "tech")}
        for e in entries
    ]


SITE_URL = "https://jayaremala.com"


def _absolutize_links(entry: dict) -> dict:
    """Make a case study's site-relative hrefs absolute.

    case-studies.json stores hrefs like "/case-studies/clearway/index.html"
    because the Next page renders them from the site's own origin. An MCP
    client is not on that origin — Claude Desktop or Cursor receiving "/case-
    studies/..." has nothing to resolve it against — so the tool hands back
    fully-qualified URLs instead.
    """
    links = entry.get("links")
    if not links:
        return entry
    out = dict(entry)
    out["links"] = [
        {**link, "href": f"{SITE_URL}{link['href']}"}
        if str(link.get("href", "")).startswith("/") else link
        for link in links
    ]
    return out


def _get_case_studies(slug: str = "") -> Any:
    """List case studies, or one by `slug`.

    The list view returns metadata; the detail view adds `full_text`, the
    deck's readable text extracted by scripts/sync-knowledge.mjs. Reads fresh
    on every call, so a new brief appears with no restart.
    """
    entries = [_absolutize_links(c) for c in (_load("case-studies") or [])]
    if slug:
        q = slug.lower().strip()
        texts = {d.get("slug"): d.get("text", "") for d in (_load("case-study-text") or [])}
        for c in entries:
            if q in str(c.get("slug", "")).lower() or q in str(c.get("title", "")).lower():
                # The deck's full text (extracted at sync time) rides along.
                return {**c, "full_text": texts.get(c.get("slug"), "")} if texts.get(c.get("slug")) else c
        return None
    return [
        {k: c.get(k) for k in
         ("slug", "title", "headline", "context", "brief", "role", "date",
          "readingTime", "sections", "tags", "links")}
        for c in entries
    ]


def _get_testimonials() -> list:
    """Recommendations colleagues and managers have written, newest first.

    Sorted on `givenAt` so the list leads with the most recent; entries without
    a date sort last rather than crashing the comparison.
    """
    items = _load("testimonials") or []
    return sorted(
        (
            {k: t.get(k) for k in
             ("name", "designation", "company", "description", "givenAt", "source", "linkedin")}
            for t in items
        ),
        key=lambda t: t.get("givenAt") or "",
        reverse=True,
    )


def _get_apps() -> list:
    """List every app/product Jaya hosts under his domain (Gradevitian, future ones).

    Reads apps.json fresh on every call, so new hosted properties appear
    automatically with no MCP restart or code change.
    """
    apps = _load("apps") or []
    return [
        {k: a.get(k) for k in ("slug", "name", "url", "tagline", "status", "category", "tech")}
        for a in apps
    ]


def _get_app(name: str) -> dict | None:
    """Full details for one hosted app matched by name, slug, or domain."""
    q = (name or "").lower().strip()
    if not q:
        return None
    for a in _load("apps") or []:
        haystack = " ".join(str(a.get(k, "")) for k in ("slug", "name", "url")).lower()
        if q in haystack:
            return a
    return None


def _check_availability() -> str:
    """Whether Jaya is open to work, in natural language.

    profile.availability is the authority here — it is the same block the site
    hero renders, so it is always published and always current. The live
    calendar only ever *adds* detail about when he is free.

    This used to return the calendar summary alone, which meant the tool
    answered "Availability is not currently published" whenever Google Calendar
    was unconnected or the 6s Freebusy lookup timed out — directly contradicting
    the "Open to work" badge on the front page. _get_booking_link already
    degrades to profile.json this way; this now matches it.
    """
    p = _load("profile") or {}
    avail = p.get("availability") or {}

    if avail:
        label = avail.get("label") or ("Open to opportunities" if avail.get("open", True) else "Not currently looking")
        bits = []
        if avail.get("types"):
            bits.append(", ".join(avail["types"]))
        if avail.get("locations"):
            bits.append(" or ".join(avail["locations"]))
        parts = [f"{label} — {'; '.join(bits)}." if bits else f"{label}."]
        if p.get("location"):
            parts.append(f"Based in {p['location']}.")
    elif p.get("location"):
        parts = [f"Based in {p['location']}."]
    else:
        parts = []

    # Live slots are a bonus, never a prerequisite. Any failure is swallowed so
    # the published answer still goes out.
    try:
        from app.integrations.calendar import get_availability_summary
        live = get_availability_summary()
        if live:
            parts.append(live)
    except Exception:
        pass

    parts.append("Use get_booking_link to schedule a call.")
    return " ".join(parts) if parts else "Availability is not currently published."


def _get_booking_link() -> dict:
    """Open call slots + Jaya's Google booking link, for scheduling intents.

    Always returns a usable card — the booking_url works even when the live
    calendar isn't connected (slots will just be empty).
    """
    try:
        from app.integrations.calendar import get_booking_card
        return get_booking_card()
    except Exception:
        p = _load("profile") or {}
        return {"booking_url": p.get("booking_url", ""), "open": True, "slots": []}


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
            "Semantic + keyword search over everything published on jayaremala.com: "
            "experience, projects, skills, education, full blog posts and lab build logs, "
            "case studies, hosted apps, testimonials, quotes, gallery, his principles, "
            "origin story, hiring pitch and the site's pages. "
            "Returns the most relevant grounded snippets. Use this for open-ended questions."
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
        description=(
            "Jaya's profile as his home page tells it: name, tagline, bio, summary, location, "
            "contact and résumé links, past and target domains, his award, the hero introduction "
            "and headline numbers."
        ),
        handler=_get_profile,
    ),
    Tool(
        name="get_hiring_fit",
        description=(
            "What a hiring team gets with Jaya: the roles he is looking for, and for each problem "
            "a team might be hiring for (faster AI, trustworthy retrieval, …) the measured result, "
            "where it happened and how. Includes availability, résumé and booking link. Use for "
            "'why hire him', 'is he a fit for X', or recruiter questions."
        ),
        handler=_get_hiring_fit,
    ),
    Tool(
        name="get_how_i_work",
        description="Jaya's working principles and his don'ts — how he approaches building and execution.",
        handler=_get_how_i_work,
    ),
    Tool(
        name="get_story",
        description=(
            "Why Jaya builds: his origin story (a site for his father's brick business), what he "
            "optimizes for, his motto, and the products he shipped that are still running today."
        ),
        handler=_get_story,
    ),
    Tool(
        name="get_site_map",
        description="Every page on jayaremala.com with its URL and what is on it. Use to point people to the right page.",
        handler=_get_site_map,
    ),
    Tool(
        name="get_gallery",
        description="Milestones and moments from Jaya's gallery (title, caption, category, date). Optional `category` keyword filter.",
        handler=_get_gallery,
        parameters=_obj(
            {"category": {"type": "string", "description": "Optional — category or keyword to filter by."}},
        ),
    ),
    Tool(
        name="get_quotes",
        description="Quotes Jaya returns to, with author and theme. Optional `category` keyword filter.",
        handler=_get_quotes,
        parameters=_obj(
            {"category": {"type": "string", "description": "Optional — category or keyword to filter by."}},
        ),
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
        name="get_case_studies",
        description=(
            "Jaya's long-form case studies — a brief worked end to end, each shipping with a "
            "working prototype. Returns slug, title, headline, the client/context, his role, "
            "date, the deck's section outline, tags, and links to read the deck and open the "
            "prototype. Pass `slug` (a slug or title fragment) for one, including its full text. Use this when asked "
            "about case studies, product/design thinking, or how he approaches an open brief."
        ),
        handler=_get_case_studies,
        parameters=_obj(
            {"slug": {"type": "string", "description": "Optional — slug or title fragment to fetch one case study."}},
        ),
    ),
    Tool(
        name="get_testimonials",
        description=(
            "Recommendations written by Jaya's colleagues and managers — name, role, company, "
            "the quote itself, when it was given, and a LinkedIn link. Newest first. Use this "
            "for 'what do people say about him' or references/social-proof questions."
        ),
        handler=_get_testimonials,
    ),
    Tool(
        name="get_blog",
        description=(
            "List Jaya's blog posts — slug, title, date, description, tags. "
            "Pass `slug` (a slug or title fragment) to fetch one post's full content."
        ),
        handler=_get_blog,
        parameters=_obj(
            {"slug": {"type": "string", "description": "Optional — slug or title fragment to fetch one post's full content."}},
        ),
    ),
    Tool(
        name="get_lab",
        description=(
            "List Jaya's lab / system-design entries — slug, title, status, tech, dates. "
            "Pass `slug` (a slug or title fragment) to fetch one entry's full content."
        ),
        handler=_get_lab,
        parameters=_obj(
            {"slug": {"type": "string", "description": "Optional — slug or title fragment to fetch one entry's full content."}},
        ),
    ),
    Tool(
        name="get_apps",
        description=(
            "List every app and product Jaya hosts under his domain (jayaremala.com) — "
            "e.g. Gradevitian — with name, URL, status, category, and tech. Use this for "
            "'what else has he built / what's hosted on his site / what products does he run' "
            "questions. The registry is dynamic, so future apps appear here automatically."
        ),
        handler=_get_apps,
    ),
    Tool(
        name="get_app",
        description="Full details for one hosted app matched by name, slug, or domain (e.g. 'gradevitian').",
        handler=_get_app,
        parameters=_obj(
            {"name": {"type": "string", "description": "App name, slug, or domain fragment."}},
            required=["name"],
        ),
    ),
    Tool(
        name="get_resume",
        description="Links to Jaya's latest resume, LinkedIn, GitHub, and email.",
        handler=_get_resume,
    ),
    Tool(
        name="check_availability",
        description=(
            "Whether Jaya is open to opportunities, in natural language. Use for "
            "'is he available / open to work' questions — NOT for actually booking."
        ),
        handler=_check_availability,
    ),
    Tool(
        name="get_booking_link",
        description=(
            "Use when the visitor wants to schedule, book, or set up a call/meeting/interview. "
            "Returns Jaya's real open 30-min slots plus his Google booking link. The UI renders "
            "these as a booking card — so invite the visitor to pick a time, don't list the slots yourself."
        ),
        handler=_get_booking_link,
    ),
]

TOOLS_BY_NAME: dict[str, Tool] = {t.name: t for t in TOOLS}

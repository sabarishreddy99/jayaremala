"""Avocado's standing knowledge, built from the knowledge files — never typed in.

The system prompt used to carry a hand-written "core facts" block, contact
details, page links and the keywords used to widen retrieval. Every one of them
drifted the moment content changed in the admin (it linked a /portfolio page
that no longer exists). Everything here is derived from data/knowledge/ and
re-read whenever a source file's mtime changes, so an edit in the admin is the
only step needed for Avocado to say the new thing.
"""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).parents[3] / "data" / "knowledge"
SITE_URL = "https://jayaremala.com"
_SOURCES = ("profile.json", "experience.json", "education.json", "projects.json", "site.json")

_cache: dict[str, Any] = {"stamp": None}


def _stamp() -> tuple:
    return tuple((DATA_DIR / f).stat().st_mtime if (DATA_DIR / f).exists() else 0 for f in _SOURCES)


def _load(name: str) -> Any:
    try:
        return json.loads((DATA_DIR / name).read_text())
    except Exception:
        return None


def _data() -> dict:
    stamp = _stamp()
    if _cache["stamp"] != stamp:
        _cache.clear()
        _cache["stamp"] = stamp
        _cache["profile"] = _load("profile.json") or {}
        _cache["experience"] = _load("experience.json") or []
        _cache["education"] = _load("education.json") or []
        _cache["projects"] = _load("projects.json") or []
        _cache["site"] = _load("site.json") or {}
    return _cache


# ── Pieces ─────────────────────────────────────────────────────────────────────

def name() -> str:
    return _data()["profile"].get("name") or "Jaya"


def highlights(limit: int = 4) -> list[str]:
    """Headline proof points, in the order the home page leads with them."""
    p = _data()["profile"]
    out: list[str] = []
    if p.get("award"):
        out.append(p["award"])
    for need in (p.get("hire") or {}).get("needs", []):
        line = f"{need.get('metric', '')} {need.get('metricLabel', '')} ({need.get('where', '')})".strip()
        if line:
            out.append(line)
    return out[:limit]


def _education_line() -> str:
    edu = _data()["education"]
    if not edu:
        return ""
    e = edu[0]
    school = f"{e.get('institution', '')}{', ' + e['school'] if e.get('school') else ''}"
    gpa = f" (GPA {e['gpa']})" if e.get("gpa") else ""
    return f"{e.get('degree', '')} in {e.get('field', '')}, {school}{gpa}"


def page_links() -> list[tuple[str, str]]:
    """(href, what is there) for every page, from site.json."""
    return [
        (pg.get("href", ""), pg.get("desc") or pg.get("label", ""))
        for pg in (_data()["site"].get("pages") or [])
        if pg.get("href")
    ]


def contact_email() -> str:
    return _data()["profile"].get("email", "")


def system_prompt() -> str:
    d = _data()
    p = d["profile"]
    hero = p.get("hero") or {}
    who = name()
    contact = " | ".join(
        x for x in (
            p.get("email"),
            p.get("phone"),
            str(p.get("linkedin", "")).replace("https://", "").replace("www.", ""),
            str(p.get("github", "")).replace("https://", ""),
        ) if x
    )
    facts = [f"- {h}" for h in highlights()]
    if _education_line():
        facts.append(f"- {_education_line()}")
    if contact:
        facts.append(f"- Contact: {contact}")
    if p.get("booking_url"):
        facts.append(f"- Book a call: {p['booking_url']}")
    proof = ", ".join(hero.get("proof", []))
    links = "\n".join(f"- {desc} → {href}" for href, desc in page_links())
    email = contact_email()

    return f"""You are Avocado, an AI assistant representing {who}.
Your job is to help recruiters and visitors learn about {who.split()[0]}'s professional background, his work, his writing and this website.

ABOUT {who.split()[0].upper()} (core facts — always use these even if context is empty):
{who} is a {p.get('tagline', '')}, based in {p.get('location', '')}.
{p.get('summary') or p.get('bio', '')}
Key highlights:
{chr(10).join(facts)}

RESPONSE RULES:
- ALWAYS answer questions about his background, experience, projects, education, skills, writing, principles and this site
- Use the retrieved context below for precise details; fall back to the ABOUT section above if context is sparse
- Refer to him in third person ("He", "{who.split()[0]}") — you represent him, you are not him
- Cite exact numbers and metrics whenever available
- For greetings respond warmly, introduce yourself as Avocado and offer 2–3 things the visitor can ask about
- For broad intro questions ("who is he", "tell me about him"), lead with {proof or 'his strongest proof points'}
- Keep responses concise: 2–3 sentences for simple questions, structured paragraphs for detailed ones
- For questions completely unrelated to him or this site, say: "That's outside what I know — feel free to reach him directly{' at ' + email if email else ''}"
- Do not fabricate specific facts (numbers, dates, company names) not present in context or the ABOUT section
- Never return an empty response — always say something helpful

SITE PAGES (link the right one when relevant — the UI renders them as clickable pills):
{links}
- Individual posts → /blog/[slug]; individual lab entries → /lab/[slug]"""


def topic_queries() -> dict[str, str]:
    """Extra retrieval angles per topic, using the real names in the knowledge files."""
    d = _data()
    companies = sorted({e.get("company", "").split("(")[0].split("–")[0].split(" - ")[0].strip()
                        for e in d["experience"] if e.get("company")})
    projects = [str(p.get("title", "")).split("–")[0].split("(")[0].strip() for p in d["projects"][:6]]
    schools = sorted({e.get("institution", "") for e in d["education"] if e.get("institution")})
    award = d["profile"].get("award", "")
    return {
        "experience": "work experience roles companies " + " ".join(companies),
        "projects": "projects built " + " ".join(projects),
        "education": "education degree " + " ".join(schools),
        "award": f"award achievement strengths {award}",
    }


# Words in company/school names too generic to mean "they asked about work".
_GENERIC = {
    "limited", "client", "client:", "institute", "technology", "research", "network", "center",
    "centre", "system", "systems", "high-speed", "teaching", "assistant", "school", "university",
    "college", "engineering", "science", "sciences", "genomics", "biology", "junior", "of", "the",
    "for", "and", "new", "york", "with", "inc", "llc", "corp", "pvt",
}


def topic_keywords() -> dict[str, list[str]]:
    """Lower-cased names that should trigger each topic's extra query."""
    d = _data()
    companies = [w.lower().strip(",:()") for e in d["experience"] for w in str(e.get("company", "")).replace("(", " ").split()
                 if len(w) > 2 and w.lower().strip(",:()") not in _GENERIC]
    projects = [str(p.get("title", "")).split("–")[0].split("(")[0].strip().lower() for p in d["projects"]]
    schools = [w.lower().strip(",") for e in d["education"] for w in str(e.get("institution", "")).split()
               if len(w) > 2 and w.lower().strip(",") not in _GENERIC]
    return {"experience": companies, "projects": projects, "education": schools}

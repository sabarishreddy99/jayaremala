"""Contract between the knowledge files, Avocado's knowledge base and the MCP tools.

These tests read the real data/knowledge/ files. They fail when content added
from the admin would be invisible to Avocado or MCP — a new file with no
documents, a profile block nobody ingests, a body cut short, a role linked to a
project that does not exist, a page missing from Avocado's links.
"""
from __future__ import annotations

import json
import re
from collections import Counter

import pytest

from app.agent.tools import TOOLS
from app.rag import graph, ingest, persona

DATA_DIR = ingest.DATA_DIR


@pytest.fixture(scope="module")
def docs():
    return ingest._build_documents()


def _ids(docs):
    return [d[0] for d in docs]


def test_every_knowledge_file_is_valid_json():
    for path in DATA_DIR.glob("*.json"):
        json.loads(path.read_text())  # raises with the file name in the traceback


def test_document_ids_are_unique(docs):
    dupes = [k for k, n in Counter(_ids(docs)).items() if n > 1]
    assert not dupes, f"duplicate document ids: {dupes}"


def test_every_knowledge_file_reaches_the_knowledge_base(docs):
    """Each file has a dedicated builder or is picked up by the catch-all."""
    ids = _ids(docs)
    expected_prefix = {
        "profile.json": "profile_", "experience.json": "exp_", "education.json": "edu_",
        "projects.json": "proj_", "skills.json": "skills_", "testimonials.json": "testimonial_",
        "blog.json": "blog_", "lab.json": "lab_", "case-studies.json": "case_study",
        "case-study-text.json": "case_study_", "apps.json": "app_", "quotes.json": "quote_",
        "gallery.json": "gallery_", "site.json": "site_",
    }
    for path in DATA_DIR.glob("*.json"):
        data = json.loads(path.read_text())
        if not data or path.name in {"inbox_signals.json", "drive_resume.json", "mdx-index.json"}:
            continue  # empty, or live integration data that may legitimately be absent
        prefix = expected_prefix.get(path.name, path.stem.replace("-", "_") + "_")
        assert any(i.startswith(prefix) for i in ids), f"{path.name} produced no documents"


def test_every_profile_key_is_ingested(docs):
    profile = json.loads((DATA_DIR / "profile.json").read_text())
    text = " ".join(d[1] for d in docs)
    ids = set(_ids(docs))
    for key, value in profile.items():
        if not value:
            continue
        handled = key in ingest._PROFILE_HANDLED or key.startswith("page_") or f"profile_extra_{ingest._slug(key)}" in ids
        assert handled, f"profile.{key} is not ingested"
    # The story blocks are really there, not just listed.
    for term in [o["term"] for o in profile.get("opinions", {}).get("for", [])]:
        assert term in text, f"principle {term!r} missing from the knowledge base"
    for need in profile.get("hire", {}).get("needs", []):
        assert need["metric"] in text


@pytest.mark.parametrize("filename", ["blog.json", "lab.json"])
def test_long_bodies_are_chunked_not_truncated(docs, filename):
    """Every paragraph of every post / lab entry lands in some chunk."""
    joined = " ".join(d[1] for d in docs)
    for entry in json.loads((DATA_DIR / filename).read_text()):
        paras = [p.strip() for p in re.split(r"\n\n", entry.get("content", "")) if p.strip() and not p.startswith("## ")]
        missing = [p[:60] for p in paras if p[:60] not in joined]
        assert not missing, f"{filename}:{entry['slug']} lost {len(missing)} paragraph(s), e.g. {missing[:2]}"


def test_every_document_fits_the_embedding_window(docs):
    """bge-base reads ~512 tokens (~2,000 chars); anything longer is silently cut
    for dense retrieval. Chunks stay well under; every other document under 2,000."""
    for doc_id, text, _ in docs:
        limit = 1600 if "_part_" in doc_id else 2000
        assert len(text) <= limit, f"{doc_id} is {len(text)} chars (limit {limit})"


def test_chunk_text_keeps_every_character_of_content():
    body = "## One\n\n" + ("Alpha beta gamma. " * 120) + "\n\n## Two\n\nShort tail."
    chunks = ingest.chunk_text(body)
    assert {h for h, _ in chunks} == {"One", "Two"}
    assert "Short tail." in chunks[-1][1]
    assert all(len(c) <= ingest.CHUNK_CHARS + ingest.CHUNK_OVERLAP + 10 for _, c in chunks)


def test_experience_project_links_resolve():
    projects = [p["title"] for p in json.loads((DATA_DIR / "projects.json").read_text())]
    for i, exp in enumerate(json.loads((DATA_DIR / "experience.json").read_text())):
        for name in exp.get("projects", []):
            assert graph._resolve_project(name, projects) is not None, f"experience[{i}] links unknown project {name!r}"


def test_avocado_prompt_links_every_page_and_no_dead_ones():
    prompt = persona.system_prompt()
    site = json.loads((DATA_DIR / "site.json").read_text())
    for page in site["pages"]:
        assert f"→ {page['href']}\n" in prompt + "\n", f"{page['href']} missing from Avocado's page links"
    assert "/portfolio" not in prompt


def test_avocado_prompt_comes_from_the_profile():
    profile = json.loads((DATA_DIR / "profile.json").read_text())
    prompt = persona.system_prompt()
    assert profile["name"] in prompt
    assert profile["email"] in prompt
    if profile.get("award"):
        assert profile["award"] in prompt


_NETWORK_TOOLS = {"search_knowledge", "check_availability", "get_booking_link"}
_ARGS = {"get_project": {"name": "a"}, "get_app": {"name": "a"}}


@pytest.mark.parametrize("tool", [t for t in TOOLS if t.name not in _NETWORK_TOOLS], ids=lambda t: t.name)
def test_every_offline_tool_returns_data(tool):
    if tool.name in _ARGS:
        tool.run(**_ARGS[tool.name])  # lookups may legitimately miss; they must not raise
        return
    result = tool.run()
    assert result, f"{tool.name} returned nothing"
    json.dumps(result, default=str)  # serialisable for MCP


def test_full_bodies_are_served_by_mcp():
    lab = json.loads((DATA_DIR / "lab.json").read_text())
    if lab:
        tool = next(t for t in TOOLS if t.name == "get_lab")
        entry = tool.run(slug=lab[0]["slug"])
        assert entry["content"] == lab[0]["content"]


def test_tool_names_are_unique():
    names = [t.name for t in TOOLS]
    assert len(names) == len(set(names))

"""Live edits to repo-backed (MDX) posts and lab entries are refused.

Those rows are re-synced from the MDX files on every deploy and their pages
render the MDX, so a live edit would be invisible on the site and then lost.
"""
from __future__ import annotations

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.routers import admin as admin_router
from app.routers import content as content_router


@pytest.fixture
def client(monkeypatch):
    rows = {
        "mdx-post": {"slug": "mdx-post", "source": "mdx"},
        "api-post": {"slug": "api-post", "source": "api"},
    }
    calls: list[str] = []
    db = content_router.content_db
    monkeypatch.setattr(db, "get_blog_post", lambda slug: rows.get(slug))
    monkeypatch.setattr(db, "get_lab_entry", lambda slug: rows.get(slug))
    monkeypatch.setattr(db, "update_blog_post", lambda slug, data: calls.append(f"update:{slug}") or {"slug": slug})
    monkeypatch.setattr(db, "update_lab_entry", lambda slug, data: calls.append(f"update-lab:{slug}") or {"slug": slug})
    monkeypatch.setattr(db, "delete_blog_post", lambda slug: calls.append(f"delete:{slug}") or True)
    monkeypatch.setattr(db, "regenerate_blog_json", lambda: None)
    monkeypatch.setattr(content_router, "remove_entity_docs", lambda *_: None)
    monkeypatch.setattr(content_router, "_sync_blog_to_rag", lambda: None)
    monkeypatch.setattr(content_router, "_sync_lab_to_rag", lambda: None)
    monkeypatch.setattr(content_router, "_rag_sync_after_delete", lambda: None)
    monkeypatch.setattr(content_router, "_cleanup_blog_analytics", lambda *_: None)

    app = FastAPI()
    app.include_router(content_router.router)
    app.dependency_overrides[admin_router._require_token] = lambda: None
    c = TestClient(app)
    c.calls = calls  # type: ignore[attr-defined]
    return c


POST = {"slug": "x", "title": "T", "content": "body"}
LAB = {"slug": "x", "title": "T"}


def test_editing_an_mdx_post_is_refused(client):
    r = client.put("/content/blog/mdx-post", json=POST)
    assert r.status_code == 409
    assert "Write a blog post" in r.json()["detail"]
    assert client.calls == []


def test_deleting_an_mdx_post_is_refused(client):
    assert client.delete("/content/blog/mdx-post").status_code == 409
    assert client.calls == []


def test_editing_an_mdx_lab_entry_is_refused(client):
    r = client.put("/content/lab/mdx-post", json=LAB)
    assert r.status_code == 409
    assert "Write a lab update" in r.json()["detail"]


def test_api_posts_are_still_editable(client):
    assert client.put("/content/blog/api-post", json=POST).status_code == 200
    assert client.delete("/content/blog/api-post").status_code == 204
    assert client.calls == ["update:api-post", "delete:api-post"]

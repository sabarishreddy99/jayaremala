"""Which rows the deploy-time sync takes from MDX.

blog.json is regenerated from the database, so after the first ingest it also
lists live-created posts. Only slugs in mdx-index.json (files that really exist
in the repo) may be synced from it; everything else stays live.
"""
from __future__ import annotations

import json

import pytest

from app.db import content as content_db


@pytest.fixture
def store(tmp_path, monkeypatch):
    monkeypatch.setattr(content_db, "_db_path", lambda: tmp_path / "content.db")
    monkeypatch.setattr(content_db, "_DATA_DIR", tmp_path)
    (tmp_path / "blog.json").write_text("[]")
    (tmp_path / "lab.json").write_text("[]")
    (tmp_path / "quotes.json").write_text("[]")
    content_db.init_db()
    return tmp_path


def _post(slug, content):
    return {"slug": slug, "title": slug.title(), "date": "2026-01-01", "description": "", "tags": [], "content": content}


def test_live_posts_listed_in_blog_json_stay_live(store):
    content_db.create_blog_post({**_post("live-one", "written in the admin"), "published_at": "2026-01-01"})
    (store / "blog.json").write_text(json.dumps([_post("live-one", "stale copy"), _post("from-mdx", "file body")]))
    (store / "mdx-index.json").write_text(json.dumps({"blog": ["from-mdx"], "lab": []}))

    content_db.sync_blog_json_to_db()

    live = content_db.get_blog_post("live-one")
    assert live["source"] == "api"
    assert live["content"] == "written in the admin"
    mdx = content_db.get_blog_post("from-mdx")
    assert mdx["source"] == "mdx"
    assert mdx["content"] == "file body"


def test_a_file_added_for_a_live_slug_takes_it_over(store):
    content_db.create_blog_post({**_post("promoted", "live text"), "published_at": "2026-01-01"})
    (store / "blog.json").write_text(json.dumps([_post("promoted", "now from the file")]))
    (store / "mdx-index.json").write_text(json.dumps({"blog": ["promoted"], "lab": []}))

    content_db.sync_blog_json_to_db()

    row = content_db.get_blog_post("promoted")
    assert row["source"] == "mdx"
    assert row["content"] == "now from the file"


def test_full_body_is_kept(store):
    body = "word " * 5000
    (store / "blog.json").write_text(json.dumps([_post("long", body)]))
    (store / "mdx-index.json").write_text(json.dumps({"blog": ["long"], "lab": []}))
    content_db.sync_blog_json_to_db()
    assert content_db.get_blog_post("long")["content"] == body

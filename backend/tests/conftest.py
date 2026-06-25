"""Pytest setup: put `src/` on the path and point gradeVITian at a temp DB
before the settings singleton is created."""
import os
import sys
import tempfile
from pathlib import Path

import pytest

SRC = Path(__file__).resolve().parents[1] / "src"
sys.path.insert(0, str(SRC))

# Must be set before `app.core.settings` is first imported.
_tmp = tempfile.mkdtemp(prefix="gv_test_")
os.environ.setdefault("GV_DB_PATH", str(Path(_tmp) / "gradevitian.db"))
os.environ.setdefault("GV_JWT_SECRET", "test-secret-please-ignore")


@pytest.fixture(autouse=True)
def _no_external_calls(monkeypatch, tmp_path):
    """Keep tests offline & deterministic: no real email, no real LLM moderation calls
    (even though .env may carry live API keys locally).

    Each test also gets a fresh, isolated SQLite DB via tmp_path so that legacy-comment
    seeding and data written by other tests never bleed across test boundaries.
    """
    import app.integrations.gmail as gmail
    import app.core.gv_moderation as moderation
    import app.db.gradevitian as gv_mod

    # Fresh DB per test — override the path resolver so every call inside the module
    # sees a unique file that is torn down automatically with tmp_path.
    test_db = tmp_path / "gradevitian.db"
    monkeypatch.setattr(gv_mod, "_db_path", lambda: test_db)
    # No-op legacy seed so the comment table starts empty in every test.
    monkeypatch.setattr(gv_mod, "seed_legacy_comments", lambda: 0)

    monkeypatch.setattr(gmail, "send_gradevitian_email", lambda *a, **k: None)
    monkeypatch.setattr(moderation, "llm_classify", lambda *a, **k: None)

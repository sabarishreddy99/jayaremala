"""Pytest setup: put `src/` on the path and point gradeVITian at a temp DB
before the settings singleton is created."""
import os
import sys
import tempfile
from pathlib import Path

SRC = Path(__file__).resolve().parents[1] / "src"
sys.path.insert(0, str(SRC))

# Must be set before `app.core.settings` is first imported.
_tmp = tempfile.mkdtemp(prefix="gv_test_")
os.environ.setdefault("GV_DB_PATH", str(Path(_tmp) / "gradevitian.db"))
os.environ.setdefault("GV_JWT_SECRET", "test-secret-please-ignore")

"""End-to-end tests for the gradeVITian router against a minimal app instance.

Builds a fresh FastAPI app with only the gradevitian router + limiter wiring so the
heavy portfolio lifespan (RAG ingest, MCP) isn't triggered. Email sending is
best-effort and no-ops in tests (Gmail isn't connected).
"""
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.gv_auth import hash_reset_token
from app.core.limiter import limiter
from app.db import gradevitian as gv
from app.routers.gradevitian import router as gv_router


@pytest.fixture()
def client():
    gv.init_db()
    app = FastAPI()
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)
    app.include_router(gv_router)
    return TestClient(app)


def _signup(client, suffix=""):
    return client.post("/gv/auth/signup", json={
        "name": f"Test User{suffix}",
        "email": f"test{suffix}@example.com",
        "username": f"testuser{suffix}",
        "password": "secret123",
    })


def test_signup_login_me(client):
    r = _signup(client, "1")
    assert r.status_code == 200, r.text
    token = r.json()["token"]
    assert r.json()["user"]["username"] == "testuser1"
    assert "pwd_hash" not in r.json()["user"]

    # login by username
    r = client.post("/gv/auth/login", json={"identifier": "testuser1", "password": "secret123"})
    assert r.status_code == 200
    token = r.json()["token"]

    r = client.get("/gv/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["user"]["email"] == "test1@example.com"


def test_duplicate_signup_rejected(client):
    assert _signup(client, "2").status_code == 200
    assert _signup(client, "2").status_code == 409


def test_bad_login(client):
    _signup(client, "3")
    r = client.post("/gv/auth/login", json={"identifier": "testuser3", "password": "wrong"})
    assert r.status_code == 401


def test_me_requires_auth(client):
    assert client.get("/gv/auth/me").status_code == 401
    assert client.get("/gv/auth/me", headers={"Authorization": "Bearer garbage"}).status_code == 401


def test_save_and_list_calcs(client):
    token = _signup(client, "4").json()["token"]
    h = {"Authorization": f"Bearer {token}"}
    r = client.post("/gv/calcs", json={
        "calc_type": "gpa", "payload": {"courses": 3}, "result": "GPA is 9.0",
    }, headers=h)
    assert r.status_code == 200
    calc_id = r.json()["calc"]["id"]

    r = client.get("/gv/calcs", headers=h)
    assert r.status_code == 200
    assert len(r.json()["calcs"]) == 1
    assert r.json()["calcs"][0]["payload"] == {"courses": 3}

    assert client.delete(f"/gv/calcs/{calc_id}", headers=h).status_code == 200
    assert client.get("/gv/calcs", headers=h).json()["calcs"] == []


def test_calc_state_persists(client):
    token = _signup(client, "cs").json()["token"]
    h = {"Authorization": f"Bearer {token}"}

    # Nothing saved yet
    assert client.get("/gv/calc-state/gpa", headers=h).json()["payload"] is None

    # Save a list payload (GPA courses) and a dict payload (estimator)
    courses = [{"grade": "S", "credits": 4}, {"grade": "A", "credits": 3}]
    assert client.put("/gv/calc-state/gpa", json={"payload": courses}, headers=h).status_code == 200
    assert client.put("/gv/calc-state/cgpa_estimator", json={"payload": {"target": "9"}}, headers=h).status_code == 200

    # Read back individually and in bulk
    assert client.get("/gv/calc-state/gpa", headers=h).json()["payload"] == courses
    states = client.get("/gv/calc-state", headers=h).json()["states"]
    assert states["gpa"] == courses
    assert states["cgpa_estimator"] == {"target": "9"}

    # Upsert overwrites
    client.put("/gv/calc-state/gpa", json={"payload": []}, headers=h)
    assert client.get("/gv/calc-state/gpa", headers=h).json()["payload"] == []

    # Requires auth
    assert client.get("/gv/calc-state/gpa").status_code == 401


def test_traffic_counters(client):
    base = client.get("/gv/stats").json()
    # page loads count every call (reloads included)
    assert client.post("/gv/page-load").json()["page_loads"] == base["page_loads"] + 1
    assert client.post("/gv/page-load").json()["page_loads"] == base["page_loads"] + 2
    # visits are a separate counter
    assert client.post("/gv/visit").json()["visits"] == base["visits"] + 1
    stats = client.get("/gv/stats").json()
    assert stats["page_loads"] == base["page_loads"] + 2
    assert stats["visits"] == base["visits"] + 1


def test_refer(client):
    # Email sending is mocked (see conftest), so `sent` is True without real mail.
    r = client.post("/gv/refer", json={"email": "friend@example.com"})
    assert r.status_code == 200
    assert r.json() == {"ok": True, "sent": True}
    # invalid email rejected by validation
    assert client.post("/gv/refer", json={"email": "not-an-email"}).status_code == 422


def test_comment_moderation(client):
    # clean comment publishes and shows up
    r = client.post("/gv/comments", json={"name": "Anon", "body": "This is genuinely useful, thanks!"})
    assert r.json()["published"] is True
    assert any(c["body"].startswith("This is genuinely useful") for c in client.get("/gv/comments").json()["comments"])

    # honest negative feedback is NOT blocked
    r = client.post("/gv/comments", json={"name": "Anon", "body": "The UI is confusing and slow, please fix it."})
    assert r.json()["published"] is True

    # abuse is blocked — held back, never shown publicly
    r = client.post("/gv/comments", json={"name": "Troll", "body": "you are a f*cking idiot"})
    assert r.json()["published"] is False
    assert r.json()["comment"] is None
    assert not any("idiot" in c["body"] for c in client.get("/gv/comments").json()["comments"])

    # spam (link) is held for review, not shown
    r = client.post("/gv/comments", json={"name": "Spam", "body": "buy cheap stuff at spam.shop now"})
    assert r.json()["published"] is False


def test_comment_moderation_unit():
    from app.core.gv_moderation import classify
    assert classify("a", "great tool")[0] == "approved"
    assert classify("a", "this is bad and slow")[0] == "approved"   # negative ≠ blocked
    assert classify("a", "f u c k this")[0] == "rejected"            # spaced obfuscation
    assert classify("a", "sh1t")[0] == "rejected"                    # leet
    assert classify("a", "check http://evil.example")[0] == "pending"
    assert classify("a", "my assignment in class")[0] == "approved"  # no Scunthorpe false-positive


def test_moderate_llm_escalation(monkeypatch):
    import app.core.gv_moderation as mod
    # LLM catches nuanced abuse with no banned words → rejected
    monkeypatch.setattr(mod, "llm_classify", lambda n, b: "toxic")
    assert mod.moderate("a", "you are worthless and should quit")[0] == "rejected"
    # LLM spam on otherwise-clean → held for review
    monkeypatch.setattr(mod, "llm_classify", lambda n, b: "spam")
    assert mod.moderate("a", "amazing product")[0] == "pending"
    # LLM ok → honest criticism stays published
    monkeypatch.setattr(mod, "llm_classify", lambda n, b: "ok")
    assert mod.moderate("a", "the app feels slow and clunky")[0] == "approved"
    # LLM can't weaken a keyword block
    monkeypatch.setattr(mod, "llm_classify", lambda n, b: "ok")
    assert mod.moderate("a", "fuck this")[0] == "rejected"


def test_comments_public(client):
    r = client.post("/gv/comments", json={"name": "Anon", "body": "Great tool!"})
    assert r.status_code == 200
    r = client.get("/gv/comments")
    assert any(c["body"] == "Great tool!" for c in r.json()["comments"])


def test_password_reset_flow(client):
    _signup(client, "5")
    # forgot-password always 200, even for unknown emails
    assert client.post("/gv/auth/forgot-password", json={"email": "test5@example.com"}).status_code == 200
    assert client.post("/gv/auth/forgot-password", json={"email": "nobody@example.com"}).status_code == 200

    # Simulate the emailed token by minting + storing one directly.
    from app.core.gv_auth import new_reset_token
    raw, token_hash = new_reset_token()
    record = gv.get_user_by_login("test5@example.com")
    gv.create_password_reset(record["id"], token_hash, "2999-01-01 00:00:00")

    r = client.post("/gv/auth/reset-password", json={"token": raw, "password": "newpass123"})
    assert r.status_code == 200
    # old password no longer works, new one does
    assert client.post("/gv/auth/login", json={"identifier": "testuser5", "password": "secret123"}).status_code == 401
    assert client.post("/gv/auth/login", json={"identifier": "testuser5", "password": "newpass123"}).status_code == 200
    # token can't be reused
    assert client.post("/gv/auth/reset-password", json={"token": raw, "password": "again123"}).status_code == 400


def test_reset_token_hash_helper():
    raw, h = __import__("app.core.gv_auth", fromlist=["new_reset_token"]).new_reset_token()
    assert hash_reset_token(raw) == h


def test_get_admin_metrics_aggregates():
    gv.init_db()
    u1 = gv.create_user("Alice A", "alice@example.com", "alice", "h1")
    u2 = gv.create_user("Bob B", "bob@example.com", "bob", "h2")

    gv.save_calc(u1["id"], "gpa", {"x": 1}, "8.5")
    gv.save_calc(u1["id"], "gpa", {"x": 2}, "9.0")
    gv.save_calc(u2["id"], "attendance", {"x": 3}, "82%")

    gv.add_comment("Alice A", "great app", u1["id"], "approved", "")
    gv.add_comment("Spammer", "buy now", None, "rejected", "spam")
    gv.add_comment("Cara", "hmm", None, "pending", "")

    gv.award_badge(u1["id"], "first_calc")
    gv.bump_streak(u1["id"])
    gv.record_page_load()
    gv.record_visit()
    gv.record_visit()

    m = gv.get_admin_metrics()

    assert m["users"]["total"] == 2
    assert m["users"]["new_7d"] == 2
    assert m["users"]["new_30d"] == 2
    assert len(m["users"]["recent"]) == 2
    assert m["users"]["recent"][0]["username"] == "bob"  # newest first
    assert set(m["users"]["recent"][0].keys()) == {"name", "username", "email", "created_at"}

    assert m["saved_calcs"]["total"] == 3
    by_type = {row["calc_type"]: row["count"] for row in m["saved_calcs"]["by_type"]}
    assert by_type == {"gpa": 2, "attendance": 1}

    assert m["comments"] == {"approved": 1, "pending": 1, "rejected": 1, "total": 3}

    assert m["engagement"]["page_loads"] == 1
    assert m["engagement"]["visits"] == 2
    assert m["engagement"]["active_streaks"] == 1
    assert m["engagement"]["longest_streak"] >= 1
    assert m["engagement"]["badges_total"] == 3
    badge_counts = {row["badge"]: row["count"] for row in m["engagement"]["badges_by_type"]}
    assert badge_counts == {"first_gpa": 1, "first_attendance": 1, "first_calc": 1}


def test_admin_metrics_endpoint_requires_token(client, monkeypatch):
    from app.core.settings import settings
    monkeypatch.setattr(settings, "admin_token", "sekret", raising=False)

    # no token → 401
    assert client.get("/gv/admin/metrics").status_code == 401
    # wrong token → 401
    assert client.get("/gv/admin/metrics",
                      headers={"Authorization": "Bearer nope"}).status_code == 401
    # correct token → 200 with expected top-level keys
    r = client.get("/gv/admin/metrics", headers={"Authorization": "Bearer sekret"})
    assert r.status_code == 200, r.text
    body = r.json()
    assert set(body.keys()) == {"users", "saved_calcs", "comments", "engagement"}


def test_admin_metrics_endpoint_disabled_without_admin_token(client, monkeypatch):
    # No ADMIN_TOKEN configured → the endpoint is disabled and fails closed (403),
    # so the PII it returns (user names + emails) can never be served unguarded.
    from app.core.settings import settings
    monkeypatch.setattr(settings, "admin_token", "", raising=False)
    assert client.get("/gv/admin/metrics",
                      headers={"Authorization": "Bearer anything"}).status_code == 403

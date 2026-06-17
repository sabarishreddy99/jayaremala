"""gradeVITian API — accounts, saved calculations, feedback comments, notifications.

Auth uses Bearer tokens (see core/gv_auth.py). All calculator math runs client-side;
this router only persists saved results and the social layer.
"""
from __future__ import annotations

import logging
import re
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field

from app.core.gv_auth import (
    create_token,
    current_user,
    hash_password,
    hash_reset_token,
    new_reset_token,
    optional_user,
    verify_password,
)
from app.core.limiter import limiter
from app.db import gradevitian as gv

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/gv", tags=["gradevitian"])

_USERNAME_RE = re.compile(r"^[a-zA-Z0-9._@]+$")


# ── Schemas ───────────────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    username: str = Field(min_length=3, max_length=40)
    password: str = Field(min_length=6, max_length=200)


class LoginRequest(BaseModel):
    identifier: str = Field(min_length=1)  # email or username
    password: str = Field(min_length=1)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=8)
    password: str = Field(min_length=6, max_length=200)


class SaveCalcRequest(BaseModel):
    calc_type: str = Field(min_length=1, max_length=40)
    payload: dict = Field(default_factory=dict)
    result: str = Field(default="", max_length=2000)


class CommentRequest(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    body: str = Field(min_length=1, max_length=1000)


class CalcStateRequest(BaseModel):
    payload: Any  # dict or list of the calculator's current field values


class ReferRequest(BaseModel):
    email: EmailStr


# ── Auth ──────────────────────────────────────────────────────────────────────

@router.post("/auth/signup")
@limiter.limit("10/hour")
def signup(body: SignupRequest, request: Request) -> dict:
    if not _USERNAME_RE.match(body.username):
        raise HTTPException(status_code=400, detail="Username may only contain letters, numbers, . _ @")
    if gv.email_or_username_taken(body.email, body.username):
        raise HTTPException(status_code=409, detail="That email or username is already registered.")

    user = gv.create_user(
        name=body.name.strip(),
        email=str(body.email).lower(),
        username=body.username,
        pwd_hash=hash_password(body.password),
    )
    _send_welcome_email(user)
    return {"token": create_token(user["id"]), "user": user}


@router.post("/auth/login")
@limiter.limit("20/hour")
def login(body: LoginRequest, request: Request) -> dict:
    record = gv.get_user_by_login(body.identifier)
    if not record or not verify_password(body.password, record["pwd_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect login credentials.")
    user = gv.get_user_by_id(record["id"])
    return {"token": create_token(record["id"]), "user": user}


@router.get("/auth/me")
def me(user: dict = Depends(current_user)) -> dict:
    return {"user": user}


@router.post("/auth/forgot-password")
@limiter.limit("5/hour")
def forgot_password(body: ForgotPasswordRequest, request: Request) -> dict:
    # Always succeed regardless of whether the email exists (no account enumeration).
    record = gv.get_user_by_login(str(body.email))
    if record:
        raw, token_hash = new_reset_token()
        expires = (datetime.now(timezone.utc) + timedelta(hours=1)).strftime("%Y-%m-%d %H:%M:%S")
        gv.create_password_reset(record["id"], token_hash, expires)
        _send_reset_email(record["email"], record["name"], raw)
    return {"ok": True}


@router.post("/auth/reset-password")
@limiter.limit("10/hour")
def reset_password(body: ResetPasswordRequest, request: Request) -> dict:
    user_id = gv.consume_password_reset(hash_reset_token(body.token))
    if user_id is None:
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired.")
    gv.set_user_password(user_id, hash_password(body.password))
    return {"ok": True}


# ── Saved calculations ─────────────────────────────────────────────────────────

@router.get("/calcs")
def list_calcs(user: dict = Depends(current_user)) -> dict:
    return {"calcs": gv.list_calcs(user["id"])}


@router.post("/calcs")
def save_calc(body: SaveCalcRequest, user: dict = Depends(current_user)) -> dict:
    return {"calc": gv.save_calc(user["id"], body.calc_type, body.payload, body.result)}


@router.delete("/calcs/{calc_id}")
def delete_calc(calc_id: int, user: dict = Depends(current_user)) -> dict:
    if not gv.delete_calc(user["id"], calc_id):
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


# ── Live calculator form state (autosave per user) ───────────────────────────

@router.get("/calc-state")
def all_calc_state(user: dict = Depends(current_user)) -> dict:
    """All autosaved calculator field values for the user, keyed by calc_type."""
    return {"states": gv.get_all_calc_states(user["id"])}


@router.get("/calc-state/{calc_type}")
def get_calc_state(calc_type: str, user: dict = Depends(current_user)) -> dict:
    return {"payload": gv.get_calc_state(user["id"], calc_type)}


@router.put("/calc-state/{calc_type}")
def put_calc_state(calc_type: str, body: CalcStateRequest, user: dict = Depends(current_user)) -> dict:
    gv.set_calc_state(user["id"], calc_type, body.payload)
    return {"ok": True}


# ── Traffic counters ─────────────────────────────────────────────────────────
# page_loads: every load/reload · visits: one per browser session (gated client-side).

@router.post("/page-load")
def record_page_load() -> dict:
    return {"page_loads": gv.record_page_load()}


@router.post("/visit")
def record_visit() -> dict:
    return {"visits": gv.record_visit()}


@router.get("/stats")
def gv_stats() -> dict:
    return gv.get_counts()


# ── Refer a fellow VITian (email invite) ─────────────────────────────────────

@router.post("/refer")
@limiter.limit("5/hour")
def refer(body: ReferRequest, request: Request) -> dict:
    """Email a gradeVITian invite to a friend. Best-effort; `sent` reports whether the
    email actually went out (false if Gmail isn't connected)."""
    return {"ok": True, "sent": _send_referral_email(str(body.email))}


# ── Comments (feedback wall) ─────────────────────────────────────────────────

@router.get("/comments")
def list_comments() -> dict:
    return {"comments": gv.list_comments()}


@router.post("/comments")
@limiter.limit("15/hour")
def add_comment(body: CommentRequest, request: Request, user: dict | None = Depends(optional_user)) -> dict:
    name = user["name"] if user else body.name.strip()
    return {"comment": gv.add_comment(name, body.body.strip(), user["id"] if user else None)}


# ── Notifications ────────────────────────────────────────────────────────────

@router.get("/notifications")
def list_notifications(user: dict = Depends(current_user)) -> dict:
    return {"notifications": gv.list_notifications(user["id"])}


@router.post("/notifications/{notification_id}/read")
def read_notification(notification_id: int, user: dict = Depends(current_user)) -> dict:
    gv.mark_notification_read(user["id"], notification_id)
    return {"ok": True}


# ── Email helpers (best-effort; failures never block the request) ──────────────

def _send_welcome_email(user: dict) -> None:
    try:
        from app.integrations.gmail import send_gradevitian_email
        send_gradevitian_email(
            user["email"],
            "Welcome to gradeVITian — Happy Learning!",
            _WELCOME_HTML.format(name=user["name"]),
        )
    except Exception as exc:
        logger.warning("welcome email skipped: %s", exc)


def _send_referral_email(email: str) -> bool:
    try:
        from app.core.settings import settings
        from app.integrations.gmail import send_gradevitian_email
        send_gradevitian_email(
            email,
            "A fellow VITian thinks you'll love gradeVITian 🎓",
            _REFER_HTML.format(url=settings.gv_base_url.rstrip("/")),
        )
        return True
    except Exception as exc:
        logger.warning("referral email skipped: %s", exc)
        return False


def _send_reset_email(email: str, name: str, raw_token: str) -> None:
    try:
        from app.integrations.gmail import send_gradevitian_email
        from app.core.settings import settings
        link = f"{settings.gv_base_url.rstrip('/')}/reset-password/?token={raw_token}"
        send_gradevitian_email(
            email,
            "Reset your gradeVITian password",
            _RESET_HTML.format(name=name, link=link),
        )
    except Exception as exc:
        logger.warning("reset email skipped: %s", exc)


_WELCOME_HTML = """\
<div style="font-family:system-ui,Segoe UI,Roboto,sans-serif;max-width:560px;margin:auto">
  <h2 style="color:#4f46e5">Welcome to gradeVITian, {name}!</h2>
  <p>Your account is ready. You can now save your GPA, CGPA, attendance and grade
  calculations and pick up where you left off on any device.</p>
  <p style="color:#6b7280">Happy Learning!<br/>— Sabarish</p>
</div>
"""

_REFER_HTML = """\
<div style="font-family:system-ui,Segoe UI,Roboto,sans-serif;max-width:560px;margin:auto">
  <h2 style="color:#4f46e5">You've been invited to gradeVITian 🎓</h2>
  <p>A fellow VITian thought you'd find this useful. <strong>gradeVITian</strong> is a free
  set of tools to compute your GPA &amp; CGPA, predict grades, estimate the GPA you need,
  and track attendance — fast and mobile-friendly.</p>
  <p><a href="{url}" style="background:#4f46e5;color:#fff;padding:10px 18px;
  border-radius:8px;text-decoration:none">Try gradeVITian</a></p>
  <p style="color:#6b7280;font-size:13px">Happy Learning! — gradeVITian</p>
</div>
"""

_RESET_HTML = """\
<div style="font-family:system-ui,Segoe UI,Roboto,sans-serif;max-width:560px;margin:auto">
  <h2 style="color:#4f46e5">Reset your password</h2>
  <p>Hi {name}, we received a request to reset your gradeVITian password.
  This link expires in 1 hour.</p>
  <p><a href="{link}" style="background:#4f46e5;color:#fff;padding:10px 18px;
  border-radius:8px;text-decoration:none">Reset password</a></p>
  <p style="color:#6b7280;font-size:13px">If you didn't request this, you can ignore this email.</p>
</div>
"""

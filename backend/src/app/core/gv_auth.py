"""gradeVITian auth — stdlib only (no pyjwt/bcrypt dependency).

Passwords: scrypt with a per-user random salt, stored as `scrypt$<salt_hex>$<hash_hex>`.
Tokens: compact HMAC-SHA256 signed payload `<b64(json)>.<b64(sig)>`, JWT-like but
minimal. Both use `hashlib`/`hmac` from the standard library.
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import logging
import secrets
import time

from fastapi import Header, HTTPException

logger = logging.getLogger(__name__)

_SCRYPT_N = 2**14
_SCRYPT_R = 8
_SCRYPT_P = 1
_DKLEN = 32
TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30  # 30 days


# ── Password hashing ──────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    dk = hashlib.scrypt(
        password.encode(), salt=salt, n=_SCRYPT_N, r=_SCRYPT_R, p=_SCRYPT_P, dklen=_DKLEN
    )
    return f"scrypt${salt.hex()}${dk.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        scheme, salt_hex, hash_hex = stored.split("$")
        if scheme != "scrypt":
            return False
        dk = hashlib.scrypt(
            password.encode(), salt=bytes.fromhex(salt_hex),
            n=_SCRYPT_N, r=_SCRYPT_R, p=_SCRYPT_P, dklen=_DKLEN,
        )
        return hmac.compare_digest(dk.hex(), hash_hex)
    except Exception:
        return False


# ── Tokens ────────────────────────────────────────────────────────────────────

def _secret() -> bytes:
    from app.core.settings import settings
    # Fall back to a process-stable random secret if unset (dev only); logging warns.
    sec = settings.gv_jwt_secret
    if not sec:
        logger.warning("GV_JWT_SECRET is unset — using an ephemeral dev secret; tokens reset on restart.")
        sec = _DEV_SECRET
    return sec.encode()


_DEV_SECRET = secrets.token_hex(32)


def _b64e(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()


def _b64d(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def create_token(user_id: int) -> str:
    payload = {"uid": user_id, "exp": int(time.time()) + TOKEN_TTL_SECONDS}
    body = _b64e(json.dumps(payload, separators=(",", ":")).encode())
    sig = hmac.new(_secret(), body.encode(), hashlib.sha256).digest()
    return f"{body}.{_b64e(sig)}"


def verify_token(token: str) -> int | None:
    """Return the user_id if the token is valid and unexpired, else None."""
    try:
        body, sig = token.split(".")
        expected = hmac.new(_secret(), body.encode(), hashlib.sha256).digest()
        if not hmac.compare_digest(_b64d(sig), expected):
            return None
        payload = json.loads(_b64d(body))
        if payload.get("exp", 0) < time.time():
            return None
        return int(payload["uid"])
    except Exception:
        return None


# ── Random tokens for password reset ────────────────────────────────────────

def new_reset_token() -> tuple[str, str]:
    """Return (raw_token, sha256_hash). Email the raw token; store only the hash."""
    raw = secrets.token_urlsafe(32)
    return raw, hashlib.sha256(raw.encode()).hexdigest()


def hash_reset_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


# ── FastAPI dependencies ──────────────────────────────────────────────────────

def _user_from_header(authorization: str | None) -> dict | None:
    if not authorization or not authorization.lower().startswith("bearer "):
        return None
    token = authorization[7:].strip()
    uid = verify_token(token)
    if uid is None:
        return None
    from app.db import gradevitian
    return gradevitian.get_user_by_id(uid)


def current_user(authorization: str | None = Header(default=None)) -> dict:
    user = _user_from_header(authorization)
    if user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


def optional_user(authorization: str | None = Header(default=None)) -> dict | None:
    return _user_from_header(authorization)

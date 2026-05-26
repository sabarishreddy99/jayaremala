from __future__ import annotations

import logging

import httpx
from fastapi import APIRouter, BackgroundTasks, Header, HTTPException, Request
from pydantic import BaseModel

from app.core.settings import settings
from app.db import analytics, blog_stats

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/stats", tags=["stats"])

_PERIODS = ["week", "month", "year", "all"]
_ADMIN_PERIODS = ["week", "month", "all"]


# ── Geo helper (runs as background task) ──────────────────────────────────────

async def _geo_update(table: str, row_id: int, ip: str) -> None:
    from app.db.analytics import _PRIVATE_IP_PREFIXES
    if not ip or ip in ("unknown", "localhost") or any(ip.startswith(p) for p in _PRIVATE_IP_PREFIXES):
        return
    try:
        async with httpx.AsyncClient(timeout=2.5) as client:
            r = await client.get(
                f"http://ip-api.com/json/{ip}",
                params={"fields": "status,country,city"},
            )
            data = r.json()
            if data.get("status") == "success":
                analytics.update_visit_geo(table, row_id, data.get("country", ""), data.get("city", ""))
    except Exception:
        pass


# ── Public endpoints ──────────────────────────────────────────────────────────

class ExperienceRatingIn(BaseModel):
    rating: int


class VisitIn(BaseModel):
    page: str = "/"


@router.get("")
def get_stats() -> dict[str, int]:
    return analytics.get_stats()


@router.get("/overview")
def get_overview() -> dict:
    return {
        "site": {p: analytics.get_stats(p) for p in _PERIODS},
        "blog": {p: blog_stats.get_summary(p) for p in _PERIODS},
    }


@router.post("/visit", status_code=204)
async def record_visit(
    request: Request,
    background_tasks: BackgroundTasks,
    body: VisitIn | None = None,
) -> None:
    ip = (
        request.headers.get("x-forwarded-for", "").split(",")[0].strip()
        or request.headers.get("x-real-ip", "").strip()
        or (request.client.host if request.client else "unknown")
    )
    # Prefer the stable per-device UUID sent by the frontend (localStorage).
    # This counts devices individually even when they share a public IP (same WiFi/NAT).
    identifier = request.headers.get("x-visitor-id", "").strip() or ip
    page = body.page if body else "/"
    row_id = analytics.record_site_visit(identifier, page)
    if row_id:
        background_tasks.add_task(_geo_update, "site_visits", row_id, ip)


@router.post("/experience-rating", status_code=204)
def post_experience_rating(body: ExperienceRatingIn) -> None:
    if not 1 <= body.rating <= 5:
        raise HTTPException(status_code=422, detail="Rating must be between 1 and 5")
    analytics.record_experience_rating(body.rating)


# ── Admin endpoint ────────────────────────────────────────────────────────────

@router.get("/admin")
def get_admin_stats(authorization: str = Header(default="")) -> dict:
    if not settings.admin_token:
        raise HTTPException(status_code=403, detail="Admin access not configured — set ADMIN_TOKEN env var")
    token = authorization.removeprefix("Bearer ").strip()
    if token != settings.admin_token:
        raise HTTPException(status_code=403, detail="Invalid token")

    p = _ADMIN_PERIODS
    return {
        "conversations":  {x: analytics.get_stats(x) for x in p},
        "feedback":       {x: analytics.get_feedback_summary(x) for x in p},
        "top_questions":  {x: analytics.get_top_questions(15, x) for x in p},
        "experience":     {x: analytics.get_experience_rating_summary(x) for x in p},
        "blog":           blog_stats.get_summary(),
        "site_visitors":  {x: analytics.get_site_visitor_stats(x) for x in p},
        "blog_engagement":{x: blog_stats.get_blog_engagement_stats(x) for x in p},
        "location": {
            "site": {x: analytics.get_location_stats("site_visits", x) for x in p},
            "chat": {x: analytics.get_location_stats("interactions", x) for x in p},
        },
        "pages": {x: analytics.get_page_stats(x) for x in p},
    }

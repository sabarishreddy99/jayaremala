from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from app.db import analytics, blog_stats
from app.core.settings import settings

router = APIRouter(prefix="/stats", tags=["stats"])


class ExperienceRatingIn(BaseModel):
    rating: int

_PERIODS = ["week", "month", "year", "all"]


@router.get("")
def get_stats() -> dict[str, int]:
    return analytics.get_stats()


@router.get("/overview")
def get_overview() -> dict:
    return {
        "site": {p: analytics.get_stats(p) for p in _PERIODS},
        "blog": {p: blog_stats.get_summary(p) for p in _PERIODS},
    }


@router.post("/experience-rating", status_code=204)
def post_experience_rating(body: ExperienceRatingIn) -> None:
    if not 1 <= body.rating <= 5:
        raise HTTPException(status_code=422, detail="Rating must be between 1 and 5")
    analytics.record_experience_rating(body.rating)


@router.get("/admin")
def get_admin_stats(authorization: str = Header(default="")) -> dict:
    if not settings.admin_token:
        raise HTTPException(status_code=403, detail="Admin access not configured — set ADMIN_TOKEN env var")
    token = authorization.removeprefix("Bearer ").strip()
    if token != settings.admin_token:
        raise HTTPException(status_code=403, detail="Invalid token")
    return {
        "conversations": {p: analytics.get_stats(p) for p in ["week", "month", "all"]},
        "feedback": analytics.get_feedback_summary(),
        "top_questions": analytics.get_top_questions(15),
        "blog": blog_stats.get_summary(),
        "experience": analytics.get_experience_rating_summary(),
    }

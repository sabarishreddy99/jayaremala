from fastapi import APIRouter
from app.db import analytics, blog_stats

router = APIRouter(prefix="/stats", tags=["stats"])

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

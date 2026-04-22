from fastapi import APIRouter
from app.db import analytics

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("")
def get_stats() -> dict[str, int]:
    return analytics.get_stats()

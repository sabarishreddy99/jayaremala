"""Google Calendar integration — real-time free/busy slot injection for Avocado."""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

logger = logging.getLogger(__name__)

# Working hours (9 AM – 6 PM) in the configured calendar timezone
WORK_HOUR_START = 9
WORK_HOUR_END = 18
SLOT_MINUTES = 30


def _calendar_service():
    from googleapiclient.discovery import build
    from app.integrations.google_auth import get_credentials

    creds = get_credentials()
    if creds is None:
        raise RuntimeError("Google account not connected. Complete OAuth setup in admin panel.")
    return build("calendar", "v3", credentials=creds)


def get_free_slots(days_ahead: int = 7) -> list[dict]:
    """Return up to 5 free 30-min slots in working hours over the next N days.

    Uses the Freebusy API so only busy periods are transferred — no event content.
    """
    from app.core.settings import settings

    service = _calendar_service()
    tz_name = settings.calendar_tz
    calendar_id = settings.calendar_id

    try:
        import pytz
        tz = pytz.timezone(tz_name)
    except Exception:
        from datetime import timezone as _tz
        tz = timezone.utc

    now = datetime.now(tz)
    # Round up to the next 30-min boundary
    minutes_over = now.minute % SLOT_MINUTES
    if minutes_over:
        now = now + timedelta(minutes=SLOT_MINUTES - minutes_over)
    now = now.replace(second=0, microsecond=0)

    time_min = now.isoformat()
    time_max = (now + timedelta(days=days_ahead)).isoformat()

    try:
        fb_result = service.freebusy().query(body={
            "timeMin": time_min,
            "timeMax": time_max,
            "items": [{"id": calendar_id}],
            "timeZone": tz_name,
        }).execute()
    except Exception as exc:
        logger.warning("freebusy query failed: %s", exc)
        return []

    busy_periods = fb_result.get("calendars", {}).get(calendar_id, {}).get("busy", [])
    busy_ranges = [
        (datetime.fromisoformat(b["start"]), datetime.fromisoformat(b["end"]))
        for b in busy_periods
    ]

    free_slots = []
    current = now
    end_window = now + timedelta(days=days_ahead)

    while current < end_window and len(free_slots) < 5:
        # Skip outside working hours
        local_hour = current.astimezone(tz).hour
        if local_hour < WORK_HOUR_START:
            current = current.replace(hour=WORK_HOUR_START, minute=0) + timedelta()
            continue
        if local_hour >= WORK_HOUR_END:
            # Jump to next day 9 AM
            next_day = (current + timedelta(days=1)).replace(hour=WORK_HOUR_START, minute=0)
            current = next_day
            continue
        # Skip weekends
        if current.weekday() >= 5:
            next_monday = current + timedelta(days=(7 - current.weekday()))
            current = next_monday.replace(hour=WORK_HOUR_START, minute=0)
            continue

        slot_end = current + timedelta(minutes=SLOT_MINUTES)
        # Check overlap with busy
        is_busy = any(
            not (slot_end <= bs or current >= be)
            for bs, be in busy_ranges
        )

        if not is_busy:
            local_start = current.astimezone(tz)
            local_end = slot_end.astimezone(tz)
            free_slots.append({
                "date": local_start.strftime("%A, %B %-d"),
                "start": local_start.strftime("%-I:%M %p"),
                "end": local_end.strftime("%-I:%M %p"),
                "tz": tz_name.split("/")[-1],
                "iso_start": current.isoformat(),
            })

        current = slot_end

    return free_slots


def get_availability_summary() -> str:
    """Return a natural-language sentence about upcoming free slots, or empty string on failure."""
    try:
        slots = get_free_slots()
        if not slots:
            return ""

        from app.routers.ai import _generate
        slots_text = "\n".join(
            f"- {s['date']}: {s['start']} – {s['end']} {s['tz']}"
            for s in slots[:5]
        )
        prompt = (
            f"Write one concise sentence (max 30 words) summarizing these open calendar slots for Jaya:\n"
            f"{slots_text}\n\n"
            "Format: 'Jaya has openings [natural description]. You can book at [booking_url].' "
            "Use the placeholder [booking_url] literally — do not invent a URL."
        )
        return _generate("", prompt).strip()
    except Exception as exc:
        logger.warning("get_availability_summary failed: %s", exc)
        return ""

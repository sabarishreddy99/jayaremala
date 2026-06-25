# gradeVITian Admin Metrics — Design

**Date:** 2026-06-25
**Status:** Approved (design), pending implementation plan

## Goal

Surface gradeVITian usage metrics inside the existing admin dashboard
(`/admin`) — user accounts, saved calculations, feedback-wall activity, and
traffic/engagement — so the site owner can see how the gradeVITian app is being
used without querying the database by hand.

## Context

- gradeVITian data lives in its own SQLite DB (`gradevitian.db`, path from
  `settings.gv_db_path`), separate from the portfolio analytics DB.
- DB access module: `backend/src/app/db/gradevitian.py`. Relevant tables:
  `gv_users`, `gv_saved_calcs`, `gv_comments`, `gv_counters` (page_loads /
  visits), `gv_streaks`, `gv_achievements`.
- Today only a **public** `/gv/stats` exists (returns `page_loads` + `visits`).
  There is no admin-protected metrics endpoint.
- Admin API auth: gradeVITian router already has `_require_admin` (Bearer
  `ADMIN_TOKEN`), the same token the rest of the admin dashboard uses.
- Admin UI is a single large component, `frontend/src/app/admin/page.tsx`, with:
  - a `NAV` array grouped into Overview / Content / Portfolio / Settings,
  - an `activeView` state + conditional panel rendering,
  - a reusable `StatCard` component,
  - per-feature panels, larger ones extracted into `components/admin/*`.

## Design decision: separate endpoint

Add a dedicated `GET /gv/admin/metrics` rather than folding the data into the
portfolio `/stats/admin` payload. Rationale: gradeVITian metrics come from a
different database; an independent call keeps the two decoupled so a gradeVITian
DB issue can never break the main analytics dashboard, and vice versa.

## Backend

### `db/gradevitian.py` — new `get_admin_metrics() -> dict`

Single function, one connection, returning:

```
{
  "users": {
    "total": int,
    "new_7d": int,
    "new_30d": int,
    "recent": [ { "name", "username", "email", "created_at" } ]   # latest 10
  },
  "saved_calcs": {
    "total": int,
    "by_type": [ { "calc_type": str, "count": int } ]             # desc by count
  },
  "comments": {
    "approved": int,
    "pending": int,
    "rejected": int,
    "total": int
  },
  "engagement": {
    "page_loads": int,        # gv_counters
    "visits": int,            # gv_counters
    "active_streaks": int,    # users whose last_active is today or yesterday
    "longest_streak": int,    # max(count) over gv_streaks
    "badges_total": int,
    "badges_by_type": [ { "badge": str, "count": int } ]
  }
}
```

Implementation notes:
- "new_7d" / "new_30d" via `created_at >= datetime('now','-7 days')` etc.
- "active_streaks": `last_active` is stored as a `YYYY-MM-DD` string; count rows
  where `last_active` is today or yesterday (UTC), matching the `bump_streak`
  semantics.
- All counts via `COUNT(*)` / `GROUP BY`; no N+1.

### `routers/gradevitian.py` — new endpoint

```
@router.get("/admin/metrics", dependencies=[Depends(_require_admin)])
def gv_admin_metrics() -> dict:
    return gv.get_admin_metrics()
```

Reuses the existing `_require_admin` guard.

## Frontend (`frontend/src/app/admin/page.tsx` + new panel component)

### Wiring
- Add `"gradevitian"` to the `activeView` union type.
- Add a NAV item `{ key: "gradevitian", label: "gradeVITian", group: "Overview" }`.
- Add a `VIEW_LABELS["gradevitian"] = "gradeVITian"` entry.
- Add a `NavIcon` path for `gradevitian` (graduation-cap style glyph).
- Render `{activeView === "gradevitian" && <GradevitianPanel />}`.

### New component: `components/admin/GradevitianPanel.tsx`
Mirrors the existing admin-panel pattern (client component, `authHeaders()`,
`API_BASE_URL`). On mount, `GET /gv/admin/metrics`. States: loading / error /
loaded.

Renders, reusing `StatCard` styling tokens:
- **Headline `StatCard` grid:** Total users, New (7d), New (30d), Saved calcs,
  Visits, Page loads, Active streaks, Badges awarded.
- **Recent signups table:** name, username, email, joined date (latest 10).
- **Breakdown lists** (label + count rows): Saved calcs by type, Comments by
  status, Badges by type.

`StatCard` is currently defined inside `page.tsx`. To use it from the new
component without a circular import, either (a) export `StatCard` from a small
shared module, or (b) keep a local lightweight stat-card in the panel. Decision:
**extract `StatCard` (and the `fmt` helper) into `components/admin/StatCard.tsx`**
and import it in both places — minor, keeps a single source of truth. The plan
will confirm no other in-file coupling blocks this.

## Non-goals (v1)

- No week/month/all period toggle — signup windows are fixed 7d / 30d / all.
- No rulebook Q&A or referral metrics — those are in-memory / fire-and-forget
  and not persisted, so they cannot be reported.
- Read-only. No moderation or account actions from this panel (comment
  moderation already has its own admin flow).

## Testing

- Backend: a `pytest` test for `get_admin_metrics()` against a seeded temp DB
  (users, calcs, comments of each status, counters, streaks, badges) asserting
  the aggregate shape and counts.
- Backend: endpoint returns 401/403 without the admin token, 200 with it.
- Frontend: manual verification — load `/admin`, open the gradeVITian section,
  confirm numbers render and match the API response.

## Files touched

- `backend/src/app/db/gradevitian.py` — add `get_admin_metrics()`.
- `backend/src/app/routers/gradevitian.py` — add `GET /gv/admin/metrics`.
- `backend/tests/` — new test for the metrics function/endpoint.
- `frontend/src/app/admin/page.tsx` — nav item, view wiring, icon, label.
- `frontend/src/components/admin/GradevitianPanel.tsx` — new panel.
- `frontend/src/components/admin/StatCard.tsx` — extracted shared card + `fmt`.

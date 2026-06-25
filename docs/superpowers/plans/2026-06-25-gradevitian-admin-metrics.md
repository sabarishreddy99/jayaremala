# gradeVITian Admin Metrics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a gradeVITian usage-metrics dashboard (users, saved calculations, feedback-wall comments, engagement) as a new section in the `/admin` page.

**Architecture:** A single admin-guarded backend endpoint `GET /gv/admin/metrics` aggregates counts from the gradeVITian SQLite DB via a new `get_admin_metrics()` function. A new React panel in the admin page fetches it and renders stat cards, a recent-signups table, and breakdown lists. The shared `StatCard`/`fmt` helpers are extracted into a reusable module.

**Tech Stack:** FastAPI + sqlite3 (backend), pytest (tests), Next.js 16 / React 19 / TypeScript / Tailwind 4 (frontend).

## Global Constraints

- Backend module path for running: `uvicorn`/`pytest` use `backend/src` on the path (conftest already inserts it).
- gradeVITian admin auth uses the existing `_require_admin` dependency (Bearer `ADMIN_TOKEN`) in `routers/gradevitian.py` — do not invent a new guard.
- Frontend: this is a customized Next.js — consult `node_modules/next/dist/docs/` before using any Next.js API. This task uses only client-component patterns already present in `admin/page.tsx`, so no new Next.js APIs are needed.
- Single source of truth: do not edit `frontend/src/data/knowledge/` (irrelevant here, but the rule stands).
- Reuse existing styling tokens (`border-border`, `bg-surface`, `text-fg-subtle`, etc.) and the existing `StatCard`/`fmt` helpers — do not introduce new color systems.
- Never run `git push` (user pushes themselves). Commits are fine.

---

### Task 1: Backend — `get_admin_metrics()` aggregation function

**Files:**
- Modify: `backend/src/app/db/gradevitian.py` (add new function after `get_counts`, ~line 209)
- Test: `backend/tests/test_gradevitian.py` (add new test)

**Interfaces:**
- Consumes: existing `_connect()` (returns a connection with `sqlite3.Row` factory), `init_db()`, `create_user()`, `save_calc()`, `add_comment()`, `award_badge()`, `bump_streak()`, `record_page_load()`, `record_visit()`.
- Produces: `get_admin_metrics() -> dict` with shape:
  ```
  {
    "users": {"total": int, "new_7d": int, "new_30d": int,
              "recent": [{"name": str, "username": str, "email": str, "created_at": str}]},
    "saved_calcs": {"total": int, "by_type": [{"calc_type": str, "count": int}]},
    "comments": {"approved": int, "pending": int, "rejected": int, "total": int},
    "engagement": {"page_loads": int, "visits": int, "active_streaks": int,
                   "longest_streak": int, "badges_total": int,
                   "badges_by_type": [{"badge": str, "count": int}]}
  }
  ```

- [ ] **Step 1: Write the failing test**

Add to `backend/tests/test_gradevitian.py` (uses the `gv` module already imported at the top; the autouse `_no_external_calls` fixture and temp `GV_DB_PATH` from conftest keep it isolated):

```python
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
    assert m["engagement"]["badges_total"] == 1
    assert m["engagement"]["badges_by_type"] == [{"badge": "first_calc", "count": 1}]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && pytest tests/test_gradevitian.py::test_get_admin_metrics_aggregates -v`
Expected: FAIL with `AttributeError: module 'app.db.gradevitian' has no attribute 'get_admin_metrics'`

- [ ] **Step 3: Write minimal implementation**

In `backend/src/app/db/gradevitian.py`, add directly after the `get_counts()` function (after ~line 209):

```python
def get_admin_metrics() -> dict:
    """Aggregate gradeVITian usage metrics for the admin dashboard.

    Single connection, all COUNT/GROUP BY — no per-row queries.
    `last_active` is a 'YYYY-MM-DD' string, so an ISO string comparison against
    date('now','-1 day') captures users active today or yesterday.
    """
    with _connect() as conn:
        users_total = conn.execute("SELECT COUNT(*) AS c FROM gv_users").fetchone()["c"]
        new_7d = conn.execute(
            "SELECT COUNT(*) AS c FROM gv_users WHERE created_at >= datetime('now','-7 days')"
        ).fetchone()["c"]
        new_30d = conn.execute(
            "SELECT COUNT(*) AS c FROM gv_users WHERE created_at >= datetime('now','-30 days')"
        ).fetchone()["c"]
        recent = [
            {"name": r["name"], "username": r["username"], "email": r["email"], "created_at": r["created_at"]}
            for r in conn.execute(
                "SELECT name, username, email, created_at FROM gv_users ORDER BY id DESC LIMIT 10"
            ).fetchall()
        ]

        calcs_total = conn.execute("SELECT COUNT(*) AS c FROM gv_saved_calcs").fetchone()["c"]
        calcs_by_type = [
            {"calc_type": r["calc_type"], "count": r["c"]}
            for r in conn.execute(
                "SELECT calc_type, COUNT(*) AS c FROM gv_saved_calcs GROUP BY calc_type ORDER BY c DESC"
            ).fetchall()
        ]

        status_counts = {
            r["status"]: r["c"]
            for r in conn.execute(
                "SELECT status, COUNT(*) AS c FROM gv_comments GROUP BY status"
            ).fetchall()
        }
        comments = {
            "approved": status_counts.get("approved", 0),
            "pending": status_counts.get("pending", 0),
            "rejected": status_counts.get("rejected", 0),
            "total": sum(status_counts.values()),
        }

        counters = {
            r["name"]: r["count"]
            for r in conn.execute(
                "SELECT name, count FROM gv_counters WHERE name IN ('page_loads','visits')"
            ).fetchall()
        }
        active_streaks = conn.execute(
            "SELECT COUNT(*) AS c FROM gv_streaks WHERE last_active >= date('now','-1 day')"
        ).fetchone()["c"]
        longest_streak = conn.execute(
            "SELECT COALESCE(MAX(count), 0) AS m FROM gv_streaks"
        ).fetchone()["m"]
        badges_total = conn.execute("SELECT COUNT(*) AS c FROM gv_achievements").fetchone()["c"]
        badges_by_type = [
            {"badge": r["badge"], "count": r["c"]}
            for r in conn.execute(
                "SELECT badge, COUNT(*) AS c FROM gv_achievements GROUP BY badge ORDER BY c DESC"
            ).fetchall()
        ]

    return {
        "users": {"total": users_total, "new_7d": new_7d, "new_30d": new_30d, "recent": recent},
        "saved_calcs": {"total": calcs_total, "by_type": calcs_by_type},
        "comments": comments,
        "engagement": {
            "page_loads": counters.get("page_loads", 0),
            "visits": counters.get("visits", 0),
            "active_streaks": active_streaks,
            "longest_streak": longest_streak,
            "badges_total": badges_total,
            "badges_by_type": badges_by_type,
        },
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && pytest tests/test_gradevitian.py::test_get_admin_metrics_aggregates -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/app/db/gradevitian.py backend/tests/test_gradevitian.py
git commit -m "feat(gv): add get_admin_metrics aggregation"
```

---

### Task 2: Backend — `GET /gv/admin/metrics` endpoint

**Files:**
- Modify: `backend/src/app/routers/gradevitian.py` (add route after `gv_stats`, ~line 205)
- Test: `backend/tests/test_gradevitian.py` (add new test)

**Interfaces:**
- Consumes: `gv.get_admin_metrics()` (Task 1), existing `_require_admin` dependency, existing `settings.admin_token`.
- Produces: HTTP `GET /gv/admin/metrics` → 200 with the Task 1 dict when `Authorization: Bearer <ADMIN_TOKEN>` matches; 401 when token wrong; 403 when no `admin_token` configured.

- [ ] **Step 1: Write the failing test**

Add to `backend/tests/test_gradevitian.py`:

```python
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && pytest tests/test_gradevitian.py::test_admin_metrics_endpoint_requires_token -v`
Expected: FAIL with 404 (route not found) on the correct-token request.

- [ ] **Step 3: Write minimal implementation**

In `backend/src/app/routers/gradevitian.py`, add directly after the `gv_stats` function (after ~line 205, before the "Refer a fellow VITian" section):

```python
@router.get("/admin/metrics", dependencies=[Depends(_require_admin)])
def gv_admin_metrics() -> dict:
    """Admin: aggregate gradeVITian usage metrics (users, saved calcs, comments, engagement)."""
    return gv.get_admin_metrics()
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && pytest tests/test_gradevitian.py::test_admin_metrics_endpoint_requires_token -v`
Expected: PASS

- [ ] **Step 5: Run the full gv suite + lint**

Run: `cd backend && pytest tests/test_gradevitian.py -q && ruff check src/app/db/gradevitian.py src/app/routers/gradevitian.py`
Expected: all tests pass, ruff reports no errors.

- [ ] **Step 6: Commit**

```bash
git add backend/src/app/routers/gradevitian.py backend/tests/test_gradevitian.py
git commit -m "feat(gv): add admin-guarded GET /gv/admin/metrics endpoint"
```

---

### Task 3: Frontend — extract shared `StatCard` + `fmt`

**Files:**
- Create: `frontend/src/components/admin/StatCard.tsx`
- Modify: `frontend/src/app/admin/page.tsx` (remove local `fmt` at line 61-64 and `StatCard` at line 68-84; add import)

**Interfaces:**
- Produces: `export function fmt(n: number): string` and `export function StatCard({ label, value, sub, color }): JSX.Element` with `color?: "default" | "emerald" | "rose" | "indigo"`.
- Consumes: nothing new.

- [ ] **Step 1: Create the shared module**

Create `frontend/src/components/admin/StatCard.tsx`:

```tsx
export function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

export function StatCard({
  label, value, sub, color = "default",
}: { label: string; value: string | number; sub?: string; color?: "default" | "emerald" | "rose" | "indigo" }) {
  const accent = {
    default: "text-fg",
    emerald: "text-emerald-600 dark:text-emerald-400",
    rose: "text-rose-600 dark:text-rose-400",
    indigo: "text-indigo-600 dark:text-indigo-400",
  }[color];
  return (
    <div className="rounded-xl border border-border bg-surface p-4 sm:p-5 flex flex-col gap-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-fg-subtle">{label}</p>
      <p className={`text-2xl sm:text-3xl font-bold tabular-nums leading-none ${accent}`}>{typeof value === "number" ? fmt(value) : value}</p>
      {sub && <p className="text-[10px] text-fg-faint leading-snug">{sub}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Replace the local definitions in `page.tsx`**

In `frontend/src/app/admin/page.tsx`, delete the local `fmt` function (lines 61-64) and the local `StatCard` function (lines 68-84), leaving the section comments. Then add this import next to the other component imports near the top (after the `KnowledgeDataView` import, ~line 22):

```tsx
import { StatCard, fmt } from "@/components/admin/StatCard";
```

- [ ] **Step 3: Verify the build/lint compiles**

Run: `cd frontend && npx tsc --noEmit -p tsconfig.json`
Expected: no errors (existing in-file references to `StatCard` and `fmt` now resolve to the import).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/admin/StatCard.tsx frontend/src/app/admin/page.tsx
git commit -m "refactor(admin): extract shared StatCard + fmt helper"
```

---

### Task 4: Frontend — `GradevitianPanel` component

**Files:**
- Create: `frontend/src/components/admin/GradevitianPanel.tsx`

**Interfaces:**
- Consumes: `GET /gv/admin/metrics` (Task 2), `API_BASE_URL` from `@/lib/api/client`, `StatCard`/`fmt` from `@/components/admin/StatCard`, `localStorage["avocado_admin_token"]` for the bearer token (same key the rest of the admin page uses).
- Produces: `export default function GradevitianPanel(): JSX.Element`.

- [ ] **Step 1: Create the component**

Create `frontend/src/components/admin/GradevitianPanel.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api/client";
import { StatCard, fmt } from "@/components/admin/StatCard";

interface GvMetrics {
  users: {
    total: number; new_7d: number; new_30d: number;
    recent: { name: string; username: string; email: string; created_at: string }[];
  };
  saved_calcs: { total: number; by_type: { calc_type: string; count: number }[] };
  comments: { approved: number; pending: number; rejected: number; total: number };
  engagement: {
    page_loads: number; visits: number; active_streaks: number;
    longest_streak: number; badges_total: number;
    badges_by_type: { badge: string; count: number }[];
  };
}

function BreakdownList({ title, rows }: { title: string; rows: { label: string; count: number }[] }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-fg-subtle mb-3">{title}</p>
      {rows.length === 0 ? (
        <p className="text-xs text-fg-faint">No data yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {rows.map((r) => (
            <li key={r.label} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-fg-muted truncate">{r.label}</span>
              <span className="font-semibold tabular-nums text-fg">{fmt(r.count)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function GradevitianPanel() {
  const [metrics, setMetrics] = useState<GvMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("avocado_admin_token") ?? "" : "";
        const res = await fetch(`${API_BASE_URL}/gv/admin/metrics`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        setMetrics(await res.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load gradeVITian metrics");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p className="text-sm text-fg-faint">Loading gradeVITian metrics…</p>;
  if (error) return <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>;
  if (!metrics) return null;

  const { users, saved_calcs, comments, engagement } = metrics;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Total users" value={users.total} color="indigo" />
        <StatCard label="New · 7d" value={users.new_7d} sub="signups, last 7 days" />
        <StatCard label="New · 30d" value={users.new_30d} sub="signups, last 30 days" />
        <StatCard label="Saved calcs" value={saved_calcs.total} />
        <StatCard label="Visits" value={engagement.visits} sub="unique browser sessions" />
        <StatCard label="Page loads" value={engagement.page_loads} sub="every load / reload" />
        <StatCard label="Active streaks" value={engagement.active_streaks} sub={`longest: ${engagement.longest_streak} days`} color="emerald" />
        <StatCard label="Badges awarded" value={engagement.badges_total} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <BreakdownList
          title="Saved calcs by type"
          rows={saved_calcs.by_type.map((r) => ({ label: r.calc_type, count: r.count }))}
        />
        <BreakdownList
          title="Comments by status"
          rows={[
            { label: "Approved", count: comments.approved },
            { label: "Pending", count: comments.pending },
            { label: "Rejected", count: comments.rejected },
          ]}
        />
        <BreakdownList
          title="Badges by type"
          rows={engagement.badges_by_type.map((r) => ({ label: r.badge, count: r.count }))}
        />
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-fg-subtle px-4 sm:px-5 pt-4 pb-2">
          Recent signups
        </p>
        {users.recent.length === 0 ? (
          <p className="text-xs text-fg-faint px-4 sm:px-5 pb-4">No signups yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-fg-faint border-b border-border">
                  <th className="text-left font-semibold px-4 sm:px-5 py-2">Name</th>
                  <th className="text-left font-semibold px-4 py-2">Username</th>
                  <th className="text-left font-semibold px-4 py-2">Email</th>
                  <th className="text-left font-semibold px-4 sm:px-5 py-2">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.recent.map((u) => (
                  <tr key={u.username} className="border-b border-border/50 last:border-0">
                    <td className="px-4 sm:px-5 py-2 text-fg">{u.name}</td>
                    <td className="px-4 py-2 text-fg-muted">@{u.username}</td>
                    <td className="px-4 py-2 text-fg-muted truncate max-w-[200px]">{u.email}</td>
                    <td className="px-4 sm:px-5 py-2 text-fg-faint tabular-nums whitespace-nowrap">
                      {u.created_at?.slice(0, 10)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd frontend && npx tsc --noEmit -p tsconfig.json`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/admin/GradevitianPanel.tsx
git commit -m "feat(admin): add GradevitianPanel metrics component"
```

---

### Task 5: Frontend — wire the panel into the admin nav

**Files:**
- Modify: `frontend/src/app/admin/page.tsx` (import; `activeView` union ~line 3517-3519; `NAV` array ~line 3559; `VIEW_LABELS` ~line 3585; `NavIcon` paths ~line 3596; render switch ~line 3887)

**Interfaces:**
- Consumes: `GradevitianPanel` (Task 4).
- Produces: a `"gradevitian"` view selectable from the Overview group.

- [ ] **Step 1: Add the import**

Near the other admin-component imports (after the `StatCard` import added in Task 3, ~line 22-23):

```tsx
import GradevitianPanel from "@/components/admin/GradevitianPanel";
```

- [ ] **Step 2: Extend the `activeView` union type**

Change the `useState` union (lines 3517-3519) to add `"gradevitian"` — add it on the first line after `"analytics"`:

```tsx
  const [activeView, setActiveView] = useState<
    "analytics" | "gradevitian" | "write-blog" | "write-lab" | "quotes" | "blog-api" | "lab" | "quotes-api" |
    "availability" | "now" | "data" | "sync" | "integrations" |
    "profile" | "hero-stats" | "spotlights" | "experience" | "education" | "projects" | "apps" | "skills" | "testimonials" | "gallery"
  >("analytics");
```

- [ ] **Step 3: Add the NAV item**

In the `NAV` array, add directly after the `analytics` entry (line 3559):

```tsx
    { key: "gradevitian",  label: "gradeVITian",  group: "Overview"  },
```

- [ ] **Step 4: Add the VIEW_LABELS entry**

In `VIEW_LABELS` (line 3585), add a `gradevitian` key:

```tsx
    analytics: "Analytics", gradevitian: "gradeVITian", "write-blog": "Write Blog", "write-lab": "Write Lab", quotes: "Quotes",
```

- [ ] **Step 5: Add the NavIcon path**

In the `paths` record inside `NavIcon` (after the `analytics` entry, ~line 3596), add a graduation-cap glyph:

```tsx
      gradevitian:   <><path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1 2.5 3 6 3s6-2 6-3v-5"/></>,
```

- [ ] **Step 6: Render the panel**

Directly after the `{activeView === "analytics" && ( ... )}` block closes (it ends around line 3906, just before `{activeView === "write-blog" && <BlogEditor />}` at line 3907), add:

```tsx
        {activeView === "gradevitian" && <GradevitianPanel />}
```

- [ ] **Step 7: Verify it compiles**

Run: `cd frontend && npx tsc --noEmit -p tsconfig.json`
Expected: no errors.

- [ ] **Step 8: Manual verification**

Run the backend (`cd backend && uvicorn app.main:app --app-dir src --reload`) and frontend (`cd frontend && npm run dev`). Open `http://localhost:3000/admin`, paste the `ADMIN_TOKEN`, click **gradeVITian** in the Overview group. Confirm: stat cards render, the recent-signups table shows rows (or an empty-state), and the three breakdown lists render. Cross-check a couple of numbers against `curl -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:8000/gv/admin/metrics`.

- [ ] **Step 9: Commit**

```bash
git add frontend/src/app/admin/page.tsx
git commit -m "feat(admin): add gradeVITian metrics nav section"
```

---

## Self-Review notes

- **Spec coverage:** Users & signups → Task 1 `users` + Task 4 recent-signups table & cards. Saved calculations → Task 1 `saved_calcs` + Task 4 breakdown. Feedback wall → Task 1 `comments` + Task 4 breakdown. Traffic/streaks/badges → Task 1 `engagement` + Task 4 cards/breakdown. Separate endpoint → Task 2. New nav section → Task 5. StatCard extraction → Task 3. Backend test → Tasks 1 & 2. No period toggle / read-only / excluded rulebook+referrals → respected (nothing added).
- **Type consistency:** Backend dict shape in Task 1 `Produces` matches the SQL in Task 1 Step 3, the `GvMetrics` interface in Task 4, and the endpoint key assertion in Task 2. `StatCard`/`fmt` signatures identical across Tasks 3-4. `activeView` literal `"gradevitian"` identical across Task 5 steps.
- **Placeholders:** none — every code/command step is concrete.

"use client";

import { useState } from "react";
import { useNow } from "@/lib/hooks";

/**
 * The live thing.
 *
 * One brick per shipped thing, each ticking the real time since it was laid.
 * The dates are the real `shippedAt` values from profile.json, so the numbers
 * are not decoration — gradeVITian really has been answering since August 2020.
 *
 * Rules it keeps (SKILL.md step 4): it uses the subject's real content, it
 * works on a phone with a thumb, it has a plain fallback without script (the
 * server renders the course and the "since" dates; only the ticking clock
 * needs JS), and it never blocks reading.
 */

export type Laid = {
  name: string;
  what: string;
  who: string;
  shippedAt: string;
  url: string;
};

function elapsed(fromISO: string, now: number) {
  const from = new Date(fromISO).getTime();
  const ms = Math.max(0, now - from);
  const days = Math.floor(ms / 86_400_000);
  const years = Math.floor(days / 365.25);
  const restDays = days - Math.floor(years * 365.25);
  return { years, days: restDays, total: days };
}

export default function StillRunning({ items }: { items: Laid[] }) {
  // Mount-gated so the server and the first client render agree; `new Date()`
  // during render is a hydration hazard in this codebase.
  const now = useNow(1000);
  const [open, setOpen] = useState<string | null>(null);


  return (
    <ol className="course" style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {items.map((it) => {
        const e = now === null ? null : elapsed(it.shippedAt, now);
        const isOpen = open === it.name;
        return (
          <li key={it.name}>
            <button
              type="button"
              className="brick"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : it.name)}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0,1fr) auto",
                alignItems: "baseline",
                gap: "1rem 1.5rem",
                font: "inherit",
                cursor: "pointer",
              }}
            >
              <span style={{ minWidth: 0 }}>
                <span className="display" style={{ fontSize: "var(--step-lead)", display: "block" }}>
                  {it.name}
                </span>
                <span className="t-small" style={{ display: "block", marginTop: ".35rem" }}>
                  {it.what} · {it.who}
                </span>
              </span>

              <span style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                <span
                  className="display"
                  style={{ fontSize: "var(--step-lead)", display: "block", fontVariantNumeric: "tabular-nums" }}
                >
                  {e === null ? "—" : `${e.years}y ${e.days}d`}
                </span>
                <span className="t-small" style={{ display: "block", marginTop: ".35rem" }}>
                  laid {new Date(it.shippedAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
                </span>
              </span>

              {isOpen && (
                <span style={{ gridColumn: "1 / -1", marginTop: ".9rem" }}>
                  <span style={{ display: "block", marginBottom: ".75rem" }}>
                    {e === null
                      ? `Live since ${it.shippedAt.slice(0, 7)}.`
                      : `Up for ${e.total.toLocaleString("en-US")} days, and counting.`}
                  </span>
                  <span
                    className="btn"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      window.open(it.url, "_blank", "noopener");
                    }}
                  >
                    Open it
                  </span>
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

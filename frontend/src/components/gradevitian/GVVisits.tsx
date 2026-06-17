"use client";

import { useEffect, useState } from "react";
import { apiGet, apiRequest } from "@/lib/api/client";

interface Counts {
  page_loads: number;
  visits: number;
}

/** Live traffic chip. Counts every page load (reloads included) and one visit per
 *  browser session, then polls every 20s so both tick up as others arrive. */
export default function GVVisits() {
  const [counts, setCounts] = useState<Counts | null>(null);

  useEffect(() => {
    let alive = true;
    const refresh = () =>
      apiGet<Counts>("/gv/stats")
        .then((c) => { if (alive) setCounts(c); })
        .catch(() => {});

    void (async () => {
      try {
        await apiRequest("/gv/page-load", "POST"); // every load/reload
      } catch {}
      try {
        // one visit per browser session
        if (!sessionStorage.getItem("gv_visited")) {
          sessionStorage.setItem("gv_visited", "1");
          await apiRequest("/gv/visit", "POST");
        }
      } catch {}
      await refresh(); // accurate totals after the increments commit
    })();

    const id = setInterval(refresh, 20000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  if (!counts) return null;

  return (
    <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface/60 px-3.5 py-1.5 text-micro text-fg-muted backdrop-blur">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <span><span className="font-mono font-semibold tabular-nums text-fg">{counts.page_loads.toLocaleString()}</span> page loads</span>
      <span className="text-fg-faint">·</span>
      <span><span className="font-mono font-semibold tabular-nums text-fg">{counts.visits.toLocaleString()}</span> visits</span>
      <span className="text-fg-faint">· live</span>
    </div>
  );
}

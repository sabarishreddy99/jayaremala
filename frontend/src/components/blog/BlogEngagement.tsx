"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { API_BASE_URL } from "@/lib/api/client";

interface Stats {
  views: number;
  claps: number;
  user_claps: number;
}

const MAX_USER_CLAPS = 50;

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

export default function BlogEngagement({ slug }: { slug: string }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [localClaps, setLocalClaps] = useState(0);
  const [burst, setBurst] = useState(false);
  const [floats, setFloats] = useState<number[]>([]);
  const pendingRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextFloatKey = useRef(0);

  useEffect(() => {
    // POST /view returns the updated stats (including this visit) — use that as
    // the initial state so the count the user sees already reflects their view.
    // Fall back to a plain GET if the POST fails for any reason.
    fetch(`${API_BASE_URL}/blog/${slug}/view`, { method: "POST" })
      .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then((data: Stats) => { setStats(data); setLocalClaps(0); })
      .catch(() => {
        fetch(`${API_BASE_URL}/blog/${slug}/stats`)
          .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
          .then((data: Stats) => { setStats(data); setLocalClaps(0); })
          .catch(() => setStats({ views: 0, claps: 0, user_claps: 0 }));
      });
  }, [slug]);

  const flushClaps = useCallback(async () => {
    const count = pendingRef.current;
    if (count === 0) return;
    pendingRef.current = 0;
    try {
      const res = await fetch(`${API_BASE_URL}/blog/${slug}/clap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data: Stats = await res.json();
      setStats(data);
    } catch {
      // Clap sync failed — local optimistic state remains
    }
  }, [slug]);

  const handleClap = useCallback(() => {
    if (!stats) return;
    const totalUserClaps = stats.user_claps + localClaps;
    if (totalUserClaps >= MAX_USER_CLAPS) return;

    setLocalClaps((c) => c + 1);
    setStats((s) => s ? { ...s, claps: s.claps + 1 } : s);

    const key = nextFloatKey.current++;
    setFloats((f) => [...f, key]);
    setTimeout(() => setFloats((f) => f.filter((k) => k !== key)), 800);

    setBurst(true);
    setTimeout(() => setBurst(false), 200);

    pendingRef.current += 1;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flushClaps, 1500);
  }, [stats, localClaps, flushClaps]);

  useEffect(() => () => { flushClaps(); }, [flushClaps]);

  const userClapsTotal = (stats?.user_claps ?? 0) + localClaps;
  const atMax = userClapsTotal >= MAX_USER_CLAPS;

  return (
    <div className="flex items-center gap-6 py-6 border-t border-b border-border-subtle my-8 select-none">

      {/* Clap button */}
      <div className="flex flex-col items-center gap-1.5">
        <div className="relative">
          {floats.map((k) => (
            <span
              key={k}
              className="absolute -top-6 left-1/2 -translate-x-1/2 text-[11px] font-bold text-accent pointer-events-none animate-float-up"
            >
              +1
            </span>
          ))}
          <button
            onClick={handleClap}
            disabled={atMax}
            title={atMax ? "You've given the maximum claps!" : "Clap for this post"}
            className={`
              relative w-12 h-12 rounded-full border-2 flex items-center justify-center text-xl
              transition-all duration-150
              ${atMax
                ? "border-indigo-300 dark:border-indigo-700 bg-accent-light cursor-default opacity-60"
                : "border-border bg-surface hover:border-indigo-400 hover:bg-accent-light cursor-pointer active:scale-90"
              }
              ${burst ? "scale-125 border-indigo-500 bg-accent-light" : "scale-100"}
            `}
          >
            👏
          </button>
        </div>
        <span className="text-xs font-semibold text-fg-muted">
          {stats ? formatCount(stats.claps) : "—"}
        </span>
        <span className="text-[10px] text-fg-faint">claps</span>
        {userClapsTotal > 0 && (
          <span className="text-[10px] text-accent font-medium">
            You clapped {userClapsTotal}×
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="w-px h-12 bg-border-subtle" />

      {/* Views */}
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-fg-faint">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <span className="text-sm font-semibold text-fg-muted">
            {stats ? formatCount(stats.views) : "—"}
          </span>
        </div>
        <span className="text-[10px] text-fg-faint pl-0.5">unique views</span>
      </div>

    </div>
  );
}

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
  const [localClaps, setLocalClaps] = useState(0);   // claps added this session
  const [burst, setBurst] = useState(false);          // animation trigger
  const [floats, setFloats] = useState<number[]>([]);  // floating +1 keys
  const pendingRef = useRef(0);                        // batched claps to send
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextFloatKey = useRef(0);

  // Load stats + record view on mount
  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, _viewRes] = await Promise.all([
          fetch(`${API_BASE_URL}/blog/${slug}/stats`),
          fetch(`${API_BASE_URL}/blog/${slug}/view`, { method: "POST" }),
        ]);
        const data: Stats = await statsRes.json();
        setStats(data);
        setLocalClaps(0); // user_claps already tracked server-side
      } catch {
        setStats({ views: 0, claps: 0, user_claps: 0 });
      }
    };
    load();
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
      const data: Stats = await res.json();
      setStats(data);
    } catch {}
  }, [slug]);

  const handleClap = useCallback(() => {
    if (!stats) return;
    const totalUserClaps = (stats.user_claps) + localClaps;
    if (totalUserClaps >= MAX_USER_CLAPS) return;

    // Optimistic update
    setLocalClaps((c) => c + 1);
    setStats((s) => s ? { ...s, claps: s.claps + 1 } : s);

    // Floating animation
    const key = nextFloatKey.current++;
    setFloats((f) => [...f, key]);
    setTimeout(() => setFloats((f) => f.filter((k) => k !== key)), 800);

    // Burst animation
    setBurst(true);
    setTimeout(() => setBurst(false), 200);

    // Batch flush after 1.5s of inactivity
    pendingRef.current += 1;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flushClaps, 1500);
  }, [stats, localClaps, flushClaps]);

  // Flush on unmount
  useEffect(() => () => { flushClaps(); }, [flushClaps]);

  const userClapsTotal = (stats?.user_claps ?? 0) + localClaps;
  const atMax = userClapsTotal >= MAX_USER_CLAPS;

  return (
    <div className="flex items-center gap-6 py-6 border-t border-b border-zinc-100 my-8 select-none">

      {/* Clap button */}
      <div className="flex flex-col items-center gap-1.5">
        <div className="relative">
          {/* Floating +1 animations */}
          {floats.map((k) => (
            <span
              key={k}
              className="absolute -top-6 left-1/2 -translate-x-1/2 text-[11px] font-bold text-indigo-500 pointer-events-none animate-float-up"
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
                ? "border-indigo-300 bg-indigo-50 cursor-default opacity-60"
                : "border-zinc-200 bg-white hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer active:scale-90"
              }
              ${burst ? "scale-125 border-indigo-500 bg-indigo-50" : "scale-100"}
            `}
          >
            👏
          </button>
        </div>
        <span className="text-xs font-semibold text-zinc-600">
          {stats ? formatCount(stats.claps) : "—"}
        </span>
        <span className="text-[10px] text-zinc-400">claps</span>
        {userClapsTotal > 0 && (
          <span className="text-[10px] text-indigo-500 font-medium">
            You clapped {userClapsTotal}×
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="w-px h-12 bg-zinc-100" />

      {/* Views */}
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-zinc-400">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <span className="text-sm font-semibold text-zinc-700">
            {stats ? formatCount(stats.views) : "—"}
          </span>
        </div>
        <span className="text-[10px] text-zinc-400 pl-0.5">unique views</span>
      </div>

    </div>
  );
}

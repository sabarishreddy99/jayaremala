"use client";

import { useEffect, useRef, useState } from "react";
import type { HeroStat } from "@/data/profile";

const FALLBACK_STATS: HeroStat[] = [
  { value: 78,  suffix: "%",  label: "Latency Cut",      sub: "P99 RAG on 3K+ RPS" },
  { value: 3,   suffix: "K+", label: "Peak RPS",         sub: "99.9% uptime" },
  { value: 15,  suffix: "ms", label: "Edge Inference",   sub: "Snapdragon NPU" },
  { value: 115, suffix: "GB", label: "Daily Throughput", sub: "Zero data loss" },
];

export default function HeroStats({
  stats,
  cols = 4,
  startOnView = false,
}: {
  stats?: HeroStat[];
  cols?: 2 | 4;
  /** Count up when the band scrolls into view rather than on a blind timer.
   *  Use wherever the stats are no longer above the fold. */
  startOnView?: boolean;
}) {
  const STATS = (stats && stats.length > 0) ? stats : FALLBACK_STATS;
  const [counts, setCounts] = useState(STATS.map(() => 0));
  const [hovered, setHovered] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;

    const run = () => {
      const duration = 1100;
      const start = performance.now();

      function tick(now: number) {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - (1 - t) ** 3; // ease-out cubic
        setCounts(STATS.map((s) => Math.round(s.value * eased)));
        if (t < 1) raf = requestAnimationFrame(tick);
        else setCounts(STATS.map((s) => s.value));
      }

      raf = requestAnimationFrame(tick);
    };

    if (!startOnView) {
      // Above the fold — delay slightly so the page paint settles
      const delay = setTimeout(run, 380);
      return () => {
        clearTimeout(delay);
        cancelAnimationFrame(raf);
      };
    }

    const el = rootRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        obs.unobserve(el);
        run();
      },
      { threshold: 0.25 }
    );
    obs.observe(el);

    return () => {
      obs.disconnect();
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startOnView]);

  return (
    <div ref={rootRef} className={`grid gap-2 sm:gap-3 ${cols === 2 ? "grid-cols-2" : "grid-cols-4"}`}>
      {STATS.map((stat, i) => (
        <div
          key={stat.label}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
          className={`group relative rounded border bg-surface p-3 sm:p-4 overflow-hidden cursor-default select-none transition-all duration-300 ${
            hovered === i
              ? "border-border-strong shadow-sm"
              : "border-border hover:border-border-strong"
          }`}
        >
          {/* Hover glow */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-accent/4 via-transparent to-accent/2 transition-opacity duration-300"
            style={{ opacity: hovered === i ? 1 : 0 }}
          />

          {/* Number */}
          <p className="relative font-mono leading-none tabular-nums">
            <span className={`text-xl sm:text-2xl lg:text-[1.75rem] font-bold transition-colors duration-300 ${hovered === i ? "text-accent" : "text-fg"}`}>
              {counts[i]}
            </span>
            <span className={`text-sm sm:text-base font-bold transition-colors duration-300 ${hovered === i ? "text-accent" : "text-fg-subtle"}`}>
              {stat.suffix}
            </span>
          </p>

          {/* Label */}
          <p className="relative mt-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-fg-faint leading-tight">
            {stat.label}
          </p>

          {/* Sub — fades in on hover */}
          <p
            className="relative mt-0.5 text-[9px] leading-tight text-fg-faint/70 transition-all duration-200 overflow-hidden"
            style={{
              maxHeight: hovered === i ? "2rem" : "0px",
              opacity: hovered === i ? 1 : 0,
            }}
          >
            {stat.sub}
          </p>
        </div>
      ))}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

export type GVStat = { value: string; label: string; sub: string };

/** Splits "17K+" → {prefix:"", num:17, suffix:"K+"}, "#2" → {prefix:"#", num:2}, "<1s" → {"<",1,"s"}. */
function parse(v: string) {
  const m = /^(\D*)(\d+(?:\.\d+)?)(.*)$/.exec(v);
  if (!m) return { prefix: v, num: null as number | null, suffix: "", decimals: 0 };
  const [, prefix, n, suffix] = m;
  return { prefix, num: parseFloat(n), suffix, decimals: n.includes(".") ? n.split(".")[1].length : 0 };
}

/** gradeVITian impact metrics — mirrors the portfolio HeroStats: mono tabular figures,
 *  ease-out count-up when scrolled into view, uppercase micro-label, hover sub-line. */
export default function GVStats({ stats }: { stats: GVStat[] }) {
  const parsed = stats.map((s) => ({ ...s, ...parse(s.value) }));
  const [counts, setCounts] = useState<number[]>(parsed.map(() => 0));
  const [hovered, setHovered] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const targets = parsed.map((p) => p.num ?? 0);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        obs.disconnect();
        if (reduce) {
          setCounts(targets);
          return;
        }
        const duration = 1100;
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min((now - start) / duration, 1);
          const eased = 1 - (1 - t) ** 3;
          setCounts(targets.map((v) => v * eased));
          if (t < 1) requestAnimationFrame(tick);
          else setCounts(targets);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.25, rootMargin: "0px 0px -10% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
    // stats is a stable module constant from the parent
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={ref} className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
      {parsed.map((s, i) => (
        <div
          key={s.label}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
          className={`group relative overflow-hidden rounded-2xl border bg-surface/60 p-4 backdrop-blur-xl transition-all duration-300 sm:p-5 ${
            hovered === i ? "border-border-strong shadow-sm" : "border-border-subtle hover:border-border-strong"
          }`}
        >
          <div
            className="absolute inset-0 bg-gradient-to-br from-accent/[0.07] to-transparent transition-opacity duration-300"
            style={{ opacity: hovered === i ? 1 : 0 }}
          />
          <p className="relative font-mono leading-none tabular-nums">
            <span className={`text-2xl font-bold transition-colors duration-300 sm:text-3xl ${hovered === i ? "text-accent" : "text-fg"}`}>
              {s.prefix}
              {s.num === null ? "" : s.decimals ? counts[i].toFixed(s.decimals) : Math.round(counts[i])}
            </span>
            <span className={`text-base font-bold transition-colors duration-300 ${hovered === i ? "text-accent" : "text-fg-subtle"}`}>
              {s.suffix}
            </span>
          </p>
          <p className="relative mt-2.5 text-[10px] font-bold uppercase leading-tight tracking-widest text-fg-faint">
            {s.label}
          </p>
          <p
            className="relative mt-1 overflow-hidden text-[10px] leading-tight text-fg-faint/70 transition-all duration-200"
            style={{ maxHeight: hovered === i ? "2rem" : "0px", opacity: hovered === i ? 1 : 0 }}
          >
            {s.sub}
          </p>
        </div>
      ))}
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import type { HopeMolecules as HopeMoleculesData } from "@/data/profile";

/**
 * Node layout plus per-node drift parameters. Each axis gets its own amplitude,
 * frequency and phase so no two nodes ever share a rhythm; that is what keeps
 * the structure feeling alive rather than mechanically synchronised.
 */
const NODES = [
  { x: 104, y: 74,  r: 7,   ax: 1.8, ay: 2.2, fx: 0.21, fy: 0.16, px: 0.0, py: 1.1, core: true },
  { x: 42,  y: 44,  r: 5,   ax: 3.6, ay: 3.0, fx: 0.27, fy: 0.19, px: 1.7, py: 0.4 },
  { x: 164, y: 50,  r: 4.5, ax: 3.0, ay: 3.6, fx: 0.23, fy: 0.31, px: 3.1, py: 2.2 },
  { x: 58,  y: 116, r: 4,   ax: 3.3, ay: 2.6, fx: 0.33, fy: 0.24, px: 4.4, py: 5.0 },
  { x: 152, y: 112, r: 5.5, ax: 2.7, ay: 3.3, fx: 0.19, fy: 0.29, px: 2.3, py: 3.6 },
  { x: 100, y: 20,  r: 3.5, ax: 3.8, ay: 2.4, fx: 0.29, fy: 0.22, px: 5.6, py: 1.8 },
];

const BONDS: [number, number][] = [
  [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [1, 5], [4, 2],
];

/** Bonds that run into the core carry a signal. Staggered so they never fire together. */
const SIGNALS = [
  { bond: 0, offset: 0.0 },
  { bond: 1, offset: 0.38 },
  { bond: 2, offset: 0.71 },
  { bond: 3, offset: 0.16 },
  { bond: 4, offset: 0.55 },
];
const SIGNAL_PERIOD = 5.2; // seconds for one satellite-to-core trip

/**
 * The hero's belief panel: the reason the rest of the page exists, sitting in
 * the column that would otherwise be dead space on wide screens.
 *
 * The molecule is driven by a single rAF loop that recomputes node positions
 * from layered sine waves and then re-anchors every bond to them, so the
 * structure stays physically connected while it drifts. Signals travel inward
 * along the core bonds. Pauses entirely when scrolled out of view.
 */
export default function HopeMolecules({ data }: { data: HopeMoleculesData }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const circles = Array.from(svg.querySelectorAll<SVGCircleElement>("[data-node]"));
    const lines = Array.from(svg.querySelectorAll<SVGLineElement>("[data-bond]"));
    const pulses = Array.from(svg.querySelectorAll<SVGCircleElement>("[data-pulse]"));
    if (circles.length !== NODES.length) return;

    const pos = NODES.map((n) => ({ x: n.x, y: n.y }));
    let raf = 0;
    let running = true;
    const start = performance.now();

    const frame = (now: number) => {
      const t = (now - start) / 1000;

      for (let i = 0; i < NODES.length; i++) {
        const n = NODES[i];
        pos[i].x = n.x + n.ax * Math.sin(n.fx * t + n.px);
        pos[i].y = n.y + n.ay * Math.sin(n.fy * t + n.py);
        circles[i].setAttribute("cx", pos[i].x.toFixed(2));
        circles[i].setAttribute("cy", pos[i].y.toFixed(2));
      }

      // Re-anchor bonds so they stay attached to the nodes they connect.
      for (let i = 0; i < BONDS.length; i++) {
        const [a, b] = BONDS[i];
        const l = lines[i];
        l.setAttribute("x1", pos[a].x.toFixed(2));
        l.setAttribute("y1", pos[a].y.toFixed(2));
        l.setAttribute("x2", pos[b].x.toFixed(2));
        l.setAttribute("y2", pos[b].y.toFixed(2));
      }

      // Signals travelling from each satellite into the core.
      for (let i = 0; i < SIGNALS.length; i++) {
        const { bond, offset } = SIGNALS[i];
        const [a, b] = BONDS[bond];
        const u = ((t / SIGNAL_PERIOD + offset) % 1 + 1) % 1;
        // eased travel, so it accelerates away and settles as it arrives
        const e = u * u * (3 - 2 * u);
        const p = pulses[i];
        p.setAttribute("cx", (pos[b].x + (pos[a].x - pos[b].x) * (1 - e)).toFixed(2));
        p.setAttribute("cy", (pos[b].y + (pos[a].y - pos[b].y) * (1 - e)).toFixed(2));
        p.setAttribute("opacity", (Math.sin(Math.PI * u) * 0.85).toFixed(3));
      }

      if (running) raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);

    // Don't burn frames on a molecule nobody can see.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !running) {
          running = true;
          raf = requestAnimationFrame(frame);
        } else if (!entry.isIntersecting && running) {
          running = false;
          cancelAnimationFrame(raf);
        }
      },
      { threshold: 0 }
    );
    io.observe(svg);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);

  return (
    <aside className="hope-panel relative pt-7 lg:pt-0 lg:pl-10">
      {/* Separator drawn as a molecular chain rather than a plain rule:
          horizontal above the panel on small screens, vertical beside it on large. */}
      <span className="hope-rule hope-rule-h lg:hidden" aria-hidden />
      <span className="hope-rule hope-rule-v hidden lg:block" aria-hidden />

      {/* Molecule sits inline with the title on small screens, above it on large. */}
      <div className="flex items-center gap-4 sm:gap-5 lg:block">
        <svg
          ref={svgRef}
          viewBox="0 0 204 136"
          aria-hidden
          className="w-[84px] shrink-0 text-accent sm:w-[96px] lg:mb-7 lg:w-full lg:max-w-[15rem]"
          fill="none"
        >
          <g stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.3">
            {BONDS.map(([a, b], i) => (
              <line
                key={i}
                data-bond
                x1={NODES[a].x}
                y1={NODES[a].y}
                x2={NODES[b].x}
                y2={NODES[b].y}
              />
            ))}
          </g>

          {NODES.map((n, i) => (
            <circle
              key={i}
              data-node
              cx={n.x}
              cy={n.y}
              r={n.r}
              fill="currentColor"
              opacity={n.core ? 0.92 : 0.5}
              className={n.core ? "hm-core" : undefined}
            />
          ))}

          {SIGNALS.map((_, i) => (
            <circle key={i} data-pulse cx={0} cy={0} r={2} fill="currentColor" opacity={0} />
          ))}
        </svg>

        <div className="min-w-0">
          {data.eyebrow && (
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-fg-faint mb-1.5 lg:mb-2.5">
              {data.eyebrow}
            </p>
          )}
          <p
            className="signature-mark text-fg"
            style={{ fontSize: "clamp(1.45rem, 1.1vw + 1.05rem, 2rem)" }}
          >
            {data.term}
          </p>
        </div>
      </div>

      {/* The full argument is a wide-screen affordance; small screens get the
          term and the closing line, so an already tall phone hero stays short. */}
      <div className="hidden lg:block space-y-3.5 max-w-[34ch] mt-5">
        <p className="voice-serif text-[15px] leading-[1.7] text-fg-muted">{data.definition}</p>
        <p className="voice-serif text-[15px] leading-[1.7] text-fg-muted">{data.belief}</p>
      </div>

      {data.closing && (
        <p className="mt-3.5 text-[13px] font-medium text-accent lg:mt-5">{data.closing}</p>
      )}

      {data.footnote && (
        <p className="hidden lg:block mt-5 pt-4 border-t border-border/60 text-[11px] leading-relaxed text-fg-faint max-w-[34ch]">
          {data.footnote}
        </p>
      )}
    </aside>
  );
}

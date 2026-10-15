"use client";

import { useEffect, useRef } from "react";

// Must stay in lockstep with the chapter ids in app/(portfolio)/page.tsx.
// (This list had drifted: it still expected an `about` section that no longer
// exists, and had no entry for three of the chapters, so those simply held the
// previous chapter's tint.)
const SECTIONS = [
  "hero",
  "impact",
  "projects",
  "testimonials",
  "why",
  "how",
  "writing",
  "explore",
  "contact",
];

// Each section gets a subtle radial wash at a different anchor point.
//
// Anchored on var(--accent) via color-mix rather than hardcoded rgb() values.
// Those literals were the old :root indigo, so once the portfolio scope
// deepened its accent the atmosphere would have been washing the page in a
// colour the page no longer uses. This follows whatever scope it renders in.
const wash = (shape: string, strength: number) =>
  `radial-gradient(${shape}, color-mix(in srgb, var(--accent) ${strength}%, transparent) 0%, transparent 65%)`;

const GRADIENTS: Record<string, string> = {
  hero:           wash("ellipse 80% 55% at 60% 0%", 9),
  why:            wash("ellipse 70% 55% at 20% 35%", 7),
  impact:         wash("ellipse 72% 50% at 70% 30%", 7),
  how:            wash("ellipse 68% 50% at 40% 45%", 7),
  projects:       wash("ellipse 75% 55% at 80% 40%", 8),
  testimonials:   wash("ellipse 65% 50% at 30% 50%", 8),
  contact:        wash("ellipse 70% 60% at 50% 80%", 7),
};

export default function ScrollAtmosphere() {
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = divRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const grad = GRADIENTS[entry.target.id] ?? GRADIENTS.hero;
            el.style.background = grad;
          }
        }
      },
      // Centre band, not a ratio — see the same change in SectionIndicator.
      // The old `threshold: 0.25` only worked because the ids sat on a
      // zero-height sentinel; on real full-height sections it is unreachable.
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );

    SECTIONS.forEach((id) => {
      const section = document.getElementById(id);
      if (section) obs.observe(section);
    });

    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={divRef}
      aria-hidden
      className="scroll-atmosphere pointer-events-none fixed inset-0 -z-10"
      style={{
        background: GRADIENTS.hero,
        transition: "background 1.4s cubic-bezier(0.16,1,0.3,1)",
      }}
    />
  );
}

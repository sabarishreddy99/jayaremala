"use client";

import { useEffect, useRef, useState } from "react";
import GVLink from "@/components/gradevitian/GVLink";
import LiquidWave from "@/components/LiquidWave";

/** gradeVITian footer — mirrors the portfolio Footer: liquid wave (currentColor via
 *  text-accent), dot-grid texture, depth glow, reveal-on-scroll, and a mono bottom bar. */
export default function GVFooter() {
  const [revealed, setRevealed] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setRevealed(true); },
      { threshold: 0.08 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const link =
    "font-mono text-[11px] font-medium tracking-[0.06em] text-fg-muted hover:text-accent transition-colors duration-200";

  return (
    <footer
      ref={ref}
      className="relative mt-auto flex flex-col justify-end overflow-hidden bg-bg"
      style={{ minHeight: "clamp(110px, 22vh, 220px)" }}
    >
      {/* Depth glow */}
      <div aria-hidden className="pointer-events-none absolute bottom-0 left-0 right-0 h-2/3 bg-linear-to-t from-accent/5 via-transparent to-transparent" />
      {/* Liquid wave */}
      <div className="text-accent">
        <LiquidWave />
      </div>
      {/* Dot-grid texture */}
      <div aria-hidden className="hero-dot-grid pointer-events-none absolute inset-0 opacity-[0.35]" />

      {/* Bottom bar */}
      <div
        className={`relative z-10 px-4 py-4 transition-[opacity,transform] duration-700 ease-out sm:px-6 sm:py-5 ${
          revealed ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
      >
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-[11px] font-semibold tracking-[0.06em] text-fg">
              © {new Date().getFullYear()} grade<span className="text-accent">VIT</span>ian
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-fg-muted">
              Grading tools for VITians
            </span>
          </div>

          <div className="flex items-center gap-5 sm:gap-7">
            <GVLink href="/feedback" className={link}>Feedback</GVLink>
            <GVLink href="/privacy" className={link}>Privacy</GVLink>
            <GVLink href="/terms" className={link}>Terms</GVLink>
            <a href="https://jayaremala.com" target="_blank" rel="noopener noreferrer" className={link}>
              by Jaya ✦
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

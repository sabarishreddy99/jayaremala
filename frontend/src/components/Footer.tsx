"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { profile } from "@/data/profile";
import LiquidWave from "@/components/LiquidWave";

// ── Footer ────────────────────────────────────────────────────────────────────
export default function Footer() {
  const [revealed, setRevealed] = useState(false);
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = footerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setRevealed(true); },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <footer
      ref={footerRef}
      className="mt-auto bg-bg relative overflow-hidden flex flex-col justify-end"
      style={{ minHeight: "clamp(110px, 22vh, 220px)" }}
    >
      {/* ── Depth glow: accent colour bleeds up from the bottom ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-2/3
                   bg-linear-to-t from-accent/5 via-transparent to-transparent"
      />

      {/* ── Liquid wave: uses currentColor, coloured via text-accent ── */}
      <div className="text-accent">
        <LiquidWave />
      </div>

      {/* ── Dot-grid texture ─────────────────────────────────────── */}
      <div aria-hidden className="hero-dot-grid pointer-events-none absolute inset-0 opacity-[0.35]" />

      {/* ── Bottom bar ───────────────────────────────────────────── */}
      <div
        className={`relative z-10 px-4 sm:px-6 py-4 sm:py-5
                    transition-[opacity,transform] duration-700 ease-out
                    ${revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
      >
        <div className="mx-auto flex w-full max-w-6xl xl:max-w-7xl 2xl:max-w-360 flex-wrap items-center justify-between gap-3">
          {/* Left: copyright */}
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[11px] tracking-[0.06em] text-fg/60">
              © {new Date().getFullYear()} Jaya Sabarish Reddy Remala
            </span>
            <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-fg/35">
              Updated{" "}
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          {/* Right: links */}
          <div className="flex items-center gap-5 sm:gap-7">
            {profile.github && (
              <a
                href={profile.github}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[11px] tracking-[0.06em] text-fg/45
                           hover:text-fg/80 transition-colors duration-200"
              >
                GitHub
              </a>
            )}
            {profile.linkedin && (
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[11px] tracking-[0.06em] text-fg/45
                           hover:text-fg/80 transition-colors duration-200"
              >
                LinkedIn
              </a>
            )}
            <a
              href={`mailto:${profile.email}`}
              className="font-mono text-[11px] tracking-[0.06em] text-fg/45
                         hover:text-fg/80 transition-colors duration-200"
            >
              Email
            </a>
            <Link
              href="/chat"
              className="font-mono text-[11px] tracking-[0.06em] text-fg/45
                         hover:text-fg/80 transition-colors duration-200"
            >
              Avocado ✦
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

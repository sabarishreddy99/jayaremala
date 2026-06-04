"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { profile } from "@/data/profile";
import BlogGuideDrawer from "@/components/blog/BlogGuideDrawer";
import LiquidWave from "@/components/LiquidWave";

// ── Single animated character span ────────────────────────────────────────────
function AnimChar({
  ch,
  hovered,
  useGradient,
  onEnter,
  onLeave,
}: {
  ch: string;
  hovered: boolean;
  useGradient: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const isSpace = ch === " ";
  return (
    <span
      onMouseEnter={isSpace ? undefined : onEnter}
      onMouseLeave={isSpace ? undefined : onLeave}
      style={{
        display: "inline-block",
        cursor: isSpace ? "default" : "default",
        // Lift + subtle scale on hover — GPU-composited, no reflow
        transform: hovered ? "translateY(-7px) scale(1.06)" : "translateY(0) scale(1)",
        transition: "transform 0.32s cubic-bezier(0.22,1,0.36,1)",
        // Gradient fill only on JAYA letters when hovered
        ...(useGradient && hovered
          ? {
              background:
                "linear-gradient(135deg, var(--accent) 0%, var(--accent-secondary) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }
          : {}),
      }}
      // Tailwind handles base ↔ hover color (gradient mode overrides via inline style)
      className={
        isSpace
          ? ""
          : useGradient
          ? hovered
            ? "transition-none" // gradient applied via inline style
            : "text-fg/[0.08] transition-[color] duration-200"
          : hovered
          ? "text-fg transition-[color] duration-150"
          : "text-fg-faint/55 transition-[color] duration-150"
      }
    >
      {isSpace ? " " : ch}
    </span>
  );
}

// ── Marquee row: scrolling strip of animated characters ───────────────────────
function MarqueeRow({
  text,
  paused,
  spanStyle,
  animStyle,
  useGradient,
}: {
  text: string;
  paused: boolean;
  spanStyle: React.CSSProperties;
  animStyle: React.CSSProperties;
  useGradient: boolean;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const chars = text.split("");

  const renderChars = (offset: number) =>
    chars.map((ch, i) => {
      const idx = offset * chars.length + i;
      return (
        <AnimChar
          key={idx}
          ch={ch}
          hovered={hovered === idx}
          useGradient={useGradient}
          onEnter={() => setHovered(idx)}
          onLeave={() => setHovered(null)}
        />
      );
    });

  return (
    <div className="overflow-hidden">
      <div
        style={{
          ...animStyle,
          animationPlayState: paused ? "paused" : "running",
        }}
      >
        <span className="leading-none" style={spanStyle}>
          {renderChars(0)}
        </span>
        <span className="leading-none" style={spanStyle}>
          {renderChars(1)}
        </span>
      </div>
    </div>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
export default function Footer() {
  const [paused, setPaused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const footerRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const showGuide = pathname.startsWith("/blog") || pathname.startsWith("/lab");

  // Reveal the marquee the first time the footer enters the viewport
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
      className="mt-auto border-t border-border bg-surface relative overflow-hidden"
    >
      {/* ── Depth glow: accent colour bleeds up from the bottom ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-2/3
                   bg-gradient-to-t from-accent/[0.05] via-transparent to-transparent"
      />

      {/* ── Liquid wave: uses currentColor, coloured via text-accent ── */}
      <div className="text-accent">
        <LiquidWave />
      </div>

      {/* ── Dot-grid texture behind marquee ─────────────────────── */}
      <div aria-hidden className="hero-dot-grid pointer-events-none absolute inset-0 opacity-[0.35]" />

      {/* ── Scrolling name ──────────────────────────────────────── */}
      <div
        className={`relative z-10 pt-10 pb-6 sm:pt-14 sm:pb-8 select-none overflow-hidden
                    space-y-0 cursor-default
                    transition-[opacity,transform] duration-700 ease-out
                    ${revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* JAYA — Playfair Display italic, gradient hover */}
        <MarqueeRow
          text="JAYA"
          paused={paused}
          useGradient={true}
          spanStyle={{
            display: "inline-block",
            fontFamily: "var(--font-display), Georgia, serif",
            fontWeight: 900,
            fontStyle: "italic",
            letterSpacing: "-0.055em",
            fontSize: "clamp(4.5rem, 16vw, 13rem)",
            paddingRight: "55vw",
          }}
          animStyle={{
            display: "inline-block",
            whiteSpace: "nowrap",
            animation: "marquee-left 48s linear infinite",
            animationDelay: "-24s",
            willChange: "transform",
          }}
        />

        {/* SABARISH · REDDY · REMALA — mono light, wide tracking, color hover */}
        <MarqueeRow
          text="SABARISH  ·  REDDY  ·  REMALA"
          paused={paused}
          useGradient={false}
          spanStyle={{
            display: "inline-block",
            fontFamily: "var(--font-mono), monospace",
            fontWeight: 300,
            letterSpacing: "0.22em",
            fontSize: "clamp(0.6rem, 2vw, 1.6rem)",
            paddingRight: "55vw",
          }}
          animStyle={{
            display: "inline-block",
            whiteSpace: "nowrap",
            animation: "marquee-right 38s linear infinite",
            animationDelay: "-12s",
            willChange: "transform",
          }}
        />
      </div>

      {/* ── Gradient rule separating marquee from bottom bar ────── */}
      <div
        aria-hidden
        className={`relative z-10 mx-6 sm:mx-8 h-px
                    bg-gradient-to-r from-transparent via-border-strong/40 to-transparent
                    transition-[opacity,transform] duration-700 delay-150 ease-out
                    ${revealed ? "opacity-100 scale-x-100" : "opacity-0 scale-x-50"}`}
      />

      {/* ── Bottom bar ───────────────────────────────────────────── */}
      <div
        className={`relative z-10 px-4 sm:px-6 py-4 sm:py-5
                    transition-[opacity,transform] duration-700 delay-200 ease-out
                    ${revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
      >
        <div className="mx-auto flex w-full max-w-6xl xl:max-w-7xl 2xl:max-w-[90rem] flex-wrap items-center justify-between gap-3">
          {/* Left: copyright */}
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[11px] tracking-[0.06em] text-fg-muted">
              © {new Date().getFullYear()} Jaya Sabarish Reddy Remala
            </span>
            <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-fg-subtle">
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
                className="font-mono text-[11px] tracking-[0.06em] text-fg-muted
                           hover:text-fg transition-colors duration-200"
              >
                GitHub
              </a>
            )}
            {profile.linkedin && (
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[11px] tracking-[0.06em] text-fg-muted
                           hover:text-fg transition-colors duration-200"
              >
                LinkedIn
              </a>
            )}
            <a
              href={`mailto:${profile.email}`}
              className="font-mono text-[11px] tracking-[0.06em] text-fg-muted
                         hover:text-fg transition-colors duration-200"
            >
              Email
            </a>
            {showGuide && <BlogGuideDrawer />}
            <Link
              href="/chat"
              className="font-mono text-[11px] tracking-[0.06em] text-accent
                         hover:text-accent-hover transition-colors duration-200"
            >
              Avocado ✦
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

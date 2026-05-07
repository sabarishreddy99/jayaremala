"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { profile } from "@/data/profile";
import BlogGuideDrawer from "@/components/blog/BlogGuideDrawer";
import LiquidWave from "@/components/LiquidWave";

function MarqueeText({
  text,
  paused,
  style,
  animStyle,
  baseOpacity,
  hoverOpacity,
}: {
  text: string;
  paused: boolean;
  style: React.CSSProperties;
  animStyle: React.CSSProperties;
  baseOpacity: string;
  hoverOpacity: string;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const chars = text.split("");

  const renderChars = (keyOffset: number) =>
    chars.map((ch, i) => {
      const idx = keyOffset * chars.length + i;
      return (
        <span
          key={idx}
          onMouseEnter={() => setHoveredIdx(idx)}
          onMouseLeave={() => setHoveredIdx(null)}
          className={`transition-colors duration-150 ${hoveredIdx === idx ? hoverOpacity : baseOpacity}`}
          style={{ cursor: "default" }}
        >
          {ch === " " ? " " : ch}
        </span>
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
        <span className="leading-none" style={style}>{renderChars(0)}</span>
        <span className="leading-none" style={style}>{renderChars(1)}</span>
      </div>
    </div>
  );
}

export default function Footer() {
  const [paused, setPaused] = useState(false);
  const pathname = usePathname();
  const showGuide = pathname.startsWith("/blog") || pathname.startsWith("/lab");

  return (
    <footer className="mt-auto border-t border-border bg-surface relative overflow-hidden">
      <LiquidWave />

      {/* Scrolling name — hover pauses */}
      <div
        className="relative z-10 py-6 sm:py-10 select-none overflow-hidden space-y-1 cursor-default"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* JAYA — right to left */}
        <MarqueeText
          text="JAYA"
          paused={paused}
          style={{
            display: "inline-block",
            fontWeight: 900,
            letterSpacing: "-0.05em",
            fontSize: "clamp(4.5rem, 16vw, 12rem)",
            paddingRight: "55vw",
          }}
          animStyle={{
            display: "inline-block",
            whiteSpace: "nowrap",
            animation: "marquee-left 48s linear infinite",
            animationDelay: "-24s",
            willChange: "transform",
          }}
          baseOpacity="text-fg/[0.07]"
          hoverOpacity="text-fg/60"
        />

        {/* SABARISH REDDY REMALA — left to right */}
        <div className="-mt-2 sm:-mt-4">
          <MarqueeText
            text="SABARISH REDDY REMALA"
            paused={paused}
            style={{
              display: "inline-block",
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontSize: "clamp(0.9rem, 3.2vw, 2.8rem)",
              paddingRight: "55vw",
            }}
            animStyle={{
              display: "inline-block",
              whiteSpace: "nowrap",
              animation: "marquee-right 38s linear infinite",
              animationDelay: "-12s",
              willChange: "transform",
            }}
            baseOpacity="text-fg-faint/50"
            hoverOpacity="text-fg"
          />
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative z-10 px-4 sm:px-6 py-4">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-fg-subtle">
            © {new Date().getFullYear()} Jaya Sabarish Reddy Remala
            <span className="mx-2 text-fg-faint">·</span>
            Updated {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
          <div className="flex items-center gap-5">
            {profile.github && (
              <a href={profile.github} target="_blank" rel="noopener noreferrer"
                className="text-xs font-medium text-fg-subtle hover:text-fg transition-colors duration-300">
                GitHub
              </a>
            )}
            {profile.linkedin && (
              <a href={profile.linkedin} target="_blank" rel="noopener noreferrer"
                className="text-xs font-medium text-fg-subtle hover:text-fg transition-colors duration-300">
                LinkedIn
              </a>
            )}
            <a href={`mailto:${profile.email}`}
              className="text-xs font-medium text-fg-subtle hover:text-fg transition-colors duration-300">
              Email
            </a>
            {showGuide && <BlogGuideDrawer />}
            <Link href="/"
              className="text-xs font-medium text-accent hover:text-accent-hover transition-colors duration-300">
              Avocado ✦
            </Link>
          </div>
        </div>
      </div>

    </footer>
  );
}

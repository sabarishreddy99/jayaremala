"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { profile } from "@/data/profile";
import LiquidWave from "@/components/LiquidWave";
import InstallPWA from "@/components/InstallPWA";

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
        <div className="mx-auto flex w-full max-w-6xl xl:max-w-7xl 2xl:max-w-360 flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:gap-3 sm:text-left">
          {/* Left: copyright — fg-muted: 15:1 light · 12:1 dark */}
          <div className="flex flex-col items-center gap-0.5 sm:items-start">
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

          {/* Right: links — centered wrap on mobile, right-aligned wrap on sm/md,
              single row only once there's room at lg */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2.5 sm:justify-end sm:gap-x-5 lg:flex-nowrap lg:gap-x-7">
            {profile.github && (
              <a
                href={profile.github}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[11px] tracking-[0.06em] text-fg-muted
                           hover:text-fg transition-colors duration-200 inline-flex items-center gap-1"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
                </svg>
                <span className="hidden sm:inline">GitHub</span>
              </a>
            )}
            {profile.linkedin && (
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[11px] tracking-[0.06em] text-fg-muted
                           hover:text-fg transition-colors duration-200 inline-flex items-center gap-1"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                <span className="hidden sm:inline">LinkedIn</span>
              </a>
            )}
            <a
              href={`mailto:${profile.email}`}
              className="font-mono text-[11px] tracking-[0.06em] text-fg-muted
                         hover:text-fg transition-colors duration-200 inline-flex items-center gap-1"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <rect width="20" height="16" x="2" y="4" rx="2"/>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
              <span className="hidden sm:inline">Email</span>
            </a>
            <a
              href="/feed.xml"
              target="_blank"
              rel="noopener noreferrer"
              title="RSS Feed"
              className="font-mono text-[11px] tracking-[0.06em] text-fg-muted
                         hover:text-fg transition-colors duration-200 inline-flex items-center gap-1"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <circle cx="5" cy="19" r="2"/>
                <path d="M4 4a16 16 0 0 1 16 16h-3A13 13 0 0 0 4 7V4z"/>
                <path d="M4 11a9 9 0 0 1 9 9H10a6 6 0 0 0-6-6v-3z"/>
              </svg>
              RSS
            </a>
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              title="Sitemap"
              className="font-mono text-[11px] tracking-[0.06em] text-fg-muted
                         hover:text-fg transition-colors duration-200"
            >
              Sitemap
            </a>
            <InstallPWA variant="footer" />
            <Link
              href="/mcp"
              title="Model Context Protocol server"
              className="font-mono text-[11px] tracking-[0.06em] text-fg-muted
                         hover:text-fg transition-colors duration-200"
            >
              MCP
            </Link>
            <Link
              href="/system"
              title="Live system observability"
              className="font-mono text-[11px] tracking-[0.06em] text-fg-muted
                         hover:text-fg transition-colors duration-200"
            >
              System
            </Link>
            <Link
              href="/chat"
              className="font-mono text-[11px] tracking-[0.06em] text-fg-muted
                         hover:text-fg transition-colors duration-200"
            >
              Avocado ✦
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

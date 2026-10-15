"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useClientValue, useMounted } from "@/lib/hooks";
import Link from "next/link";
import { profile } from "@/data/profile";
import { API_BASE_URL } from "@/lib/api/client";
import SparkleIcon from "@/components/ui/SparkleIcon";

// ─── constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "itsjaya_intro_seen";

// Whether the curtain shows is decided once per page load: on first visit, or
// with ?intro to preview it. Cached because the intro marks itself as seen the
// moment it opens, and must not then disappear on the next render.
let introDecision: boolean | null = null;
function decideIntro(): boolean {
  if (introDecision === null) {
    let seen = false;
    try { seen = !!localStorage.getItem(STORAGE_KEY); } catch { /* storage blocked */ }
    introDecision =
      !window.location.pathname.startsWith("/blog") &&
      (new URLSearchParams(window.location.search).has("intro") || !seen);
  }
  return introDecision;
}

const QUICK_LINKS = [
  { label: "Experience", href: "/experience" },
  { label: "Projects",   href: "/projects"   },
  { label: "Blog",       href: "/blog"        },
];

// ─── helpers ──────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

// ─── component ────────────────────────────────────────────────────────────────

export default function IntroScreen() {
  const mounted = useMounted();
  // Decided once per page load (see decideIntro), then hidden after dismiss.
  const shouldShow = useClientValue(decideIntro, false);
  const [closed,       setClosed]       = useState(false);
  const show = shouldShow && !closed;
  const [leaving,      setLeaving]      = useState(false);
  const [dragY,        setDragY]        = useState(0);
  const [isDragging,   setIsDragging]   = useState(false);
  const [mousePos,     setMousePos]     = useState({ x: 0, y: 0 });
  const [visitCount,   setVisitCount]   = useState<number | null>(null);

  const dismissed    = useRef(false);
  const isPreview    = useRef(false);
  const touchStartY  = useRef(0);
  const dialogRef    = useRef<HTMLDivElement>(null);

  // ── mount & localStorage ───────────────────────────────────────────────────

  useEffect(() => {
    // Social proof — Visibility of System Status (Nielsen #1)
    fetch(`${API_BASE_URL}/stats`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.total_responses > 50) setVisitCount(d.total_responses); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!shouldShow) return;
    isPreview.current = new URLSearchParams(window.location.search).has("intro");
    document.body.style.overflow = "hidden";
    // Mark seen immediately — if the user reloads before dismissing
    // the curtain would re-appear without this
    if (!isPreview.current) localStorage.setItem(STORAGE_KEY, "1");
    const t = setTimeout(() => dialogRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [shouldShow]);

  // ── dismiss ────────────────────────────────────────────────────────────────

  const dismiss = useCallback(() => {
    if (dismissed.current) return;
    dismissed.current = true;
    setDragY(0);
    setIsDragging(false);
    setLeaving(true);
    setTimeout(() => {
      document.body.style.overflow = "";
      setClosed(true);
    }, 950);
  }, []);

  // ── mouse parallax — Depth & Engagement (desktop) ─────────────────────────

  useEffect(() => {
    if (!show || leaving) return;
    const onMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth  - 0.5) * 22,
        y: (e.clientY / window.innerHeight - 0.5) * 12,
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [show, leaving]);

  // ── keyboard dismiss — User Control & Freedom (Nielsen #3) ────────────────

  useEffect(() => {
    if (!show || leaving) return;
    const onKey = (e: KeyboardEvent) => {
      if (["Escape", " ", "Enter", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
        dismiss();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show, leaving, dismiss]);

  // ── scroll + touch dismiss with drag feedback — Affordance ───────────────

  useEffect(() => {
    if (!show || leaving) return;

    const onWheel = (e: WheelEvent) => { if (e.deltaY > 0) dismiss(); };

    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
      setIsDragging(true);
    };

    const onTouchMove = (e: TouchEvent) => {
      const delta = touchStartY.current - e.touches[0].clientY;
      if (delta > 0) setDragY(Math.min(delta * 0.55, 90));
    };

    const onTouchEnd = (e: TouchEvent) => {
      setIsDragging(false);
      const delta = touchStartY.current - e.changedTouches[0].clientY;
      if (delta > 45) { dismiss(); }
      else            { setDragY(0); }
    };

    window.addEventListener("wheel",      onWheel,      { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove",  onTouchMove,  { passive: true });
    window.addEventListener("touchend",   onTouchEnd,   { passive: true });
    return () => {
      window.removeEventListener("wheel",      onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove",  onTouchMove);
      window.removeEventListener("touchend",   onTouchEnd);
    };
  }, [show, leaving, dismiss]);

  if (!mounted || !show) return null;

  const taglineParts = profile.tagline.split("·").map((s) => s.trim()).filter(Boolean);

  // Curtain transform — drag feedback springs back, leaving slides up fully
  const curtainStyle: React.CSSProperties = leaving
    ? { transform: "translateY(-100%)", transition: "transform 950ms cubic-bezier(0.76,0,0.24,1)" }
    : dragY > 0
      ? { transform: `translateY(-${dragY}px)`, transition: isDragging ? "none" : "transform 0.4s cubic-bezier(0.16,1,0.3,1)" }
      : {};

  return (
    // role="dialog" + aria-modal — Accessibility
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Welcome to ${profile.name}'s portfolio`}
      tabIndex={-1}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-bg cursor-pointer select-none outline-none"
      style={curtainStyle}
      onClick={dismiss}
    >

      {/* ── Ambient dot grid — Aesthetic texture ─────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.055]"
        style={{
          backgroundImage: "radial-gradient(circle, var(--accent) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* ── Soft radial glow ──────────────────────────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 65% 55% at 50% 45%, color-mix(in srgb, var(--accent) 10%, transparent) 0%, transparent 70%)",
        }}
      />

      {/* ── Skip — User Control & Freedom (Nielsen #3) ───────────────── */}
      <button
        onClick={(e) => { e.stopPropagation(); dismiss(); }}
        aria-label="Skip intro (press Esc)"
        className="absolute top-5 right-5 inline-flex items-center gap-1.5 rounded-lg border border-border/50
                   bg-surface/40 backdrop-blur-sm px-3 py-1.5
                   text-[11px] font-medium text-fg-faint
                   hover:text-fg hover:border-border
                   transition-all duration-150
                   opacity-0 animate-[fadeUp_0.5s_ease_1.3s_forwards]"
      >
        Skip
        <kbd className="font-mono text-[9px] opacity-60">esc</kbd>
      </button>

      {/* ── Main content — Parallax outer layer ──────────────────────── */}
      <div
        aria-hidden={false}
        className="relative flex flex-col items-center text-center px-6 max-w-2xl w-full"
        style={{
          transform: `translate(${mousePos.x * 0.35}px, ${mousePos.y * 0.35}px)`,
          transition: "transform 0.55s cubic-bezier(0.16,1,0.3,1)",
        }}
      >

        {/* Time greeting — Context & Personalisation ──────────────── */}
        <div className="mb-6 flex items-center gap-2.5 opacity-0 animate-[fadeUp_0.6s_ease_0.15s_forwards]">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" aria-hidden />
          <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-fg-faint">
            {getGreeting()}, Portfolio
          </span>
        </div>

        {/* Name — deeper parallax layer for depth ─────────────────── */}
        <div
          style={{
            transform: `translate(${mousePos.x * 0.15}px, ${mousePos.y * 0.15}px)`,
            transition: "transform 0.65s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <h1
            className="font-black tracking-tight text-fg leading-[1.0] opacity-0 animate-[fadeUp_0.8s_ease_0.3s_forwards]"
            style={{ fontSize: "clamp(2.4rem, 7vw, 5.5rem)" }}
          >
            {profile.name}
          </h1>
        </div>

        {/* Tagline — Miller's Law: short readable chunks ──────────── */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 opacity-0 animate-[fadeUp_0.7s_ease_0.5s_forwards]">
          {taglineParts.map((part, i) => (
            <span key={i} className="flex items-center gap-3">
              <span className="text-sm sm:text-base text-fg-muted">{part}</span>
              {i < taglineParts.length - 1 && (
                <span aria-hidden className="w-1 h-1 rounded-full bg-border shrink-0" />
              )}
            </span>
          ))}
        </div>

        {/* Divider */}
        <div aria-hidden className="mt-9 w-10 h-px bg-border opacity-0 animate-[fadeUp_0.6s_ease_0.65s_forwards]" />

        {/* Ask Avocado — Primary CTA, Fitts's Law: large target ───── */}
        <div className="mt-9 opacity-0 animate-[fadeUp_0.7s_ease_0.8s_forwards]">
          <Link
            href="/chat"
            onClick={(e) => { e.stopPropagation(); dismiss(); }}
            className="group inline-flex items-center gap-2.5 rounded-full
                       bg-fg hover:opacity-80
                       px-7 py-3.5 text-sm font-semibold text-bg
                       shadow-lg
                       transition-all duration-200 active:scale-95"
          >
            <span className="text-base leading-none" aria-hidden>🥑</span>
            Ask Avocado
            <SparkleIcon size={13} className="shrink-0 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-12" />
            <svg
              width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"
              aria-hidden
              className="opacity-70 group-hover:translate-x-0.5 transition-transform duration-150"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Quick-jump chips — Recognition over Recall (Nielsen #6) ── */}
        <div className="mt-5 flex items-center gap-2 opacity-0 animate-[fadeUp_0.6s_ease_0.97s_forwards]">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={(e) => { e.stopPropagation(); dismiss(); }}
              className="rounded-full border border-border/70 bg-surface/60 backdrop-blur-sm
                         px-3.5 py-1.5 text-[11px] font-medium text-fg-muted
                         hover:border-border-strong hover:text-accent
                         transition-all duration-150 active:scale-95"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Social proof — Visibility of System Status ──────────────── */}
        {visitCount !== null && (
          <p className="mt-4 flex items-center gap-1.5 text-[10px] text-fg-faint opacity-0 animate-[fadeUp_0.5s_ease_1.15s_forwards]">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span className="font-semibold text-fg-muted">{visitCount.toLocaleString()}+</span>
            conversations with recruiters &amp; visitors
          </p>
        )}

        {/* Scroll / swipe hint — Affordance + responsive label ─────── */}
        <div className="mt-14 flex flex-col items-center gap-2 opacity-0 animate-[fadeUp_0.6s_ease_1.2s_forwards]">
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-fg-faint">
            <span className="hidden sm:inline">scroll</span>
            <span className="sm:hidden">swipe up</span>
            {" "}to explore
          </span>
          {/* Bouncing chevron — clear directional affordance */}
          <svg
            width="18" height="18" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            aria-hidden
            className="text-fg-faint animate-float"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>

      </div>

      {/* ── Drag progress bar — Feedback (Norman) ────────────────────── */}
      {dragY > 0 && (
        <div
          aria-hidden
          className="absolute bottom-0 left-0 h-0.5 bg-accent/60 rounded-full transition-none"
          style={{ width: `${Math.min((dragY / 90) * 100, 100)}%` }}
        />
      )}

    </div>
  );
}

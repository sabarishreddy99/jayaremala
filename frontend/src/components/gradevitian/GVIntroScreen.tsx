"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import GVLink from "@/components/gradevitian/GVLink";

// ─── constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "gradevitian_intro_seen";

// Routes where a welcome curtain would interrupt a task — don't show it there.
// Paths are compared after stripping the /gradevitian mount-point prefix.
const SKIP = new Set([
  "/login", "/signup", "/forgot-password", "/reset-password",
  "/privacy", "/terms", "/account", "/google-callback",
]);

const TOOLS = [
  { label: "GPA", href: "/gpa" },
  { label: "CGPA", href: "/cgpa" },
  { label: "Grade Predictor", href: "/grade-predictor" },
  { label: "Attendance", href: "/attendance" },
];

// ─── helpers ──────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

// ─── component ────────────────────────────────────────────────────────────────

export default function GVIntroScreen() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const dismissed = useRef(false);
  const touchStartY = useRef(0);
  const dialogRef = useRef<HTMLDivElement>(null);

  // ── mount & localStorage ───────────────────────────────────────────────────

  useEffect(() => {
    setMounted(true);
    const path = (pathname || "/").replace(/^\/gradevitian/, "").replace(/\/+$/, "") || "/";
    if (SKIP.has(path)) return;

    const preview = new URLSearchParams(window.location.search).has("intro");
    if (preview || !localStorage.getItem(STORAGE_KEY)) {
      setShow(true);
      document.body.style.overflow = "hidden";
      // Mark seen immediately so a reload before dismissing doesn't re-show it.
      if (!preview) localStorage.setItem(STORAGE_KEY, "1");
      setTimeout(() => dialogRef.current?.focus(), 60);
    }
  }, []);

  // ── dismiss ────────────────────────────────────────────────────────────────

  const dismiss = useCallback(() => {
    if (dismissed.current) return;
    dismissed.current = true;
    setDragY(0);
    setIsDragging(false);
    setLeaving(true);
    setTimeout(() => {
      document.body.style.overflow = "";
      setShow(false);
    }, 950);
  }, []);

  // ── mouse parallax (desktop) ───────────────────────────────────────────────

  useEffect(() => {
    if (!show || leaving) return;
    const onMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 22,
        y: (e.clientY / window.innerHeight - 0.5) * 12,
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [show, leaving]);

  // ── keyboard dismiss ───────────────────────────────────────────────────────

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

  // ── scroll + touch dismiss with drag feedback ──────────────────────────────

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
      if (delta > 45) dismiss();
      else setDragY(0);
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [show, leaving, dismiss]);

  if (!mounted || !show) return null;

  const curtainStyle: React.CSSProperties = leaving
    ? { transform: "translateY(-100%)", transition: "transform 950ms cubic-bezier(0.76,0,0.24,1)" }
    : dragY > 0
      ? { transform: `translateY(-${dragY}px)`, transition: isDragging ? "none" : "transform 0.4s cubic-bezier(0.16,1,0.3,1)" }
      : {};

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to gradeVITian"
      tabIndex={-1}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-bg cursor-pointer select-none outline-none"
      style={curtainStyle}
      onClick={dismiss}
    >
      {/* Ambient dot grid */}
      <div aria-hidden className="hero-dot-grid pointer-events-none absolute inset-0 opacity-[0.4]" />

      {/* Soft accent glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 65% 55% at 50% 45%, var(--accent-light) 0%, transparent 70%)" }}
      />

      {/* Skip */}
      <button
        onClick={(e) => { e.stopPropagation(); dismiss(); }}
        aria-label="Skip intro (press Esc)"
        className="absolute top-5 right-5 inline-flex items-center gap-1.5 rounded-lg border border-border/50 bg-surface/40 px-3 py-1.5 text-[11px] font-medium text-fg-faint backdrop-blur-sm transition-all duration-150 hover:border-border hover:text-fg opacity-0 animate-[fadeUp_0.5s_ease_1.3s_forwards]"
      >
        Skip
        <kbd className="font-mono text-[9px] opacity-60">esc</kbd>
      </button>

      {/* Content — parallax outer layer */}
      <div
        className="relative flex w-full max-w-2xl flex-col items-center px-6 text-center"
        style={{
          transform: `translate(${mousePos.x * 0.35}px, ${mousePos.y * 0.35}px)`,
          transition: "transform 0.55s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Greeting */}
        <div className="mb-6 flex items-center gap-2.5 opacity-0 animate-[fadeUp_0.6s_ease_0.15s_forwards]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" aria-hidden />
          <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-fg-faint">
            {getGreeting()}, VITian
          </span>
        </div>

        {/* Wordmark — deeper parallax layer */}
        <div
          style={{
            transform: `translate(${mousePos.x * 0.15}px, ${mousePos.y * 0.15}px)`,
            transition: "transform 0.65s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <h1
            className="font-bold leading-[1.0] tracking-tight text-fg opacity-0 animate-[fadeUp_0.8s_ease_0.3s_forwards]"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(2.6rem, 8vw, 5.5rem)" }}
          >
            grade<span className="text-accent">VIT</span>ian
          </h1>
        </div>

        {/* Ownership subtitle */}
        <p className="mt-5 max-w-md text-balance text-base text-fg-muted opacity-0 animate-[fadeUp_0.7s_ease_0.5s_forwards] sm:text-lg">
          Your GPA, CGPA, grades &amp; attendance — all in one place.
          <span className="text-fg"> Built by a VITian, for every VITian.</span>
        </p>

        {/* Divider */}
        <div aria-hidden className="mt-9 h-px w-10 bg-border opacity-0 animate-[fadeUp_0.6s_ease_0.65s_forwards]" />

        {/* Primary CTA */}
        <div className="mt-9 opacity-0 animate-[fadeUp_0.7s_ease_0.8s_forwards]">
          <GVLink
            href="/cgpa"
            onClick={(e) => { e.stopPropagation(); dismiss(); }}
            className="group inline-flex items-center gap-2.5 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-accent-fg shadow-lg shadow-accent/25 transition-all duration-200 hover:bg-accent-hover active:scale-95"
          >
            Start calculating
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="opacity-80 transition-transform duration-150 group-hover:translate-x-0.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </GVLink>
        </div>

        {/* Quick-jump tool chips */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 opacity-0 animate-[fadeUp_0.6s_ease_0.97s_forwards]">
          {TOOLS.map((t) => (
            <GVLink
              key={t.href}
              href={t.href}
              onClick={(e) => { e.stopPropagation(); dismiss(); }}
              className="rounded-full border border-border/70 bg-surface/60 px-3.5 py-1.5 text-[11px] font-medium text-fg-muted backdrop-blur-sm transition-all duration-150 hover:border-accent/50 hover:text-accent active:scale-95"
            >
              {t.label}
            </GVLink>
          ))}
        </div>

        {/* Social proof */}
        <p className="mt-4 flex items-center gap-1.5 text-[10px] text-fg-faint opacity-0 animate-[fadeUp_0.5s_ease_1.15s_forwards]">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Trusted by <span className="font-semibold text-fg-muted">17K+ VITians</span> every month
        </p>

        {/* Scroll / swipe hint */}
        <div className="mt-14 flex flex-col items-center gap-2 opacity-0 animate-[fadeUp_0.6s_ease_1.2s_forwards]">
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-fg-faint">
            <span className="hidden sm:inline">scroll</span>
            <span className="sm:hidden">swipe up</span>
            {" "}to enter
          </span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="animate-bounce text-fg-faint">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>

      {/* Drag progress bar */}
      {dragY > 0 && (
        <div
          aria-hidden
          className="absolute bottom-0 left-0 h-0.5 rounded-full bg-accent/60 transition-none"
          style={{ width: `${Math.min((dragY / 90) * 100, 100)}%` }}
        />
      )}
    </div>
  );
}

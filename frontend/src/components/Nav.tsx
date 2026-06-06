"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { profile } from "@/data/profile";
import ThemeToggle from "@/components/ThemeToggle";
import SoundToggle from "@/components/SoundToggle";
import ReadingProgress from "@/components/blog/ReadingProgress";
import { playClick } from "@/lib/sound";

const links = [
  {
    href: "/experience", label: "Experience",
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,
  },
  {
    href: "/education",  label: "Education",
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
  },
  {
    href: "/projects",   label: "Projects",
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  },
  {
    href: "/lab",        label: "Lab",
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11m0 0H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-4m-6 0h6"/></svg>,
  },
  {
    href: "/blog",       label: "Blog",
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  },
  {
    href: "/gallery",    label: "Gallery",
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>,
  },
  {
    href: "/quotes",     label: "Quotes",
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9.983 3v7.391c0 5.704-3.731 9.57-8.983 10.609l-.995-2.151c2.432-.917 3.995-3.638 3.995-5.849h-4v-10h9.983zm14.017 0v7.391c0 5.704-3.748 9.571-9 10.609l-.996-2.151c2.433-.917 3.996-3.638 3.996-5.849h-3.983v-10h9.983z"/></svg>,
  },
  {
    href: "/now",        label: "Now",
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>,
  },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [navVisible, setNavVisible] = useState(true);

  // ── Scroll-hide/show refs ─────────────────────────────────────
  const lastScrollY   = useRef(0);
  const hideTimer     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimer     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openRef       = useRef(open);
  useEffect(() => { openRef.current = open; }, [open]);

  // ── Magnetic spotlight indicator ──────────────────────────────
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [spot, setSpot] = useState<{ left: number; width: number; opacity: number }>({
    left: 0, width: 0, opacity: 0,
  });

  const activeIdx = links.findIndex((l) => pathname.startsWith(l.href));

  useEffect(() => {
    const idx = hoverIdx ?? activeIdx;
    const el = idx >= 0 ? linkRefs.current[idx] : null;
    if (el) setSpot({ left: el.offsetLeft, width: el.offsetWidth, opacity: 1 });
    else setSpot((s) => ({ ...s, opacity: 0 }));
  }, [hoverIdx, activeIdx, pathname]);

  // Re-measure on resize (font / layout shifts)
  useEffect(() => {
    const remeasure = () => {
      const idx = activeIdx;
      const el = idx >= 0 ? linkRefs.current[idx] : null;
      if (el) setSpot({ left: el.offsetLeft, width: el.offsetWidth, opacity: 1 });
    };
    const id = setTimeout(remeasure, 80); // after font swap
    window.addEventListener("resize", remeasure);
    return () => { clearTimeout(id); window.removeEventListener("resize", remeasure); };
  }, [activeIdx]);

  useEffect(() => {
    const onScroll = () => {
      const y     = window.scrollY;
      const delta = y - lastScrollY.current;

      setScrolled(y > 48);

      if (y <= 10) {
        // At the very top — always reveal immediately
        clearTimeout(hideTimer.current ?? undefined);
        clearTimeout(idleTimer.current ?? undefined);
        setNavVisible(true);
      } else if (delta > 6 && !openRef.current) {
        // Scrolling DOWN — hide after a short pause (feels deliberate, not twitchy)
        clearTimeout(idleTimer.current ?? undefined);
        clearTimeout(hideTimer.current ?? undefined);
        hideTimer.current = setTimeout(() => setNavVisible(false), 120);
      } else if (delta < -4) {
        // Scrolling UP — reveal immediately
        clearTimeout(hideTimer.current ?? undefined);
        clearTimeout(idleTimer.current ?? undefined);
        setNavVisible(true);
      }

      // Reveal after the user rests (stops scrolling for 900 ms)
      clearTimeout(idleTimer.current ?? undefined);
      idleTimer.current = setTimeout(() => setNavVisible(true), 900);

      lastScrollY.current = y;
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(hideTimer.current ?? undefined);
      clearTimeout(idleTimer.current ?? undefined);
    };
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 relative will-change-transform bg-bg ${
        navVisible
          /* Reveal: spring easing — feels like it "settles" into place */
          ? "translate-y-0 transition-transform duration-[480ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
          /* Hide: quick ease-in — snaps away crisply */
          : "-translate-y-[110%] transition-transform duration-[220ms] ease-in"
      }`}
    >

      {/* ── Gradient scrim ── softly bleeds the page bg colour downward,
           creating a visual "air gap" between the nav and page content   */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-full h-16"
        style={{ background: "linear-gradient(to bottom, var(--bg) 0%, transparent 100%)" }}
      />

      {/* ── Floating wrapper — gap on all screen sizes ── */}
      <div className="py-2 px-2 lg:px-4">
        {/* ── The nav pill ── layout never changes; only visual props animate ── */}
        <div
          className={`relative z-10 mx-auto flex w-full max-w-6xl xl:max-w-7xl 2xl:max-w-[90rem] items-center justify-between
            px-4 py-2
            transition-[background-color,box-shadow] duration-400 ease-out
            ${scrolled
              ? "bg-bg dark:bg-surface [box-shadow:0_8px_32px_-8px_rgb(0_0_0/0.08),0_2px_8px_-2px_rgb(0_0_0/0.04)] dark:[box-shadow:0_8px_32px_-8px_rgb(0_0_0/0.45),0_2px_8px_-2px_rgb(0_0_0/0.25)]"
              : "bg-transparent shadow-none"
            }`}
        >
          {/* Dot grid: its OWN overflow-hidden+rounded wrapper so it clips to pill
              corners without clipping the color-picker dropdown that lives outside */}
          <div
            aria-hidden
            className="absolute inset-0 overflow-hidden pointer-events-none"
          >
            <div className={`hero-dot-grid absolute inset-0 transition-opacity duration-400 ${scrolled ? "opacity-[0.18]" : "opacity-0"}`} />
          </div>
        {/* Logo */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xl font-normal tracking-widest text-fg hover:opacity-70 transition-opacity"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          onClick={() => { setOpen(false); playClick("ui"); }}
        >
          Jaya
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {/* Spotlight link group — a soft indigo highlight glides between items */}
          <div
            className="relative flex items-center gap-1"
            onMouseLeave={() => setHoverIdx(null)}
          >
            {/* The gliding spotlight */}
            <span
              aria-hidden
              className="pointer-events-none absolute top-1/2 -translate-y-1/2 h-8
                         bg-surface-raised dark:bg-surface-raised
                         ring-1 ring-border dark:ring-border"
              style={{
                left: spot.left,
                width: spot.width,
                opacity: spot.opacity,
                transition: "left 0.42s cubic-bezier(0.22,1,0.36,1), width 0.42s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease",
              }}
            />
            {links.map((l, i) => {
              const active = pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  ref={(el) => { linkRefs.current[i] = el; }}
                  onMouseEnter={() => setHoverIdx(i)}
                  onClick={() => playClick("nav")}
                  className={`relative z-10 inline-flex items-center px-3 py-1.5 text-sm whitespace-nowrap transition-colors duration-200 ${
                    active
                      ? "text-fg font-semibold"
                      : hoverIdx === i
                      ? "text-fg"
                      : "text-fg-subtle"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>
          {/* Cmd+K search trigger */}
          <button
            onClick={() => { playClick("ui"); window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })); }}
            className="inline-flex items-center gap-2 rounded border border-border bg-surface-raised px-2.5 py-1.5 text-xs text-fg-faint hover:text-fg hover:border-fg-muted transition-colors"
            aria-label="Search"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <kbd className="font-sans text-[10px]">⌘K</kbd>
          </button>
          <SoundToggle />
          <ThemeToggle />
          <Link
            href="/chat"
            onClick={() => playClick("primary")}
            className="group ml-2 relative inline-flex items-center px-5 py-1.5 rounded-full bg-fg text-bg text-sm font-medium hover:opacity-75 transition-opacity duration-200 overflow-hidden"
          >
            <span className="flex items-center gap-2 transition-all duration-300 ease-in-out group-hover:-translate-x-10 group-hover:opacity-0">
              Ask Avocado
            </span>
            <span className="absolute inset-0 flex items-center justify-center translate-x-10 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 ease-in-out text-sm font-medium">
              Chat →
            </span>
          </Link>

          {/* Utility buttons — visually separated at the far right */}
          <div className="flex items-center gap-0.5 ml-2 pl-2 border-l border-border">
            <Link
              href="/admin"
              title="Admin"
              className={`p-2 rounded transition-colors ${
                pathname === "/admin"
                  ? "text-fg bg-surface-raised"
                  : "text-fg-faint hover:text-fg-subtle hover:bg-surface-raised"
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </Link>
          </div>
        </nav>

        {/* Mobile controls */}
        <div className="md:hidden flex items-center gap-1">
          <button
            onClick={() => { playClick("ui"); window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })); }}
            className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs transition-all duration-300 ${
              scrolled
                ? "border border-border bg-surface-raised text-fg-faint hover:text-fg hover:border-fg-muted"
                : "border border-transparent text-fg-subtle hover:text-fg"
            }`}
            aria-label="Search"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <span>Search</span>
          </button>
          <SoundToggle />
          <ThemeToggle />
          <button
            className="p-2 rounded text-fg-subtle hover:text-fg hover:bg-surface-raised transition-colors"
            onClick={() => { setOpen(!open); playClick("ui"); }}
            aria-label="Toggle menu"
          >
            {open ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            )}
          </button>
        </div>
        </div>{/* ↑ pill */}

        {/* ── Mobile drawer — floats below pill, same glass treatment ── */}
        {open && (
          <div className="md:hidden mt-1.5 overflow-hidden
            bg-surface/92 backdrop-blur-[14px]
            [box-shadow:0_8px_32px_-8px_rgb(0_0_0/0.10),_0_2px_8px_-2px_rgb(0_0_0/0.06)]
            dark:[box-shadow:0_8px_32px_-8px_rgb(0_0_0/0.45),_0_2px_8px_-2px_rgb(0_0_0/0.25)]">
            <nav className="flex flex-col gap-0.5 px-2 pt-2 pb-2">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => { setOpen(false); playClick("nav"); }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors ${
                    pathname.startsWith(l.href)
                      ? "bg-surface-raised text-fg font-medium"
                      : "text-fg-muted hover:bg-surface-raised hover:text-fg"
                  }`}
                >
                  <span className={`shrink-0 ${pathname.startsWith(l.href) ? "text-accent" : "text-fg-faint"}`}>
                    {l.icon}
                  </span>
                  {l.label}
                </Link>
              ))}
              <a
                href={profile.resume}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="px-3 py-2.5 rounded text-sm text-fg-muted hover:bg-surface-raised transition-colors flex items-center gap-1.5"
              >
                Resume
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M7 17L17 7M17 7H7M17 7v10"/>
                </svg>
              </a>
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="px-3 py-2.5 rounded text-sm text-fg-faint hover:bg-surface-raised transition-colors flex items-center gap-2"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Admin
              </Link>
            </nav>
          </div>
        )}
      </div>{/* ↑ floating wrapper */}

      {/* Reading progress — only on individual blog/lab posts */}
      {/^\/(blog|lab)\/.+/.test(pathname) && <ReadingProgress />}
    </header>
  );
}

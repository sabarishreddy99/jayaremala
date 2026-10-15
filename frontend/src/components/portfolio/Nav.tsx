"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { profile } from "@/data/profile";
import ThemeToggle from "@/components/ui/ThemeToggle";
import SoundToggle from "@/components/ui/SoundToggle";
import SparkleIcon from "@/components/ui/SparkleIcon";
import InstallPWA from "@/components/ui/InstallPWA";
import ReadingProgress from "@/components/blog/ReadingProgress";
import { playClick } from "@/lib/sound";
import { siteGroups as groups } from "@/lib/portfolio/site-nav";
import SiteBubbles from "@/components/portfolio/SiteBubbles";
import SeedAvatar from "@/components/chat/SeedAvatar";

/** Dropdown icon chips take their group's bubble colour, so the nav and the
 *  site map read as one system (Work = Skin, Writing = Flesh, Developers = Paper). */
const GROUP_FACE: Record<string, string> = { Work: "skin", Writing: "flesh", Developers: "paper" };

const Chevron = ({ open }: { open: boolean }) => (
  <svg
    width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round"
    className={`ml-0.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    aria-hidden
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  // Default to Mac (⌘) so the SSR/first-paint hint matches this audience; correct on mount.
  const [isMac, setIsMac] = useState(true);
  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent));
  }, []);

  // ── Scroll-hide/show refs ─────────────────────────────────────
  const lastScrollY   = useRef(0);
  const hideTimer     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimer     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openRef       = useRef(open);
  // The floating Avocado button sits at z-50, above the header's z-40 stacking
  // context, so on a phone it lands on top of the open drawer's last rows and
  // eats their taps. Broadcast the drawer state and let it step aside.
  useEffect(() => {
    openRef.current = open;
    window.dispatchEvent(new CustomEvent("nav:drawer", { detail: { open } }));
  }, [open]);

  // While the site-map sheet is open: lock the page behind it and let Escape
  // close it.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // ── Dropdown menus (desktop) ──────────────────────────────────
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menubarRef = useRef<HTMLDivElement>(null);

  // ── Magnetic spotlight indicator (now glides across the 3 group triggers) ──
  const triggerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [spot, setSpot] = useState<{ left: number; width: number; opacity: number }>({
    left: 0, width: 0, opacity: 0,
  });

  const activeGroupIdx = groups.findIndex((g) => g.items.some((it) => pathname.startsWith(it.href)));

  // Close any open dropdown on navigation — React's "adjust state during render"
  // pattern (preferred over an effect for resetting state when a value changes).
  const [navPath, setNavPath] = useState(pathname);
  if (navPath !== pathname) {
    setNavPath(pathname);
    if (openIdx !== null) setOpenIdx(null);
  }

  const openMenu = (i: number) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenIdx(i);
    setHoverIdx(i);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => { setOpenIdx(null); setHoverIdx(null); }, 150);
  };

  // Move the spotlight to the open → hovered → active group, in that priority.
  useEffect(() => {
    const idx = openIdx ?? hoverIdx ?? activeGroupIdx;
    const el = idx != null && idx >= 0 ? triggerRefs.current[idx] : null;
    if (el) setSpot({ left: el.offsetLeft, width: el.offsetWidth, opacity: 1 });
    else setSpot((s) => ({ ...s, opacity: 0 }));
  }, [openIdx, hoverIdx, activeGroupIdx, pathname]);

  // Re-measure on resize (font / layout shifts)
  useEffect(() => {
    const remeasure = () => {
      const el = activeGroupIdx >= 0 ? triggerRefs.current[activeGroupIdx] : null;
      if (el) setSpot({ left: el.offsetLeft, width: el.offsetWidth, opacity: 1 });
    };
    const id = setTimeout(remeasure, 80); // after font swap
    window.addEventListener("resize", remeasure);
    return () => { clearTimeout(id); window.removeEventListener("resize", remeasure); };
  }, [activeGroupIdx]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenIdx(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close on outside click (covers click-opened menus where the cursor never leaves)
  useEffect(() => {
    if (openIdx === null) return;
    const onDown = (e: MouseEvent) => {
      if (menubarRef.current && !menubarRef.current.contains(e.target as Node)) setOpenIdx(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openIdx]);

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

      {/* The gradient scrim that used to sit here washed any line of body copy
          passing under it to 1.7-2.3:1 — legible enough to notice, not enough
          to read. The nav's own ground is opaque, so content now meets a clean
          edge: fully readable, or fully behind the chrome. */}

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
          className="group/logo inline-flex items-center gap-1 text-xl font-normal tracking-widest text-fg hover:opacity-80 transition-opacity"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          onClick={() => { setOpen(false); playClick("ui"); }}
        >
          Jaya
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {/* Spotlight group — a soft accent highlight glides between the 3 menu triggers */}
          <div
            ref={menubarRef}
            className="relative flex items-center gap-1"
            onMouseLeave={scheduleClose}
          >
            {/* The gliding spotlight */}
            <span
              aria-hidden
              className="pointer-events-none absolute top-1/2 -translate-y-1/2 h-8 rounded-md
                         bg-surface-raised dark:bg-surface-raised
                         ring-1 ring-border dark:ring-border"
              style={{
                left: spot.left,
                width: spot.width,
                opacity: spot.opacity,
                transition: "left 0.42s cubic-bezier(0.22,1,0.36,1), width 0.42s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease",
              }}
            />
            {groups.map((g, i) => {
              const groupActive = g.items.some((it) => pathname.startsWith(it.href));
              const isOpen = openIdx === i;
              return (
                <div
                  key={g.label}
                  ref={(el) => { triggerRefs.current[i] = el; }}
                  className="relative"
                  onMouseEnter={() => openMenu(i)}
                >
                  <button
                    type="button"
                    aria-haspopup="true"
                    aria-expanded={isOpen}
                    onClick={() => { setOpenIdx(isOpen ? null : i); playClick("ui"); }}
                    className={`relative z-10 inline-flex items-center px-3 py-1.5 text-sm whitespace-nowrap transition-colors duration-200 ${
                      groupActive || isOpen
                        ? "text-fg font-semibold"
                        : hoverIdx === i
                        ? "text-fg"
                        : "text-fg-subtle"
                    }`}
                  >
                    {g.label}
                    <Chevron open={isOpen} />
                  </button>

                  {/* Dropdown panel — same glass treatment as the mobile drawer */}
                  <div
                    role="menu"
                    aria-label={g.label}
                    className={`absolute left-0 top-full mt-2 min-w-[252px] origin-top rounded-xl p-1.5
                      bg-surface/95 backdrop-blur-[14px] ring-1 ring-border
                      [box-shadow:0_8px_32px_-8px_rgb(0_0_0/0.12),0_2px_8px_-2px_rgb(0_0_0/0.06)]
                      dark:[box-shadow:0_8px_32px_-8px_rgb(0_0_0/0.5),0_2px_8px_-2px_rgb(0_0_0/0.3)]
                      transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                        isOpen
                          ? "visible opacity-100 translate-y-0 scale-100"
                          : "invisible opacity-0 -translate-y-1 scale-[0.98] pointer-events-none"
                      }`}
                  >
                    {g.items.map((it) => {
                      const active = pathname.startsWith(it.href);
                      return (
                        <Link
                          key={it.href}
                          href={it.href}
                          role="menuitem"
                          onClick={() => { setOpenIdx(null); playClick("nav"); }}
                          className={`group/item flex items-start gap-2.5 rounded-lg px-2.5 py-2 transition-colors duration-150 ${
                            active
                              ? "bg-surface-raised"
                              : "hover:bg-surface-raised"
                          }`}
                        >
                          <span data-face={GROUP_FACE[g.label]} className={`nav-chip mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full transition-transform duration-200 group-hover/item:scale-110 ${active ? "is-active" : ""}`}>
                            {it.icon}
                          </span>
                          <span className="min-w-0">
                            <span className={`block text-[13px] leading-tight ${active ? "text-fg font-semibold" : "text-fg-muted group-hover/item:text-fg font-medium"}`}>
                              {it.label}
                            </span>
                            <span className="block text-[11px] leading-tight text-fg-faint mt-0.5">
                              {it.desc}
                            </span>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cmd+K search trigger — wide rounded pill that reads like a search field */}
          <button
            onClick={() => { playClick("ui"); window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })); }}
            className="group/search ml-1.5 inline-flex items-center gap-2 w-44 lg:w-56 rounded-full border border-border bg-surface-raised pl-3.5 pr-1.5 py-1.5 text-xs text-fg-faint hover:text-fg hover:border-fg-muted transition-colors"
            aria-label="Search"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <span className="text-fg-faint group-hover/search:text-fg-muted transition-colors">Search…</span>
            <kbd className="ml-auto rounded-md border border-border bg-bg px-1.5 py-0.5 font-sans text-[10px] leading-none text-fg-faint">{isMac ? "⌘K" : "Ctrl K"}</kbd>
          </button>
          <SoundToggle />
          <ThemeToggle />
          <Link
            href="/chat"
            onClick={() => playClick("primary")}
            className="btn-avo group ml-2 relative inline-flex items-center px-5 py-1.5 rounded-full text-sm font-medium overflow-hidden"
          >
            <span className="flex items-center gap-1.5 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-x-10 group-hover:opacity-0">
              <SparkleIcon size={13} className="shrink-0" />
              Ask Avocado
            </span>
            <span className="absolute inset-0 flex items-center justify-center translate-x-10 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] text-sm font-medium">
              Chat →
            </span>
          </Link>

          {/* Utility buttons — visually separated at the far right */}
          <div className="flex items-center gap-0.5 ml-2 pl-2 border-l border-border">
            <InstallPWA variant="nav" />
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
            className={`inline-flex items-center gap-1.5 rounded px-2.5 min-h-11 text-xs transition-all duration-300 ${
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
          {/* The site map lives behind the seed: tapping it opens every page as
              bubbles (the same map as the home page's "Explore the rest"). */}
          <button
            className="inline-flex items-center justify-center w-11 h-11 rounded-full transition-transform active:scale-95"
            onClick={() => { setOpen(!open); playClick("ui"); }}
            aria-label={open ? "Close site map" : "Open site map"}
            aria-expanded={open}
          >
            <SeedAvatar size={30} />
          </button>
        </div>
        </div>{/* ↑ pill */}

        {/* ── Phone site map — a full-screen sheet of bubbles ──
            Portalled to <body>: the header is transformed (show/hide on
            scroll), which would otherwise make it the containing block for a
            fixed child. */}
        {open && typeof document !== "undefined" && createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Site map"
            className="site-sheet fixed inset-0 z-[70] flex flex-col overflow-y-auto overscroll-contain bg-bg md:hidden"
          >
            <div className="flex items-center justify-between px-4 py-3">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-1.5 text-xl tracking-widest text-fg"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
              >
                Jaya
              </Link>
              <button
                onClick={() => { setOpen(false); playClick("ui"); }}
                aria-label="Close site map"
                className="grid h-11 w-11 place-items-center rounded-full border border-border text-fg-muted"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="px-4 pb-4 pt-2 text-center">
              <p className="display-serif display-md text-fg">Where to?</p>
              <p className="mt-1 text-sm text-fg-subtle">Every page, by kind. The seed answers questions.</p>
            </div>

            <div className="px-2 pb-6">
              <SiteBubbles variant="sheet" onNavigate={() => { setOpen(false); playClick("nav"); }} />
            </div>

            <div className="mt-auto flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-border px-4 py-5 text-sm text-fg-muted">
              <InstallPWA variant="mobile" onTrigger={() => setOpen(false)} />
              <a href={profile.resume} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className="inline-flex items-center gap-1.5 hover:text-fg">
                Résumé ↗
              </a>
              <Link href="/admin" onClick={() => setOpen(false)} className="text-fg-faint hover:text-fg-subtle">Admin</Link>
            </div>
          </div>,
          document.body
        )}
      </div>{/* ↑ floating wrapper */}

      {/* Reading progress — only on individual blog/lab posts */}
      {/^\/(blog|lab)\/.+/.test(pathname) && <ReadingProgress />}
    </header>
  );
}

"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import GVLink from "@/components/gradevitian/GVLink";
import GVSearchModal from "@/components/gradevitian/GVSearchModal";
import GVInstall from "@/components/gradevitian/GVInstall";
import { useGVAuth } from "@/components/gradevitian/GVAuthProvider";
import { GV_GROUPS as groups } from "@/lib/gradevitian/nav";

const ic = {
  width: 16, height: 16, viewBox: "0 0 24 24", fill: "none",
  stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
};

const NewTag = () => (
  <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-accent">New</span>
);

const GradHat = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M22 10 12 5 2 10l10 5 10-5Z" />
    <path d="M6 12v4.5c0 .9 2.7 2.5 6 2.5s6-1.6 6-2.5V12" />
    <path d="M22 10v5" />
  </svg>
);

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

const Wordmark = () => (
  <>
    <span className="text-accent"><GradHat /></span>
    <span>grade<span className="text-accent">VIT</span>ian</span>
  </>
);

export default function GVNav() {
  const pathname = usePathname();
  const { user, loading, logout } = useGVAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const [userMenu, setUserMenu] = useState(false);
  const [search, setSearch] = useState(false);

  // ── Scroll-hide/show refs (mirrors the portfolio Nav) ─────────
  const lastScrollY = useRef(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openRef = useRef(open);
  useEffect(() => { openRef.current = open; }, [open]);

  // ── Dropdown menus + gliding spotlight ────────────────────────
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menubarRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [spot, setSpot] = useState({ left: 0, width: 0, opacity: 0 });

  // Normalize trailing slashes + the /gradevitian path-form prefix.
  const cur = (pathname || "/").replace(/\/+$/, "") || "/";
  const active = (href: string) => cur === href || cur === `/gradevitian${href}`;
  const activeGroupIdx = groups.findIndex((g) => g.items.some((it) => active(it.href)));

  const openMenu = (i: number) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenIdx(i);
    setHoverIdx(i);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => { setOpenIdx(null); setHoverIdx(null); }, 150);
  };

  // Close any open dropdown on navigation (adjust-state-during-render pattern).
  const [navPath, setNavPath] = useState(pathname);
  if (navPath !== pathname) {
    setNavPath(pathname);
    if (openIdx !== null) setOpenIdx(null);
  }

  // Move the spotlight to the open → hovered → active group, in that priority.
  useEffect(() => {
    const idx = openIdx ?? hoverIdx ?? activeGroupIdx;
    const el = idx != null && idx >= 0 ? triggerRefs.current[idx] : null;
    if (el) setSpot({ left: el.offsetLeft, width: el.offsetWidth, opacity: 1 });
    else setSpot((s) => ({ ...s, opacity: 0 }));
  }, [openIdx, hoverIdx, activeGroupIdx, pathname]);

  // Re-measure on resize (font / layout shifts).
  useEffect(() => {
    const remeasure = () => {
      const el = activeGroupIdx >= 0 ? triggerRefs.current[activeGroupIdx] : null;
      if (el) setSpot({ left: el.offsetLeft, width: el.offsetWidth, opacity: 1 });
    };
    const id = setTimeout(remeasure, 80);
    window.addEventListener("resize", remeasure);
    return () => { clearTimeout(id); window.removeEventListener("resize", remeasure); };
  }, [activeGroupIdx]);

  // Close dropdowns on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenIdx(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ⌘K / Ctrl-K opens the search palette.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearch((s) => !s);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close dropdowns / user menu on outside click.
  useEffect(() => {
    if (openIdx === null && !userMenu) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (openIdx !== null && menubarRef.current && !menubarRef.current.contains(t)) setOpenIdx(null);
      if (userMenu && userRef.current && !userRef.current.contains(t)) setUserMenu(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openIdx, userMenu]);

  // Scroll: shadow at 48px + hide-on-down / show-on-up.
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastScrollY.current;
      setScrolled(y > 48);

      if (y <= 10) {
        clearTimeout(hideTimer.current ?? undefined);
        clearTimeout(idleTimer.current ?? undefined);
        setNavVisible(true);
      } else if (delta > 6 && !openRef.current) {
        clearTimeout(idleTimer.current ?? undefined);
        clearTimeout(hideTimer.current ?? undefined);
        hideTimer.current = setTimeout(() => setNavVisible(false), 120);
      } else if (delta < -4) {
        clearTimeout(hideTimer.current ?? undefined);
        clearTimeout(idleTimer.current ?? undefined);
        setNavVisible(true);
      }
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
      className={`sticky top-0 z-50 relative will-change-transform bg-bg ${
        navVisible
          ? "translate-y-0 transition-transform duration-[480ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
          : "-translate-y-[110%] transition-transform duration-[220ms] ease-in"
      }`}
    >
      {/* Gradient scrim — air gap between nav and content */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-full h-16"
        style={{ background: "linear-gradient(to bottom, var(--bg) 0%, transparent 100%)" }}
      />

      <div className="py-2 px-2 lg:px-4">
        {/* The nav pill — gains bg + shadow + dot-grid on scroll */}
        <div
          className={`relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-2
            transition-[background-color,box-shadow] duration-400 ease-out ${
              scrolled
                ? "bg-bg dark:bg-surface [box-shadow:0_8px_32px_-8px_rgb(0_0_0/0.08),0_2px_8px_-2px_rgb(0_0_0/0.04)] dark:[box-shadow:0_8px_32px_-8px_rgb(0_0_0/0.45),0_2px_8px_-2px_rgb(0_0_0/0.25)]"
                : "bg-transparent shadow-none"
            }`}
        >
          <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className={`hero-dot-grid absolute inset-0 transition-opacity duration-400 ${scrolled ? "opacity-[0.18]" : "opacity-0"}`} />
          </div>

          {/* Logo */}
          <GVLink
            href="/"
            onClick={() => setOpen(false)}
            className="inline-flex items-center gap-2 text-xl font-normal tracking-widest text-fg transition-opacity hover:opacity-70"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            <Wordmark />
          </GVLink>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            <div ref={menubarRef} className="relative flex items-center gap-1" onMouseLeave={scheduleClose}>
              {/* Gliding spotlight */}
              <span
                aria-hidden
                className="pointer-events-none absolute top-1/2 -translate-y-1/2 h-8 rounded-md bg-surface-raised ring-1 ring-border"
                style={{
                  left: spot.left,
                  width: spot.width,
                  opacity: spot.opacity,
                  transition: "left 0.42s cubic-bezier(0.22,1,0.36,1), width 0.42s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease",
                }}
              />
              {groups.map((g, i) => {
                const groupActive = g.items.some((it) => active(it.href));
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
                      onClick={() => setOpenIdx(isOpen ? null : i)}
                      className={`relative z-10 inline-flex items-center px-3 py-1.5 text-sm whitespace-nowrap transition-colors duration-200 ${
                        groupActive || isOpen ? "text-fg font-semibold" : hoverIdx === i ? "text-fg" : "text-fg-subtle"
                      }`}
                    >
                      {g.label}
                      <Chevron open={isOpen} />
                    </button>

                    {/* Dropdown panel — glassy, scales/translates in */}
                    <div
                      role="menu"
                      aria-label={g.label}
                      className={`absolute left-0 top-full mt-2 min-w-[268px] origin-top rounded-xl p-1.5
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
                        const isActive = active(it.href);
                        return (
                          <GVLink
                            key={it.href}
                            href={it.href}
                            role="menuitem"
                            onClick={() => setOpenIdx(null)}
                            aria-current={isActive ? "page" : undefined}
                            className={`group/item flex items-start gap-2.5 rounded-lg px-2.5 py-2 transition-colors duration-150 ${
                              isActive ? "bg-surface-raised" : "hover:bg-surface-raised"
                            }`}
                          >
                            <span className={`mt-0.5 shrink-0 transition-colors ${isActive ? "text-accent" : "text-fg-faint group-hover/item:text-fg-muted"}`}>
                              {it.icon}
                            </span>
                            <span className="min-w-0">
                              <span className={`flex items-center gap-1.5 text-[13px] leading-tight ${isActive ? "text-fg font-semibold" : "text-fg-muted group-hover/item:text-fg font-medium"}`}>
                                {it.label}{it.isNew && <NewTag />}
                              </span>
                              <span className="mt-0.5 block text-[11px] leading-tight text-fg-faint">{it.desc}</span>
                            </span>
                          </GVLink>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ⌘K search field */}
            <button
              onClick={() => setSearch(true)}
              className="group/search ml-1.5 inline-flex items-center gap-2 w-44 lg:w-56 rounded-full border border-border bg-surface-raised pl-3.5 pr-1.5 py-1.5 text-xs text-fg-faint hover:text-fg hover:border-fg-muted transition-colors"
              aria-label="Search"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <span className="text-fg-faint group-hover/search:text-fg-muted transition-colors">Search…</span>
              <kbd className="ml-auto rounded-md border border-border bg-bg px-1.5 py-0.5 font-sans text-[10px] leading-none text-fg-faint">⌘K</kbd>
            </button>

            <ThemeToggle />

            {/* Auth */}
            {!loading && (user ? (
              <div className="relative ml-1" ref={userRef}>
                <button
                  onClick={() => setUserMenu((o) => !o)}
                  aria-haspopup="menu"
                  aria-expanded={userMenu}
                  className="flex items-center gap-2 rounded-full border border-border bg-surface-raised py-1 pl-1 pr-2.5 text-sm font-medium text-fg transition hover:border-fg-muted"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-accent text-xs font-bold text-accent-fg">
                    {(user.name[0] ?? user.username[0] ?? "?").toUpperCase()}
                  </span>
                  <span className="hidden lg:inline">{user.username}</span>
                  <Chevron open={userMenu} />
                </button>
                {userMenu && (
                  <div role="menu" className="animate-gv-pop absolute right-0 mt-2 w-56 overflow-hidden rounded-xl bg-surface/95 p-1.5 ring-1 ring-border backdrop-blur-[14px] [box-shadow:0_8px_32px_-8px_rgb(0_0_0/0.12)] dark:[box-shadow:0_8px_32px_-8px_rgb(0_0_0/0.5)]">
                    <div className="px-3 py-2">
                      <p className="truncate text-sm font-semibold text-fg">{user.name}</p>
                      <p className="truncate text-xs text-fg-muted">{user.email}</p>
                    </div>
                    <div className="my-1 h-px bg-border" />
                    <GVLink href="/account" onClick={() => setUserMenu(false)} role="menuitem" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-fg-muted transition hover:bg-surface-raised hover:text-fg">
                      <svg {...ic}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                      Your account
                    </GVLink>
                    <button onClick={() => { setUserMenu(false); logout(); }} role="menuitem" className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-rose-600 transition hover:bg-rose-500/10 dark:text-rose-400">
                      <svg {...ic}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <GVLink href="/login" className="ml-1 hidden rounded-full px-3 py-1.5 text-sm font-semibold text-fg-muted transition hover:text-fg lg:inline">
                  Log in
                </GVLink>
                <GVLink href="/signup" className="ml-1 inline-flex rounded-full bg-fg px-4 py-1.5 text-sm font-medium text-bg transition-opacity hover:opacity-75">
                  Sign up
                </GVLink>
              </>
            ))}

            <div className="flex items-center gap-0.5 ml-2 pl-2 border-l border-border">
              <GVInstall variant="nav" />
            </div>
          </nav>

          {/* Mobile controls */}
          <div className="md:hidden flex items-center gap-1">
            <button
              onClick={() => setSearch(true)}
              className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs transition-all duration-300 ${
                scrolled ? "border border-border bg-surface-raised text-fg-faint hover:text-fg hover:border-fg-muted" : "border border-transparent text-fg-subtle hover:text-fg"
              }`}
              aria-label="Search"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <span>Search</span>
            </button>
            <ThemeToggle />
            <button
              className="p-2 rounded text-fg-subtle hover:text-fg hover:bg-surface-raised transition-colors"
              onClick={() => setOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {open ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>{/* ↑ pill */}

        {/* Mobile drawer — floats below pill, same glass treatment, grouped */}
        {open && (
          <div className="md:hidden mt-1.5 overflow-hidden rounded-xl bg-surface/92 backdrop-blur-[14px] [box-shadow:0_8px_32px_-8px_rgb(0_0_0/0.10),_0_2px_8px_-2px_rgb(0_0_0/0.06)] dark:[box-shadow:0_8px_32px_-8px_rgb(0_0_0/0.45),_0_2px_8px_-2px_rgb(0_0_0/0.25)]">
            <nav className="flex flex-col px-2 pt-2 pb-2">
              {groups.map((g, gi) => (
                <div key={g.label} className={gi > 0 ? "mt-1 pt-1 border-t border-border/60" : ""}>
                  <p className="px-3 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-faint">{g.label}</p>
                  {g.items.map((it) => {
                    const isActive = active(it.href);
                    return (
                      <GVLink
                        key={it.href}
                        href={it.href}
                        onClick={() => setOpen(false)}
                        aria-current={isActive ? "page" : undefined}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors ${
                          isActive ? "bg-surface-raised text-fg font-medium" : "text-fg-muted hover:bg-surface-raised hover:text-fg"
                        }`}
                      >
                        <span className={`shrink-0 ${isActive ? "text-accent" : "text-fg-faint"}`}>{it.icon}</span>
                        <span className="flex items-center gap-1.5">{it.label}{it.isNew && <NewTag />}</span>
                      </GVLink>
                    );
                  })}
                </div>
              ))}

              <div className="mt-1 pt-1 border-t border-border/60">
                <GVLink href="/feedback" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded text-sm text-fg-muted hover:bg-surface-raised transition-colors">
                  <svg {...ic}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                  Feedback
                </GVLink>
                <GVInstall variant="mobile" onTrigger={() => setOpen(false)} />
                {!loading && !user && (
                  <>
                    <GVLink href="/login" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded text-sm text-fg-muted hover:bg-surface-raised transition-colors">
                      <svg {...ic}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" /></svg>
                      Log in
                    </GVLink>
                    <GVLink href="/signup" onClick={() => setOpen(false)} className="mt-1 flex items-center justify-center gap-2 rounded-full bg-fg px-3 py-2.5 text-sm font-medium text-bg">
                      Sign up
                    </GVLink>
                  </>
                )}
                {!loading && user && (
                  <>
                    <GVLink href="/account" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded text-sm text-fg-muted hover:bg-surface-raised transition-colors">
                      <svg {...ic}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                      Your account
                    </GVLink>
                    <button onClick={() => { setOpen(false); logout(); }} className="flex w-full items-center gap-3 px-3 py-2.5 rounded text-sm text-rose-600 hover:bg-rose-500/10 dark:text-rose-400 transition-colors">
                      <svg {...ic}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
                      Log out
                    </button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>{/* ↑ floating wrapper */}

      {search && <GVSearchModal onClose={() => setSearch(false)} />}
    </header>
  );
}

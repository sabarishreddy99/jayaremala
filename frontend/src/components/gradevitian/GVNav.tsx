"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import GVLink from "@/components/gradevitian/GVLink";
import GVSearchModal from "@/components/gradevitian/GVSearchModal";
import GVInstall from "@/components/gradevitian/GVInstall";
import { useGVAuth } from "@/components/gradevitian/GVAuthProvider";
import { GV_GROUPS } from "@/lib/gradevitian/nav";

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

export default function GVNav() {
  const pathname = usePathname();
  const { user, loading, logout } = useGVAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [openCat, setOpenCat] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const catRef = useRef<HTMLDivElement>(null);

  // Close the category dropdown on outside click and on Escape.
  useEffect(() => {
    if (openCat === null) return;
    const onDown = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setOpenCat(null);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenCat(null); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [openCat]);

  // Close the dropdown whenever the route changes.
  const [navPath, setNavPath] = useState(pathname);
  if (navPath !== pathname) { setNavPath(pathname); if (openCat !== null) setOpenCat(null); }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!userMenu) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenu(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [userMenu]);

  // Lock background scroll while the mobile menu is open.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Normalize trailing slashes (trailingSlash:true means the path is e.g. "/gpa/")
  // and the /gradevitian prefix used on the path-form mount.
  const cur = (pathname || "/").replace(/\/+$/, "") || "/";
  const active = (href: string) => cur === href || cur === `/gradevitian${href}`;

  return (
    <>
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled || open
          ? "border-b border-border-subtle bg-surface/80 shadow-[0_1px_20px_-8px_rgba(0,0,0,0.25)] backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <GVLink
          href="/"
          onClick={() => setOpen(false)}
          className="inline-flex items-center gap-2 text-xl font-normal tracking-widest text-fg transition-opacity hover:opacity-70"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
        >
          <span className="text-accent"><GradHat /></span>
          <span>grade<span className="text-accent">VIT</span>ian</span>
        </GVLink>

        {/* Desktop: categorical dropdowns */}
        <div ref={catRef} className="hidden items-center gap-0.5 rounded-2xl border border-border-subtle bg-surface/50 p-1 backdrop-blur md:flex">
          {GV_GROUPS.map((g) => {
            const groupActive = g.items.some((it) => active(it.href));
            const isOpen = openCat === g.label;
            return (
              <div
                key={g.label}
                className="relative"
                onMouseEnter={() => setOpenCat(g.label)}
                onMouseLeave={() => setOpenCat(null)}
              >
                <button
                  onClick={() => setOpenCat(isOpen ? null : g.label)}
                  aria-haspopup="true"
                  aria-expanded={isOpen}
                  className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-[13px] font-medium transition-all duration-200 ${
                    groupActive || isOpen ? "bg-accent-light text-accent shadow-sm" : "text-fg-subtle hover:text-fg"
                  }`}
                >
                  {g.label}
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} aria-hidden>
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                {/* pt-2 bridges the gap so the panel stays open on hover travel */}
                <div className={`absolute left-1/2 top-full -translate-x-1/2 pt-2 ${isOpen ? "block" : "hidden"}`}>
                  <div className="animate-gv-pop w-72 overflow-hidden rounded-2xl border border-border-subtle bg-surface p-1.5 shadow-xl">
                    {g.items.map((it) => (
                      <GVLink
                        key={it.href}
                        href={it.href}
                        onClick={() => setOpenCat(null)}
                        aria-current={active(it.href) ? "page" : undefined}
                        className={`flex items-start gap-3 rounded-xl px-3 py-2.5 transition ${active(it.href) ? "bg-accent-light" : "hover:bg-surface-raised"}`}
                      >
                        <span className={`mt-0.5 shrink-0 ${active(it.href) ? "text-accent" : "text-fg-subtle"}`}>{it.icon}</span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5 text-sm font-semibold text-fg">
                            {it.label}{it.isNew && <NewTag />}
                          </span>
                          <span className="mt-0.5 block text-xs leading-snug text-fg-muted">{it.desc}</span>
                        </span>
                      </GVLink>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <GVInstall variant="nav" />
          <ThemeToggle />
          {!loading &&
            (user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setUserMenu((o) => !o)}
                  aria-haspopup="menu"
                  aria-expanded={userMenu}
                  className="flex items-center gap-2 rounded-full border border-border-subtle bg-surface/60 py-1 pl-1 pr-2.5 text-sm font-medium text-fg backdrop-blur transition hover:border-border-strong"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-accent text-xs font-bold text-accent-fg">
                    {(user.name[0] ?? user.username[0] ?? "?").toUpperCase()}
                  </span>
                  <span className="hidden sm:inline">{user.username}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${userMenu ? "rotate-180" : ""}`} aria-hidden>
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                {userMenu && (
                  <div role="menu" className="animate-gv-pop absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-border-subtle bg-surface p-1.5 shadow-xl">
                    <div className="px-3 py-2">
                      <p className="truncate text-sm font-semibold text-fg">{user.name}</p>
                      <p className="truncate text-xs text-fg-muted">{user.email}</p>
                    </div>
                    <div className="my-1 h-px bg-border-subtle" />
                    <GVLink href="/account" onClick={() => setUserMenu(false)} role="menuitem" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-fg-muted transition hover:bg-surface-raised hover:text-fg">
                      <svg {...ic}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                      Your account
                    </GVLink>
                    <button onClick={() => { setUserMenu(false); logout(); }} role="menuitem" className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-rose-600 transition hover:bg-rose-500/10 dark:text-rose-400">
                      <svg {...ic}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <GVLink href="/login" className="hidden rounded-full px-3 py-1.5 text-sm font-semibold text-fg-muted transition hover:text-fg sm:inline">
                  Log in
                </GVLink>
                <GVLink href="/signup" className="hidden rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-accent-fg shadow-sm shadow-accent/25 transition-all duration-200 hover:bg-accent-hover active:scale-[0.97] sm:inline-flex">
                  Sign up
                </GVLink>
              </>
            ))}
          <button
            onClick={() => setSearch(true)}
            className="hidden rounded-lg p-1.5 text-fg-muted transition hover:bg-surface-raised md:inline-flex"
            aria-label="Search"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
          </button>
          <button
            onClick={() => setOpen((o) => !o)}
            className="rounded-lg p-1.5 text-fg-muted transition hover:bg-surface-raised md:hidden"
            aria-label="Toggle menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M3 12h18M3 6h18M3 18h18" />}
            </svg>
          </button>
        </div>
      </nav>

    </header>

      {/* ── Mobile menu — a fixed, viewport-pinned drawer ──────────────────────
          Anchored to the device viewport (position: fixed) with its own header +
          close button, so it stays put on scroll regardless of how the page sticky
          context behaves. Slides down from the top; tap the dim layer to close. */}
      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="animate-gv-fade fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm md:hidden"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="animate-gv-drawer fixed inset-x-0 top-0 z-[61] flex max-h-[100dvh] flex-col overflow-hidden rounded-b-3xl border-b border-border-subtle bg-surface/95 shadow-2xl backdrop-blur-2xl md:hidden"
            style={{ paddingTop: "max(0px, env(safe-area-inset-top))" }}
          >
            {/* Drawer header — logo + close, mirrors the nav bar */}
            <div className="flex items-center justify-between px-4 py-3">
              <GVLink
                href="/"
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-2 text-xl font-normal tracking-widest text-fg"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
              >
                <span className="text-accent"><GradHat /></span>
                <span>grade<span className="text-accent">VIT</span>ian</span>
              </GVLink>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-1.5 text-fg-muted transition hover:bg-surface-raised"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable links */}
            <div className="flex-1 overflow-y-auto overscroll-contain border-t border-border-subtle px-3 py-3" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
              {GV_GROUPS.map((g) => (
                <div key={g.label} className="mb-1">
                  <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-fg-subtle">{g.label}</p>
                  {g.items.map((it) => (
                    <GVLink
                      key={it.href}
                      href={it.href}
                      onClick={() => setOpen(false)}
                      aria-current={active(it.href) ? "page" : undefined}
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                        active(it.href) ? "bg-accent-light text-accent" : "text-fg-muted"
                      }`}
                    >
                      <span className="shrink-0">{it.icon}</span>
                      <span className="flex items-center gap-1.5">{it.label}{it.isNew && <NewTag />}</span>
                    </GVLink>
                  ))}
                </div>
              ))}
              <div className="my-1 h-px bg-border-subtle" />
              <GVLink href="/feedback" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-fg-muted">
                <svg {...ic}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                Feedback
              </GVLink>
              <GVInstall variant="mobile" onTrigger={() => setOpen(false)} />
              {!loading && !user && (
                <>
                  <GVLink href="/login" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-fg-muted">
                    <svg {...ic}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" /></svg>
                    Log in
                  </GVLink>
                  <GVLink href="/signup" onClick={() => setOpen(false)} className="mt-1 flex items-center justify-center gap-2 rounded-full bg-accent px-3 py-2.5 text-sm font-semibold text-accent-fg">
                    Sign up
                  </GVLink>
                </>
              )}
              {!loading && user && (
                <>
                  <GVLink href="/account" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-fg-muted">
                    <svg {...ic}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    Your account
                  </GVLink>
                  <button onClick={() => { setOpen(false); logout(); }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 dark:text-rose-400">
                    <svg {...ic}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
                    Log out
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Mobile: floating search button pinned bottom-right */}
      <button
        onClick={() => setSearch(true)}
        aria-label="Search"
        className="fixed bottom-5 right-5 z-30 grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-fg shadow-lg shadow-accent/30 transition-transform active:scale-95 md:hidden"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
      </button>

      {search && <GVSearchModal onClose={() => setSearch(false)} />}
    </>
  );
}

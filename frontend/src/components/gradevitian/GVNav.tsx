"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import GVLink from "@/components/gradevitian/GVLink";
import { useGVAuth } from "@/components/gradevitian/GVAuthProvider";

const TOOLS = [
  { href: "/gpa", label: "GPA" },
  { href: "/cgpa", label: "CGPA" },
  { href: "/grade-predictor", label: "Grade Predictor" },
  { href: "/cgpa-estimator", label: "CGPA Estimator" },
  { href: "/attendance", label: "Attendance" },
];

export default function GVNav() {
  const pathname = usePathname();
  const { user, loading } = useGVAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const active = (href: string) => pathname === href || pathname === `/gradevitian${href}`;

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-border-subtle bg-surface/75 shadow-[0_1px_20px_-8px_rgba(0,0,0,0.25)] backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <GVLink
          href="/"
          onClick={() => setOpen(false)}
          className="inline-flex items-center text-xl font-normal tracking-widest text-fg transition-opacity hover:opacity-70"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
        >
          grade<span className="text-accent">VIT</span>ian
        </GVLink>

        <div className="hidden items-center gap-0.5 rounded-2xl border border-border-subtle bg-surface/50 p-1 backdrop-blur md:flex">
          {TOOLS.map((t) => (
            <GVLink
              key={t.href}
              href={t.href}
              className={`rounded-xl px-3 py-1.5 text-[13px] font-medium transition-all duration-200 ${
                active(t.href) ? "bg-surface text-accent shadow-sm" : "text-fg-subtle hover:text-fg"
              }`}
            >
              {t.label}
            </GVLink>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {!loading &&
            (user ? (
              <GVLink
                href="/account"
                className="flex items-center gap-2 rounded-full border border-border-subtle bg-surface/60 py-1 pl-1 pr-3 text-sm font-medium text-fg backdrop-blur transition hover:border-border-strong"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-accent text-xs font-bold text-accent-fg">
                  {(user.name[0] ?? user.username[0] ?? "?").toUpperCase()}
                </span>
                <span className="hidden sm:inline">{user.username}</span>
              </GVLink>
            ) : (
              <>
                <GVLink href="/login" className="hidden rounded-xl px-3 py-1.5 text-sm font-semibold text-fg-muted transition hover:text-fg sm:inline">
                  Log in
                </GVLink>
                <GVLink href="/signup" className="rounded-xl bg-accent px-3.5 py-1.5 text-sm font-semibold text-accent-fg shadow-sm shadow-accent/25 transition-all duration-200 hover:bg-accent-hover active:scale-[0.97]">
                  Sign up
                </GVLink>
              </>
            ))}
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

      {open && (
        <div className="border-t border-border-subtle bg-surface/90 px-4 py-2 backdrop-blur-xl md:hidden">
          {TOOLS.map((t) => (
            <GVLink
              key={t.href}
              href={t.href}
              onClick={() => setOpen(false)}
              className={`block rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active(t.href) ? "bg-accent-light text-accent" : "text-fg-muted"
              }`}
            >
              {t.label}
            </GVLink>
          ))}
          <GVLink href="/feedback" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm font-medium text-fg-muted">
            Feedback
          </GVLink>
          {!loading && !user && (
            <GVLink href="/login" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm font-medium text-fg-muted">
              Log in
            </GVLink>
          )}
        </div>
      )}
    </header>
  );
}

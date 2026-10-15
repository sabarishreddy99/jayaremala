"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { profile } from "@/data/profile";
import InstallPWA from "@/components/ui/InstallPWA";
import { footerColumns as COLUMNS } from "@/lib/portfolio/site-nav";

const BUILD_YEAR = process.env.NEXT_PUBLIC_BUILD_YEAR;
const BUILD_DATE = process.env.NEXT_PUBLIC_BUILD_DATE;

// ── Dallas clock ─────────────────────────────────────────────────────────────
// A static export renders the footer once at build time, so the time can only
// exist on the client. useSyncExternalStore gives the server a null snapshot
// (nothing renders) and the browser a ticking one, with no hydration mismatch.
const clockFmt = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Chicago",
});
function subscribeClock(cb: () => void) {
  const t = setInterval(cb, 15_000);
  return () => clearInterval(t);
}
function useDallasTime() {
  return useSyncExternalStore(subscribeClock, () => clockFmt.format(Date.now()), () => null);
}

function editionLabel() {
  if (!BUILD_DATE) return null;
  const d = new Date(`${BUILD_DATE}T12:00:00Z`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

function IconLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="grid h-10 w-10 place-items-center rounded-full border border-bg/20 text-bg/70 transition-colors hover:border-bg/60 hover:text-bg"
    >
      {children}
    </a>
  );
}

/**
 * The back page.
 *
 * The site is a printed thing; the footer is where the sheet turns over. It is
 * a Skin band in both modes with Flesh as its only accent, so it can never
 * blend into the page above it. The top edge is perforated like a tear-off
 * stub, and a halved avocado is drawn in the corner.
 *
 * Order: the closing ask (book / email / Avocado), the sign-off writing itself
 * across the sheet, the index, then the colophon with a live Dallas clock.
 */
export default function Footer() {
  const [inView, setInView] = useState(false);
  const signRef = useRef<HTMLDivElement>(null);
  const dallas = useDallasTime();
  const edition = editionLabel();
  const signature = profile.hero?.signature ?? "Do hard things!";

  useEffect(() => {
    const el = signRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <footer className="back-page relative mt-auto bg-fg text-bg">
      <span aria-hidden className="back-page-perf" />
      {/* A halved avocado drawn in Flesh line-work, cropped by the corner:
          rind, flesh line and the stone. */}
      <svg aria-hidden viewBox="0 0 400 520" fill="none"
        className="pointer-events-none absolute -right-16 top-10 hidden h-[30rem] w-auto text-[var(--flesh)] opacity-[0.16] md:block lg:-right-6">
        <path d="M200 12C138 12 112 92 92 160C66 246 22 300 22 380C22 462 104 508 200 508C296 508 378 462 378 380C378 300 334 246 308 160C288 92 262 12 200 12Z" stroke="currentColor" strokeWidth="3" />
        <path d="M200 44C152 44 132 110 116 168C94 248 56 304 56 378C56 446 124 482 200 482C276 482 344 446 344 378C344 304 306 248 284 168C268 110 248 44 200 44Z" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 7" strokeLinecap="round" />
        <circle cx="200" cy="350" r="78" fill="currentColor" fillOpacity="0.35" stroke="currentColor" strokeWidth="3" />
        <path d="M168 318C182 304 204 300 222 308" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>

      <div className="relative mx-auto w-full max-w-6xl px-4 pb-28 pt-20 sm:px-6 sm:pb-8 md:px-8 xl:max-w-7xl 2xl:max-w-[90rem] sm:pt-24">
        {/* ── The closing ask ── */}
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-16">
          <div>
            <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-bg/55">
              {profile.availability?.open === false ? "Currently heads-down" : "Open to full-time · remote or hybrid"}
            </p>
            <h2 className="display-serif display-lg mt-3 max-w-[18ch] text-bg">Have a hard problem worth solving?</h2>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={profile.booking_url || `mailto:${profile.email}`}
                {...(profile.booking_url ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="btn-avo group inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
              >
                Book 30 minutes
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden
                  className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 rounded-full border border-bg/25 px-6 py-3 text-sm font-medium text-bg transition-colors duration-200 hover:border-[var(--flesh)] hover:bg-[var(--flesh)]/10"
              >
                Ask Avocado
              </Link>
            </div>
            <a
              href={`mailto:${profile.email}`}
              className="w-fit text-[0.9375rem] text-bg/75 underline decoration-bg/25 underline-offset-4 transition-colors hover:text-bg hover:decoration-bg"
            >
              {profile.email}
            </a>
          </div>
        </div>

        {/* ── The sign-off, written across the sheet ── */}
        <div ref={signRef} className="mt-16 border-t border-bg/15 pt-6 sm:mt-20">
          <p
            className={`back-page-sign signature-mark text-bg ${inView ? "is-written" : ""}`}
            style={{ fontSize: "clamp(3.25rem, 11vw, 9.5rem)", lineHeight: 1.1, paddingBottom: "0.22em", paddingRight: "0.08em" }}
          >
            {signature}
          </p>
          <span aria-hidden className={`back-page-sign-rule mt-1 block h-[3px] w-28 rounded-full bg-accent ${inView ? "is-written" : ""}`} />
        </div>

        {/* ── Index ── */}
        <div className="mt-16 grid gap-10 sm:mt-20 md:grid-cols-[1.2fr_2fr] lg:gap-16">
          <div>
            <Link
              href="/"
              className="text-2xl tracking-widest text-bg transition-opacity hover:opacity-70"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              Jaya
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-bg/65">{profile.hero?.discipline ?? profile.tagline}</p>
            <div className="mt-5 flex items-center gap-2.5">
              {profile.github && (
                <IconLink href={profile.github} label="GitHub">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/></svg>
                </IconLink>
              )}
              {profile.linkedin && (
                <IconLink href={profile.linkedin} label="LinkedIn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </IconLink>
              )}
              <IconLink href={`mailto:${profile.email}`} label="Email">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </IconLink>
              <span className="back-page-pwa"><InstallPWA variant="icon" /></span>
            </div>
          </div>

          <nav aria-label="Site index" className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="mb-3.5 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-bg/50">{col.title}</p>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="text-[0.9375rem] text-bg/75 underline decoration-transparent underline-offset-4 transition-colors hover:text-bg hover:decoration-bg/40"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* ── Colophon ── */}
        <div className="mt-16 flex flex-col gap-4 border-t border-bg/15 pt-6 font-mono text-[0.6875rem] tracking-[0.06em] text-bg/60 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <span>© {BUILD_YEAR} {profile.name}</span>
            {edition && <span className="uppercase">Edition of {edition}</span>}
            {dallas && (
              <span className="inline-flex items-center gap-1.5 uppercase">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" /> Dallas {dallas}
              </span>
            )}
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <a href="/feed.xml" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-bg">RSS</a>
            <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-bg">Sitemap</a>
            {profile.resume && (
              <a href={profile.resume} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-bg">Résumé</a>
            )}
            <a href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="transition-colors hover:text-bg">
              Back to top ↑
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

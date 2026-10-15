"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import AvocadoMark from "@/components/portfolio/AvocadoMark";
import { testimonials, type Testimonial } from "@/data/testimonials";

/**
 * "Kind words" as a deck of dealt cards.
 *
 * A featured line sits on top (a verbatim excerpt, marked by `pull` in
 * testimonials.json). Under it the testimonials are dealt as tilted,
 * overlapping cards in the Avocado palette — Skin, Paper, Flesh —
 * drifting slowly left to right in an endless loop.
 *
 * The track is a real horizontal scroller, so phones and iPads swipe it
 * natively (with snap) and a trackpad scrolls it. The drift is just
 * `scrollLeft` easing along on top: it pauses on hover, focus, touch, an
 * expanded card, off-screen, or via the pause button (moving content must be
 * stoppable), and never runs under reduced motion.
 */

const FACES = ["skin", "paper", "flesh"] as const;
type Face = (typeof FACES)[number];
const TILT = [-3, 2.5, -1.5, 3, -2.25];
const LIFT = [0, 14, -6, 10, -2];
const SPEED = 28; // px per second
const COPIES = 3;

const REDUCED = "(prefers-reduced-motion: reduce)";
function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
}

function formatDate(iso: string) {
  const d = new Date(`${iso}T12:00:00Z`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

export default function TestimonialDeck() {
  const items = testimonials;
  const featured = items.find((t) => t.pull);
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const reduced = useSyncExternalStore(subscribeReduced, () => window.matchMedia(REDUCED).matches, () => false);

  // Hold for a moment after any hand on the track (swipe, wheel, drag).
  const touchedAt = useRef(0);
  const visible = useRef(true);

  const halted = paused || hovering || expanded !== null || reduced;
  const haltedRef = useRef(halted);
  useEffect(() => { haltedRef.current = halted; }, [halted]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    // Start in the middle copy so there is room to loop either way.
    const setWidth = () => el.scrollWidth / COPIES;
    el.scrollLeft = setWidth();
    let pos = el.scrollLeft;
    let last = performance.now();
    let raf = 0;

    const wrap = () => {
      const w = setWidth();
      if (el.scrollLeft < w * 0.5) { el.scrollLeft += w; pos += w; }
      else if (el.scrollLeft > w * 1.5) { el.scrollLeft -= w; pos -= w; }
    };

    const tick = (now: number) => {
      const dt = Math.min(now - last, 64) / 1000;
      last = now;
      const idle = performance.now() - touchedAt.current > 2500;
      if (!haltedRef.current && idle && visible.current) {
        // A user scroll moved us: adopt their position instead of fighting it.
        if (Math.abs(el.scrollLeft - pos) > 2) pos = el.scrollLeft;
        pos -= SPEED * dt; // content travels left → right
        el.scrollLeft = pos;
        wrap();
      } else {
        pos = el.scrollLeft;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onUser = () => { touchedAt.current = performance.now(); };
    const onScroll = () => { if (performance.now() - touchedAt.current < 2500) wrap(); };
    el.addEventListener("wheel", onUser, { passive: true });
    el.addEventListener("touchstart", onUser, { passive: true });
    el.addEventListener("touchmove", onUser, { passive: true });
    el.addEventListener("pointerdown", onUser);
    el.addEventListener("scroll", onScroll, { passive: true });

    const io = new IntersectionObserver(([e]) => { visible.current = e.isIntersecting; });
    io.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      el.removeEventListener("wheel", onUser);
      el.removeEventListener("touchstart", onUser);
      el.removeEventListener("touchmove", onUser);
      el.removeEventListener("pointerdown", onUser);
      el.removeEventListener("scroll", onScroll);
    };
  }, []);

  const nudge = (dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    touchedAt.current = performance.now();
    el.scrollBy({ left: dir * 340, behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <div>
      {/* ── The featured line ── */}
      {featured?.pull && (
        <figure className="mx-auto mb-14 max-w-[40ch] text-center sm:mb-16">
          {/* The seed: a pit-brown stone with the mark pressed into it. */}
          <span aria-hidden className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-full bg-[var(--pit)] shadow-[inset_0_-6px_12px_rgb(0_0_0/0.18)]">
            <AvocadoMark className="h-7 w-7 [&_*]:!stroke-[var(--flesh)] [&_circle]:!fill-[var(--flesh)]" />
          </span>
          <blockquote className="display-serif text-[clamp(1.6rem,3.2vw,2.6rem)] leading-[1.12] text-fg text-balance">
            &ldquo;{featured.pull}&rdquo;
          </blockquote>
          <figcaption className="mt-5 text-sm text-fg-subtle">
            {featured.name} · {featured.designation}, {featured.company}
          </figcaption>
        </figure>
      )}

      {/* ── The deck ── */}
      <div
        className="relative"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <div
          ref={trackRef}
          role="region"
          aria-roledescription="carousel"
          aria-label="Testimonials from colleagues"
          tabIndex={0}
          onFocus={() => setHovering(true)}
          onBlur={() => setHovering(false)}
          className="deck-track -mx-4 flex overflow-x-auto px-4 pb-14 pt-10 sm:-mx-6 sm:px-6 md:-ml-8 md:mr-0 md:pl-8 md:pr-0"
        >
          {Array.from({ length: COPIES }).flatMap((_, copy) =>
            items.map((t, i) => {
              const key = `${copy}-${t.name}`;
              const clone = copy !== 1;
              return (
                <DeckCard
                  key={key}
                  item={t}
                  face={FACES[i % FACES.length]}
                  tilt={TILT[i % TILT.length]}
                  lift={LIFT[i % LIFT.length]}
                  clone={clone}
                  open={expanded === key}
                  onToggle={() => setExpanded((k) => (k === key ? null : key))}
                />
              );
            })
          )}
        </div>

        {/* Controls: pause is required for content that moves on its own. */}
        <div className="mt-2 flex items-center justify-between gap-4">
          <p className="text-[0.6875rem] font-mono uppercase tracking-[0.16em] text-fg-faint">
            {items.length} recommendations · LinkedIn
            <span className="ml-2 normal-case tracking-normal text-fg-faint/80 md:hidden">· swipe</span>
          </p>
          <div className="flex items-center gap-2">
            <DeckButton label="Previous" onClick={() => nudge(-1)}>
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </DeckButton>
            {!reduced && (
              <DeckButton label={paused ? "Play" : "Pause"} onClick={() => setPaused((p) => !p)} pressed={paused}>
                {paused ? <path d="M7 5l12 7-12 7z" /> : <path d="M8 5v14M16 5v14" />}
              </DeckButton>
            )}
            <DeckButton label="Next" onClick={() => nudge(1)}>
              <path d="M5 12h14M12 5l7 7-7 7" />
            </DeckButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeckButton({ label, onClick, pressed, children }: { label: string; onClick: () => void; pressed?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className="grid h-10 w-10 place-items-center rounded-full border border-border text-fg-muted transition-colors hover:border-fg-subtle hover:text-fg"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {children}
      </svg>
    </button>
  );
}

function DeckCard({
  item, face, tilt, lift, clone, open, onToggle,
}: {
  item: Testimonial;
  face: Face;
  tilt: number;
  lift: number;
  clone: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const long = item.description.length > 200;
  return (
    <article
      aria-hidden={clone || undefined}
      inert={clone || undefined}
      data-face={face}
      style={{ "--tilt": `${tilt}deg`, "--lift": `${lift}px` } as React.CSSProperties}
      className="deck-card relative flex w-[19.5rem] shrink-0 flex-col rounded-card py-6 pl-6 pr-10 sm:w-[23rem] sm:py-7 sm:pl-7 sm:pr-12"
    >
      <div className="flex items-center gap-2">
        <span className="deck-chip rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold">{item.company.split(",")[0]}</span>
        <span className="deck-soft font-mono text-[0.6875rem] uppercase tracking-[0.14em]">
          {item.source || "LinkedIn"} · <span className="tabular-nums">{formatDate(item.givenAt)}</span>
        </span>
      </div>

      <blockquote className={`deck-quote mt-5 text-[1.0625rem] font-medium leading-[1.5] ${open ? "" : "line-clamp-7"}`}>
        &ldquo;{item.description}&rdquo;
      </blockquote>
      {long && (
        <button type="button" onClick={onToggle} tabIndex={clone ? -1 : 0}
          className="deck-soft mt-3 w-fit text-sm font-medium underline decoration-current/30 underline-offset-4 hover:decoration-current">
          {open ? "Show less" : "Read all"}
        </button>
      )}

      <span aria-hidden className="flex-1" />
      <footer className="mt-6 flex items-center gap-3 border-t border-current/15 pt-5">
        <span className="deck-avatar grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-bold">{initials(item.name)}</span>
        <div className="min-w-0 flex-1">
          {item.linkedin ? (
            <a href={item.linkedin} target="_blank" rel="noopener noreferrer" tabIndex={clone ? -1 : 0}
              className="block truncate font-semibold underline decoration-transparent underline-offset-4 hover:decoration-current">
              {item.name}
            </a>
          ) : (
            <p className="truncate font-semibold">{item.name}</p>
          )}
          <p className="deck-soft truncate text-sm">{item.designation}</p>
        </div>
      </footer>
    </article>
  );
}

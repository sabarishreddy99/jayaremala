"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { testimonials, type Testimonial } from "@/data/testimonials";

function initials(name: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

function TestimonialCard({ item }: { item: Testimonial }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 sm:p-7 flex flex-col shadow-sm flex-shrink-0">
      <svg
        className="shrink-0 text-accent/30 mb-4"
        width="28" height="21" viewBox="0 0 32 24" fill="currentColor"
      >
        <path d="M0 24V14.4C0 6.4 5.12 1.6 15.36 0l1.28 2.56C11.52 3.84 8.96 6.4 8.32 10.24H14.4V24H0zm17.6 0V14.4C17.6 6.4 22.72 1.6 32.96 0l1.28 2.56C29.12 3.84 26.56 6.4 25.92 10.24H32V24H17.6z" />
      </svg>

      <p className="text-sm leading-7 text-fg-muted flex-1">{item.description}</p>

      <div className="mt-5 pt-4 border-t border-border-subtle">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
              {initials(item.name)}
            </div>
            <div className="min-w-0">
              {item.linkedin ? (
                <a href={item.linkedin} target="_blank" rel="noopener noreferrer"
                  className="text-sm font-semibold text-fg hover:text-accent transition-colors leading-snug block truncate">
                  {item.name || "Anonymous"}
                </a>
              ) : (
                <span className="text-sm font-semibold text-fg leading-snug block truncate">
                  {item.name || "Anonymous"}
                </span>
              )}
              {item.designation && <p className="text-xs text-fg-subtle leading-snug truncate">{item.designation}</p>}
              {item.company && <p className="text-xs font-medium text-accent truncate">{item.company}</p>}
            </div>
          </div>
          <div className="shrink-0 text-right">
            {item.source && (
              <span className="inline-flex items-center rounded-full bg-surface-raised px-2.5 py-1 text-[10px] font-semibold text-fg-subtle uppercase tracking-wide">
                {item.source}
              </span>
            )}
            {item.givenAt && <p className="mt-1.5 text-[10px] text-fg-faint">{formatDate(item.givenAt)}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

const SPEED = 0.025; // px/ms ≈ 25px/sec

export default function TestimonialsCarousel() {
  const total = testimonials.length;

  // Mobile carousel
  const [current, setCurrent] = useState(0);
  const next = useCallback(() => setCurrent((c) => (c + 1) % total), [total]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + total) % total), [total]);

  // Desktop auto-scroll
  const scrollRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || total === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let lastTime: number | null = null;
    let rafId: number;

    function tick(time: number) {
      if (el) {
        if (!pausedRef.current && lastTime !== null) {
          const delta = Math.min(time - lastTime, 50);
          el.scrollTop += SPEED * delta;
          const half = el.scrollHeight / 2;
          if (el.scrollTop >= half) el.scrollTop -= half;
        }
        lastTime = time;
      }
      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [total]);

  if (total === 0) return null;

  return (
    <section>
      {/* ── Mobile: header + inline nav arrows (always visible at top, never clipped) */}
      <div className="flex items-center justify-between mb-4 sm:hidden">
        <div className="flex items-center gap-2.5">
          <div className="w-0.5 h-3.5 rounded-full bg-gradient-to-b from-emerald-500 to-teal-500 shrink-0" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-fg-faint">Testimonials</h2>
        </div>
        {total > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={prev}
              aria-label="Previous testimonial"
              className="w-7 h-7 rounded-full border border-border bg-surface flex items-center justify-center text-fg-subtle hover:text-fg hover:border-border-strong transition-all"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <span className="text-[11px] text-fg-faint w-8 text-center tabular-nums">{current + 1} / {total}</span>
            <button
              onClick={next}
              aria-label="Next testimonial"
              className="w-7 h-7 rounded-full border border-border bg-surface flex items-center justify-center text-fg-subtle hover:text-fg hover:border-border-strong transition-all"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* ── Desktop: header */}
      <div className="hidden sm:flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-0.5 h-3.5 rounded-full bg-gradient-to-b from-emerald-500 to-teal-500 shrink-0" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-fg-faint">Testimonials</h2>
        </div>
        <span className="text-[11px] text-fg-faint">{total} recommendation{total !== 1 ? "s" : ""}</span>
      </div>

      {/* ── Mobile: carousel cards ───────────────────────────── */}
      <div className="sm:hidden">
        <div className="grid">
          {testimonials.map((item, i) => (
            <div
              key={i}
              style={{ gridArea: "1 / 1 / 2 / 2" }}
              className={`transition-opacity duration-300 ${i === current ? "opacity-100" : "opacity-0 pointer-events-none"}`}
              aria-hidden={i !== current}
            >
              <TestimonialCard item={item} />
            </div>
          ))}
        </div>

        {/* Dot indicators */}
        {total > 1 && (
          <div className="flex justify-center gap-1.5 mt-3">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Go to testimonial ${i + 1}`}
                className={`rounded-full transition-all duration-200 ${
                  i === current ? "w-5 h-2 bg-accent" : "w-2 h-2 bg-border-strong hover:bg-fg-subtle"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Desktop: auto-scroll ─────────────────────────────── */}
      <div className="hidden sm:block relative">
        <div
          ref={scrollRef}
          onMouseEnter={() => { pausedRef.current = true; }}
          onMouseLeave={() => { pausedRef.current = false; }}
          className="flex flex-col gap-4 max-h-[520px] overflow-y-auto [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          {[...testimonials, ...testimonials].map((item, i) => (
            <TestimonialCard key={i} item={item} />
          ))}
        </div>

        <div
          className="absolute top-0 inset-x-0 h-10 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, var(--color-bg, white) 0%, transparent 100%)" }}
        />
        <div
          className="absolute bottom-0 inset-x-0 h-14 pointer-events-none"
          style={{ background: "linear-gradient(to top, var(--color-bg, white) 0%, transparent 100%)" }}
        />
      </div>
    </section>
  );
}

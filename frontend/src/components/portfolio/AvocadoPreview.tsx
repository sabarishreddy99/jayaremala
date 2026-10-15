"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import SeedAvatar from "@/components/chat/SeedAvatar";
import type { AvocadoPreviewQA } from "@/data/profile";

const CHARS_PER_TICK = 2;
const TICK_MS = 22;
const HOLD_MS = 6500;

const REDUCED = "(prefers-reduced-motion: reduce)";
function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/**
 * The hero's right column on desktop: a small Avocado card that asks the
 * questions a recruiter would, and types out the answer.
 *
 * The answers are written from the knowledge base ahead of time and the card
 * says so ("Preview"). Faking a live model here would be the one dishonest
 * thing on a page whose whole claim is that it runs. The real thing is one
 * click away: "Ask this" hands the question to /chat.
 *
 * Motion: types, holds, moves on. Pauses on hover/focus and off-screen.
 * Under reduced motion the full answer shows at once and nothing auto-advances;
 * the numbered tabs still switch questions.
 */
export default function AvocadoPreview({ items }: { items: AvocadoPreviewQA[] }) {
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState(0);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  // Server renders the motion version; the client corrects without a
  // hydration mismatch because useSyncExternalStore knows both snapshots.
  const reduced = useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED).matches,
    () => false,
  );
  const rootRef = useRef<HTMLDivElement>(null);

  const item = items[idx];
  const done = typed >= item.a.length;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Typing.
  useEffect(() => {
    if (reduced || done || !visible) return;
    const t = setTimeout(() => setTyped((n) => n + CHARS_PER_TICK), TICK_MS);
    return () => clearTimeout(t);
  }, [typed, done, reduced, visible]);

  // Hold, then the next question.
  useEffect(() => {
    if (reduced || !done || paused || !visible) return;
    const t = setTimeout(() => {
      setIdx((i) => (i + 1) % items.length);
      setTyped(0);
    }, HOLD_MS);
    return () => clearTimeout(t);
  }, [done, paused, reduced, visible, items.length]);

  const show = (i: number) => {
    setIdx(i);
    setTyped(0);
  };

  const shown = reduced ? item.a : item.a.slice(0, typed);

  return (
    <div
      ref={rootRef}
      className="avo-stack group/stack relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Two sheets under the card, Skin and Flesh, peeking out like the
          rest of the deck. They fan a little further when the stack is
          hovered (see .avo-stack in globals.css). */}
      <div aria-hidden className="avo-stack-sheet is-skin absolute inset-0 rounded-card" />
      <div aria-hidden className="avo-stack-sheet is-flesh absolute inset-0 rounded-card" />

      <div className="avo-stack-front relative rounded-card border border-border bg-bg p-5 sm:p-6">
        <div className="flex items-center gap-2.5">
          <SeedAvatar size={26} />
          <p className="display-serif text-lg leading-none text-fg">Avocado</p>
          <span className="rounded-chip bg-accent-light px-1.5 py-px font-mono text-[0.625rem] uppercase tracking-[0.14em] text-accent">
            Preview
          </span>
          <span className="ml-auto font-mono text-[0.6875rem] tabular-nums text-fg-faint">
            {idx + 1}/{items.length}
          </span>
        </div>

        {/* min-h keeps the card from jumping as answers of different
            lengths type in. */}
        <div className="mt-5 min-h-[11.5rem]" key={idx}>
          <p className="animate-fade-up ml-auto w-fit max-w-[90%] rounded-2xl rounded-tr-md bg-accent px-3.5 py-2 text-[0.9375rem] leading-snug text-accent-fg">
            {item.q}
          </p>

          <p className="sr-only" aria-live="polite">{done || reduced ? item.a : ""}</p>
          <p aria-hidden className="mt-4 text-[0.9375rem] leading-relaxed text-fg-muted">
            {shown}
            {!reduced && !done && <span className="avo-caret ml-px inline-block h-[1.05em] w-[2px] translate-y-[3px] bg-accent" />}
          </p>

          {item.source && (done || reduced) && (
            <p className="animate-fade-up mt-3 inline-flex items-center gap-1.5 font-mono text-[0.6875rem] text-fg-subtle">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--pit)] dark:bg-[var(--flesh)]" />
              {item.source}
            </p>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-4 border-t border-border-subtle pt-4">
          <div className="flex items-center gap-1" role="group" aria-label="Example questions">
            {items.map((it, i) => (
              <button
                key={it.q}
                type="button"
                aria-pressed={i === idx}
                aria-label={it.q}
                onClick={() => show(i)}
                className="group grid h-6 w-6 place-items-center"
              >
                <span
                  className={`block h-1.5 rounded-full transition-all duration-300 ${
                    i === idx ? "w-4 bg-accent" : "w-1.5 bg-border-strong group-hover:bg-fg-subtle"
                  }`}
                />
              </button>
            ))}
          </div>
          <Link
            href={`/chat?q=${encodeURIComponent(item.q)}`}
            className="btn-avo-ghost group inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium"
          >
            Ask this
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden
              className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

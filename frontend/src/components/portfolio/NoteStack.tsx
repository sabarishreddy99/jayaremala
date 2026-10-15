"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

export interface Note {
  href: string;
  kind: string;
  meta: string;
  date: string;
  title: string;
  description: string;
  tags: string[];
  image?: string;
}

const FACES = ["paper", "skin", "flesh"] as const;
const TILT = [0, -2.5, 2, -1.5];
const VISIBLE = 3;
const THROW_MS = 420;

const REDUCED = "(prefers-reduced-motion: reduce)";
function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function formatDate(iso: string) {
  const d = new Date(`${iso}T12:00:00Z`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

/**
 * Writing as a pile of notes on the desk.
 *
 * The posts are a physical stack: the top card is the one you read, the two
 * beneath peek out tilted. "Next" (or a swipe / drag on the top card) throws
 * the top note off to the side and it slides back in at the bottom of the
 * pile; "Previous" pulls the bottom note back to the top. The index beside the
 * pile jumps straight to any note. Arrow keys work when the pile is focused.
 *
 * Unlike the testimonial deck (a drifting row) this is a single pile you work
 * through by hand — reading is deliberate, so nothing moves on its own.
 */
export default function NoteStack({ notes }: { notes: Note[] }) {
  const [order, setOrder] = useState(() => notes.map((_, i) => i));
  const [throwing, setThrowing] = useState<null | 1 | -1>(null);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<number | null>(null);
  const moved = useRef(false);
  const reduced = useSyncExternalStore(subscribeReduced, () => window.matchMedia(REDUCED).matches, () => false);

  const top = order[0];

  const next = useCallback(
    (dir: 1 | -1 = 1) => {
      if (throwing || notes.length < 2) return;
      if (reduced) {
        setOrder((o) => [...o.slice(1), o[0]]);
        return;
      }
      setThrowing(dir);
      window.setTimeout(() => {
        setOrder((o) => [...o.slice(1), o[0]]);
        setThrowing(null);
        setDrag(0);
      }, THROW_MS);
    },
    [throwing, notes.length, reduced]
  );

  const prev = useCallback(() => {
    if (throwing || notes.length < 2) return;
    setOrder((o) => [o[o.length - 1], ...o.slice(0, -1)]);
  }, [throwing, notes.length]);

  const jump = (i: number) => {
    if (throwing) return;
    setOrder((o) => {
      const at = o.indexOf(i);
      return [...o.slice(at), ...o.slice(0, at)];
    });
  };

  // Pointer drag on the top card: past 90px it is thrown in that direction.
  // The pointer is captured only once the card has actually moved. Capturing
  // on press would retarget the click to the card and the link would never
  // open — a plain tap or click must reach the link untouched.
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    dragStart.current = e.clientX;
    moved.current = false;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragStart.current === null) return;
    const dx = e.clientX - dragStart.current;
    if (!moved.current) {
      if (Math.abs(dx) < 8) return;
      moved.current = true;
      setDragging(true);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    setDrag(dx);
  };
  const onPointerUp = () => {
    if (dragStart.current === null) return;
    dragStart.current = null;
    if (!moved.current) return;
    setDragging(false);
    if (Math.abs(drag) > 90) next(drag > 0 ? 1 : -1);
    else setDrag(0);
  };

  const pileRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = pileRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") { e.preventDefault(); next(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [next, prev]);

  if (notes.length === 0) return null;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-center lg:gap-16">
      {/* ── The index ── */}
      <div className="order-2 lg:order-1">
        <ol className="border-t border-border-strong">
          {notes.map((n, i) => {
            const on = i === top;
            return (
              <li key={n.href} className="border-b border-border-subtle">
                <button
                  type="button"
                  onClick={() => jump(i)}
                  aria-current={on || undefined}
                  className="group flex w-full items-baseline gap-4 py-4 text-left"
                >
                  <span className="w-[5.5rem] shrink-0 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-subtle">
                    {n.kind}
                  </span>
                  <span className={`display-serif flex-1 text-[1.25rem] leading-snug transition-colors duration-300 ${on ? "text-fg" : "text-fg-faint group-hover:text-fg-muted"}`}>
                    {n.title}
                  </span>
                  <span aria-hidden className={`h-1.5 w-1.5 shrink-0 self-center rounded-full transition-colors ${on ? "bg-accent" : "bg-transparent"}`} />
                </button>
              </li>
            );
          })}
        </ol>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link href="/blog" className="btn-avo-ghost inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-medium">
            All writing →
          </Link>
          <Link href="/lab" className="text-sm font-medium text-fg-muted transition-colors hover:text-fg">
            Build logs in the lab
          </Link>
        </div>
      </div>

      {/* ── The pile ── */}
      <div className="order-1 lg:order-2">
        <div
          ref={pileRef}
          tabIndex={0}
          role="region"
          aria-roledescription="stack"
          aria-label="Writing — use the arrow keys to flip through"
          className="note-pile relative mx-auto h-[25rem] w-full max-w-[30rem] outline-offset-8 sm:h-[26rem]"
        >
          {order.slice(0, VISIBLE + 1).map((idx, depth) => {
            const n = notes[idx];
            const isTop = depth === 0;
            const hidden = depth >= VISIBLE;
            const face = FACES[idx % FACES.length];
            const style: React.CSSProperties = isTop
              ? throwing
                ? { transform: `translateX(${throwing * 120}%) rotate(${throwing * 14}deg)`, opacity: 0, zIndex: 20 }
                : { transform: `translateX(${drag}px) rotate(${drag / 22}deg)`, zIndex: 20, transition: dragging ? "none" : undefined }
              : {
                  transform: `translate(${depth * 14}px, ${depth * 12}px) rotate(${TILT[depth] ?? 0}deg) scale(${1 - depth * 0.035})`,
                  zIndex: 20 - depth,
                  opacity: hidden ? 0 : 1,
                };
            return (
              <article
                key={n.href}
                data-face={face}
                aria-hidden={!isTop || undefined}
                className={`note-card group absolute inset-0 flex flex-col overflow-hidden rounded-card ${isTop ? "cursor-pointer touch-pan-y" : "pointer-events-none"}`}
                style={style}
                {...(isTop ? { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp } : {})}
              >
                {n.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={n.image} alt="" draggable={false} className="h-36 w-full shrink-0 object-cover object-top sm:h-40" />
                ) : (
                  <div aria-hidden className="note-band flex h-20 shrink-0 items-end px-6 pb-3 sm:px-7">
                    <span className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] opacity-70">{n.tags.slice(0, 2).map((t) => `#${t}`).join("  ")}</span>
                  </div>
                )}
                <div className="flex flex-1 flex-col p-6 sm:p-7">
                  <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] opacity-75">
                    {n.kind} · {formatDate(n.date)} · {n.meta}
                  </p>
                  <h3 className="display-serif mt-3 text-[clamp(1.5rem,2.4vw,2rem)] leading-[1.1]">
                    {isTop ? (
                      // The title link stretches over the whole card, so a
                      // tap anywhere on the top note opens it.
                      <Link
                        href={n.href}
                        draggable={false}
                        onClick={(e) => { if (moved.current) e.preventDefault(); }}
                        className="outline-none after:absolute after:inset-0 after:rounded-card after:content-[''] focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-accent"
                      >
                        {n.title}
                      </Link>
                    ) : n.title}
                  </h3>
                  <p className="mt-3 line-clamp-3 text-[0.9375rem] leading-relaxed opacity-80">{n.description}</p>
                  <span className="flex-1" />
                  {isTop && (
                    <span aria-hidden className="note-read mt-5 inline-flex w-fit items-center gap-1.5 text-sm font-semibold underline decoration-current/30 underline-offset-4">
                      Read it
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {notes.length > 1 && (
          <div className="mx-auto mt-10 flex max-w-[30rem] items-center justify-between">
            <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-fg-faint tabular-nums">
              {String(top + 1).padStart(2, "0")} / {String(notes.length).padStart(2, "0")}
              <span className="ml-2 normal-case tracking-normal lg:hidden">· swipe the card</span>
            </p>
            <div className="flex items-center gap-2">
              <button type="button" aria-label="Previous note" onClick={prev}
                className="grid h-10 w-10 place-items-center rounded-full border border-border text-fg-muted transition-colors hover:border-accent hover:text-fg">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
              </button>
              <button type="button" aria-label="Next note" onClick={() => next(1)}
                className="btn-avo grid h-10 w-10 place-items-center rounded-full">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

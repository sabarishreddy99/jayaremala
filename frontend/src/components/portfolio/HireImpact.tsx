"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { HireBlock, HireNeed } from "@/data/profile";

/**
 * "What your team gets" — the recruiter's chapter.
 *
 * A hiring manager arrives with one problem, not five. So the page asks which
 * problem, and answers with the shipped evidence for it: one figure, where it
 * happened, and one sentence on how. The selected need is set in full ink and
 * the rest sit faint (the One Ink Rule), with the accent dot marking the live
 * choice.
 *
 * At lg the needs are a list beside a single evidence panel. Below lg each
 * answer opens inline under its own row, so a phone never has to scroll away
 * from the question to read the answer.
 */
export default function HireImpact({
  data,
  bookingUrl,
  resumeUrl,
}: {
  data: HireBlock;
  bookingUrl?: string;
  resumeUrl?: string;
}) {
  const [active, setActive] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const needs = data.needs;
  if (needs.length === 0) return null;

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const delta = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (i + delta + needs.length) % needs.length;
    setActive(next);
    buttons.current[next]?.focus();
  };

  return (
    <div>
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-14 xl:gap-20">
        <ul className="border-t border-border-strong" aria-label="Problems I can take off your plate">
          {needs.map((n, i) => {
            const on = i === active;
            return (
              <li key={n.need} className="border-b border-border-subtle">
                <button
                  ref={(el) => { buttons.current[i] = el; }}
                  type="button"
                  aria-expanded={on}
                  aria-controls={`hire-answer-${i}`}
                  onClick={() => setActive(i)}
                  onKeyDown={(e) => onKey(e, i)}
                  className="group flex w-full items-center gap-4 py-4 text-left sm:py-5"
                >
                  <span
                    aria-hidden
                    className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-300 ${
                      on ? "bg-accent" : "bg-border-strong group-hover:bg-fg-faint"
                    }`}
                  />
                  <span
                    className={`display-serif display-md flex-1 transition-colors duration-300 ${
                      on ? "text-fg" : "text-fg-faint group-hover:text-fg-muted"
                    }`}
                  >
                    {n.need}
                  </span>
                  <svg
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden
                    className={`shrink-0 transition-all duration-300 ${
                      on
                        ? "text-fg lg:translate-x-1 max-lg:-rotate-90"
                        : // Touch has no hover, so below lg the closed rows keep
                          // a faint chevron as their only "this opens" cue.
                          "text-fg-faint max-lg:rotate-90 lg:-translate-x-1 lg:opacity-0 lg:group-hover:translate-x-0 lg:group-hover:opacity-100"
                    }`}
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Phone/tablet: the answer opens in place. */}
                {on && (
                  <div id={`hire-answer-${i}`} className="pb-7 pl-[1.375rem] lg:hidden">
                    <Answer need={n} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {/* Desktop: one panel beside the list, sticky so it stays level with
            whichever row is being read. */}
        <div className="hidden lg:block">
          <div className="lg:sticky lg:top-[calc(var(--nav-h)+2rem)] border-t border-border-strong pt-7" aria-live="polite">
            <div key={active} className="animate-fade-up">
              <Answer need={needs[active]} large />
            </div>
            <p className="mt-8 font-mono text-[11px] tabular-nums text-fg-faint">
              {String(active + 1).padStart(2, "0")} / {String(needs.length).padStart(2, "0")}
              <span className="ml-3 text-fg-faint/80">↑ ↓ to switch</span>
            </p>
          </div>
        </div>
      </div>

      {/* The conversion sits directly under the evidence it was earned by. */}
      <div className="mt-10 flex flex-col gap-5 border-t border-border pt-7 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
        {data.fit && (
          <p className="max-w-[58ch] text-[0.9375rem] leading-relaxed text-fg-muted text-pretty">{data.fit}</p>
        )}
        <div className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-3">
          <a
            href={bookingUrl || "#contact"}
            {...(bookingUrl ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="btn-avo group inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium"
          >
            Book 30 minutes
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden
              className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
          {resumeUrl && (
            <a href={resumeUrl} target="_blank" rel="noopener noreferrer"
              className="text-sm font-medium text-fg-muted underline decoration-border underline-offset-4 transition-colors hover:text-fg hover:decoration-fg">
              Résumé
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function Answer({ need, large = false }: { need: HireNeed; large?: boolean }) {
  const external = need.href?.startsWith("http");
  const linkClass =
    "group mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-fg transition-colors hover:text-accent";
  const arrow = (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden
      className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5">
      <path d={external ? "M7 17L17 7M17 7H7M17 7v10" : "M5 12h14M12 5l7 7-7 7"} />
    </svg>
  );

  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-subtle">{need.where}</p>
      <p className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <CountUp
          value={need.metric}
          className={`font-mono font-semibold tabular-nums tracking-[-0.04em] text-fg ${
            large ? "text-[clamp(3.5rem,6vw,5.5rem)] leading-[0.9]" : "display-lg leading-none"
          }`}
        />
        <span className={`font-medium text-fg ${large ? "text-lg" : "text-base"} leading-snug`}>{need.metricLabel}</span>
      </p>
      {need.context && <p className="mt-3 text-sm leading-relaxed text-fg-subtle">{need.context}</p>}
      <p className={`mt-5 max-w-[52ch] border-t border-border-subtle pt-5 leading-relaxed text-fg-muted ${large ? "text-[0.9375rem]" : "text-sm"}`}>
        {need.how}
      </p>
      {need.href &&
        (external ? (
          <a href={need.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
            {need.linkLabel ?? "See it"} {arrow}
          </a>
        ) : (
          <Link href={need.href} className={linkClass}>
            {need.linkLabel ?? "See it"} {arrow}
          </Link>
        ))}
    </div>
  );
}

/** Counts the leading number of "78%" / "115GB" / "17K" up from zero each time
 *  it mounts. Renders the final value on the server and under reduced motion. */
function CountUp({ value, className }: { value: string; className?: string }) {
  const m = value.match(/^(\d+(?:\.\d+)?)(.*)$/);
  const target = m ? parseFloat(m[1]) : 0;
  const suffix = m ? m[2] : "";
  const [shown, setShown] = useState(target);

  useEffect(() => {
    if (!m || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / 700, 1);
      setShown(Math.round(target * (1 - (1 - t) ** 3)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!m) return <span className={className}>{value}</span>;
  return (
    <span className={className}>
      <span className="sr-only">{value}</span>
      <span aria-hidden>{shown}{suffix}</span>
    </span>
  );
}

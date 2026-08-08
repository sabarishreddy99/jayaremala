"use client";

import { useEffect, useState } from "react";
import ScrollReveal from "@/components/ScrollReveal";
import type { ShippedThing } from "@/data/profile";

/** Placeholder rendered before mount — same glyph count as a live counter, so
 *  hydration swaps digits in without shifting the row. */
const PLACEHOLDER = "· y ··· d ··:··:··";
const PLACEHOLDER_COARSE = "· y ··· d ··:··";

/** Elapsed time since `from`, as calendar years + remaining days + clock. */
function elapsed(fromISO: string, nowMs: number) {
  const from = new Date(`${fromISO}T00:00:00Z`);
  const now = new Date(nowMs);

  // Calendar years, so "6 y" lines up with how a person counts anniversaries.
  let years = now.getUTCFullYear() - from.getUTCFullYear();
  const anniversary = new Date(from);
  anniversary.setUTCFullYear(from.getUTCFullYear() + years);
  if (anniversary.getTime() > now.getTime()) {
    years -= 1;
    anniversary.setUTCFullYear(anniversary.getUTCFullYear() - 1);
  }

  const rest = now.getTime() - anniversary.getTime();
  const days = Math.floor(rest / 86_400_000);
  const hours = Math.floor(rest / 3_600_000) % 24;
  const minutes = Math.floor(rest / 60_000) % 60;
  const seconds = Math.floor(rest / 1000) % 60;

  return { years, days, hours, minutes, seconds };
}

const pad = (n: number, width = 2) => String(n).padStart(width, "0");

function spoken(fromISO: string, nowMs: number) {
  const { years, days } = elapsed(fromISO, nowMs);
  const y = years === 1 ? "one year" : `${years} years`;
  return `live for ${y} and ${days} days`;
}

/**
 * "Still running" — a ledger of things that are actually in production, each
 * with a live uptime counter. The seconds are the quietest thing in the row on
 * purpose: noticing them should feel like a discovery, not a demo.
 *
 * Archived rows make no uptime claim — they show their `sinceLabel` instead.
 */
export default function StillRunning({
  items,
  note,
}: {
  items: ShippedThing[];
  note?: string;
}) {
  // Never read the clock during render — this site is a static export, so the
  // first paint is build-time HTML and a Date.now() here is a hydration bomb.
  // `now: null` is the pre-mount state and renders a fixed-width placeholder.
  const [clock, setClock] = useState<{ now: number | null; coarse: boolean }>({
    now: null,
    coarse: false,
  });
  const { now, coarse } = clock;

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Mount gate: the clock is an external system, and this is the one
    // synchronous set that starts the subscription.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setClock({ now: Date.now(), coarse: reduced });
    // Reduced motion keeps the information and drops the twitch.
    const id = setInterval(
      () => setClock((c) => ({ ...c, now: Date.now() })),
      reduced ? 60_000 : 1000
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-1">
      {items.map((item, i) => {
        const isLive = item.status === "live";
        const e = now !== null && isLive ? elapsed(item.shippedAt, now) : null;

        return (
          <ScrollReveal key={item.name} delay={i * 110}>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group grid grid-cols-1 gap-x-4 gap-y-1.5 rounded-panel px-3 py-4 -mx-3 transition-colors duration-200 hover:bg-surface-raised sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline sm:py-3.5"
            >
              {/* ── Left: what it is, and who it's for ── */}
              <div className="min-w-0">
                <div className="flex items-baseline gap-2.5">
                  <span className="relative flex h-1.5 w-1.5 shrink-0 translate-y-[-1px]">
                    {isLive && (
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
                    )}
                    <span
                      className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
                        isLive ? "bg-accent" : "bg-fg-faint"
                      }`}
                    />
                  </span>

                  <span className="shrink-0 text-[15px] font-semibold text-fg sm:text-sm">{item.name}</span>

                  {/* Dot leader — same grammar as the Avocado boot sequence */}
                  <span
                    aria-hidden
                    className="hidden min-w-0 flex-1 select-none overflow-hidden whitespace-nowrap text-border transition-colors duration-200 group-hover:text-accent/40 lg:block"
                  >
                    ····································································
                  </span>

                  <span className="hidden shrink-0 text-[13px] text-fg-subtle lg:block">
                    {item.what}
                  </span>
                </div>

                <p className="mt-1 pl-4 text-sm text-fg-subtle lg:hidden">{item.what}</p>
                <p className="mt-1 pl-4 text-[11.5px] text-fg-faint sm:text-[11px]">{item.who}</p>
              </div>

              {/* ── Right: the counter ── */}
              <div className="flex items-baseline gap-3 pl-4 sm:pl-0">
                <span
                  className="font-mono text-[12.5px] tabular-nums sm:text-[13px]"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                  aria-hidden
                >
                  {!isLive ? (
                    <span className="text-fg-faint">{item.sinceLabel ?? "archived"}</span>
                  ) : e === null ? (
                    <span className="text-fg-faint">
                      {coarse ? PLACEHOLDER_COARSE : PLACEHOLDER}
                    </span>
                  ) : (
                    <>
                      <span className="text-fg">
                        {e.years} y {pad(e.days, 3)} d
                      </span>{" "}
                      <span className="text-fg-subtle">
                        {pad(e.hours)}:{pad(e.minutes)}
                        {!coarse && `:${pad(e.seconds)}`}
                      </span>
                    </>
                  )}
                </span>

                {/* Stable phrase for screen readers — never announce a ticking clock. */}
                <span className="sr-only">
                  {isLive
                    ? now === null
                      ? `${item.name}, live`
                      : `${item.name}, ${spoken(item.shippedAt, now)}`
                    : `${item.name}, archived, ${item.sinceLabel ?? ""}`}
                </span>

                <span
                  className={`shrink-0 text-[11px] transition-colors ${
                    isLive
                      ? "text-fg-faint group-hover:text-accent"
                      : "text-fg-faint/70 group-hover:text-fg-subtle"
                  }`}
                >
                  {isLive ? "live ↗" : "source ↗"}
                </span>
              </div>
            </a>
          </ScrollReveal>
        );
      })}

      {note && (
        <ScrollReveal delay={items.length * 110}>
          <p className="hanging-quote mt-8 border-l border-border-strong pl-4 text-sm text-fg-subtle">
            {note}
          </p>
        </ScrollReveal>
      )}
    </div>
  );
}

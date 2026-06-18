"use client";

import { useEffect, useState } from "react";
import GVLink from "@/components/gradevitian/GVLink";
import ScrollReveal from "@/components/ScrollReveal";
import { apiListComments, type GVComment } from "@/lib/gradevitian/auth";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" });

function Quote({ c }: { c: GVComment }) {
  return (
    <figure className="flex w-72 shrink-0 flex-col rounded-2xl border border-border-subtle bg-surface/70 p-5 backdrop-blur-xl sm:w-80">
      <svg className="mb-2 h-5 w-5 text-accent/70" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M9.983 3v7.391c0 5.704-3.731 9.57-8.983 10.609l-.995-2.151c2.432-.917 3.995-3.638 3.995-5.849h-4v-10h9.983zm14.017 0v7.391c0 5.704-3.748 9.571-9 10.609l-.996-2.151c2.433-.917 3.996-3.638 3.996-5.849h-3.983v-10h9.983z" />
      </svg>
      <blockquote className="line-clamp-4 flex-1 text-sm leading-relaxed text-fg-muted">{c.body}</blockquote>
      <figcaption className="mt-4 flex items-center gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-accent-fg">
          {(c.name?.[0] ?? "V").toUpperCase()}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-fg">{c.name || "A VITian"}</span>
          <span className="block text-[11px] text-fg-subtle">{fmtDate(c.created_at)}</span>
        </span>
      </figcaption>
    </figure>
  );
}

export default function GVWallOfLove() {
  const [comments, setComments] = useState<GVComment[] | null>(null);

  useEffect(() => {
    apiListComments()
      .then((r) => setComments(r.comments))
      .catch(() => setComments([]));
  }, []);

  const base = comments ?? [];
  // Repeat so the marquee always looks full, then double it for a seamless -50% loop.
  let filled = base;
  if (base.length > 0 && base.length < 6) {
    filled = Array.from({ length: Math.ceil(6 / base.length) }, () => base).flat();
  }
  const loop = [...filled, ...filled];

  return (
    <section className="mx-auto max-w-6xl px-4 pb-24 pt-4">
      <ScrollReveal>
        <div className="text-center">
          <p className="text-nano font-semibold uppercase tracking-[0.22em] text-accent sm:text-micro">
            Wall of love
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-fg sm:text-3xl">What VITians say</h2>
          <p className="mx-auto mt-2 max-w-md text-lead text-fg-muted">
            Real words from students who made gradeVITian theirs. Your turn next?
          </p>
        </div>
      </ScrollReveal>

      {/* Marquee */}
      {comments === null ? (
        <div className="mt-10 flex gap-4 overflow-hidden">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-40 w-72 shrink-0 animate-pulse rounded-2xl bg-surface-raised sm:w-80" />
          ))}
        </div>
      ) : base.length === 0 ? (
        <ScrollReveal className="mt-10">
          <div className="rounded-3xl border border-dashed border-border-subtle bg-surface/40 p-10 text-center">
            <p className="text-fg-muted">No feedback yet — be the very first VITian to leave one.</p>
            <GVLink
              href="/feedback"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-fg shadow-sm shadow-accent/25 transition-all duration-200 hover:bg-accent-hover active:scale-[0.97]"
            >
              Leave the first review
            </GVLink>
          </div>
        </ScrollReveal>
      ) : (
        <div
          className="group relative mt-10 overflow-hidden"
          style={{
            maskImage: "linear-gradient(to right, transparent, #000 6%, #000 94%, transparent)",
            WebkitMaskImage: "linear-gradient(to right, transparent, #000 6%, #000 94%, transparent)",
          }}
        >
          <div className="flex w-max gap-4 animate-[marquee-left_50s_linear_infinite] group-hover:[animation-play-state:paused] motion-reduce:animate-none">
            {loop.map((c, i) => (
              <Quote key={`${c.id}-${i}`} c={c} />
            ))}
          </div>
        </div>
      )}

      {/* Curiosity CTA */}
      <ScrollReveal className="mt-10">
        <div className="flex flex-col items-center gap-2">
          <GVLink
            href="/feedback"
            className="group/cta inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-6 py-3 text-sm font-semibold text-fg backdrop-blur transition-all duration-200 hover:border-accent/40 hover:text-accent active:scale-[0.97]"
          >
            Share your feedback
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="transition-transform group-hover/cta:translate-x-0.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </GVLink>
          <p className="text-micro text-fg-subtle">
            Takes 20 seconds, no account needed — you could be featured right here.
          </p>
        </div>
      </ScrollReveal>
    </section>
  );
}

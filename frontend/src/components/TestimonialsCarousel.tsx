"use client";

import { useState, useCallback } from "react";
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
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 flex flex-col h-full shadow-sm">
      {/* Quote mark */}
      <svg
        className="shrink-0 text-indigo-200 mb-4"
        width="32" height="24" viewBox="0 0 32 24" fill="currentColor"
      >
        <path d="M0 24V14.4C0 6.4 5.12 1.6 15.36 0l1.28 2.56C11.52 3.84 8.96 6.4 8.32 10.24H14.4V24H0zm17.6 0V14.4C17.6 6.4 22.72 1.6 32.96 0l1.28 2.56C29.12 3.84 26.56 6.4 25.92 10.24H32V24H17.6z" />
      </svg>

      {/* Description */}
      <p className="text-sm sm:text-base leading-7 text-zinc-700 flex-1">
        {item.description}
      </p>

      {/* Divider */}
      <div className="mt-6 pt-5 border-t border-zinc-100">
        <div className="flex items-start justify-between gap-4">
          {/* Person */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar */}
            <div className="shrink-0 w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">
              {initials(item.name)}
            </div>
            <div className="min-w-0">
              {item.linkedin ? (
                <a
                  href={item.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-zinc-950 hover:text-indigo-600 transition-colors leading-snug block truncate"
                >
                  {item.name || "Anonymous"}
                </a>
              ) : (
                <span className="text-sm font-semibold text-zinc-950 leading-snug block truncate">
                  {item.name || "Anonymous"}
                </span>
              )}
              {item.designation && <p className="text-xs text-zinc-500 leading-snug truncate">{item.designation}</p>}
              {item.company && <p className="text-xs font-medium text-indigo-600 truncate">{item.company}</p>}
            </div>
          </div>

          {/* Meta */}
          <div className="shrink-0 text-right">
            {item.source && (
              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">
                {item.source}
              </span>
            )}
            {item.givenAt && <p className="mt-1.5 text-[10px] text-zinc-400">{formatDate(item.givenAt)}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TestimonialsCarousel() {
  const [current, setCurrent] = useState(0);
  const total = testimonials.length;

  const next = useCallback(() => setCurrent((c) => (c + 1) % total), [total]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + total) % total), [total]);

  if (total === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Testimonials</h2>
        {total > 1 && (
          <span className="text-[11px] text-zinc-400">{current + 1} / {total}</span>
        )}
      </div>

      <div className="relative">
        {/* Card */}
        <div className="min-h-[220px]">
          <TestimonialCard item={testimonials[current]} />
        </div>

        {/* Arrows — only when multiple */}
        {total > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous testimonial"
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 sm:-translate-x-5 w-9 h-9 rounded-full border border-zinc-200 bg-white shadow-sm flex items-center justify-center text-zinc-500 hover:text-zinc-950 hover:border-zinc-400 transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              onClick={next}
              aria-label="Next testimonial"
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 sm:translate-x-5 w-9 h-9 rounded-full border border-zinc-200 bg-white shadow-sm flex items-center justify-center text-zinc-500 hover:text-zinc-950 hover:border-zinc-400 transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Dots */}
      {total > 1 && (
        <div className="flex justify-center gap-2 mt-5">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Go to testimonial ${i + 1}`}
              className={`rounded-full transition-all ${
                i === current
                  ? "w-5 h-2 bg-indigo-600"
                  : "w-2 h-2 bg-zinc-300 hover:bg-zinc-400"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

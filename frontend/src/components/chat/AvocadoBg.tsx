"use client";

/*
 * Minimal chat background — a single, barely-there gradient wash.
 * Keeps the canvas calm and content-first (aesthetic-minimalist).
 */
export default function AvocadoBg() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden select-none z-0"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_50%_at_50%_-10%,rgb(99_102_241_/_0.05)_0%,transparent_60%)]" />
    </div>
  );
}

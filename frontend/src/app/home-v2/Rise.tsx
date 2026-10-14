"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The entrance, per SKILL.md step 9 part 2: heading, then text, then picture,
 * staggered 60–90ms, rising 16–32px with opacity, triggered once as the
 * section enters.
 *
 * The content is never hidden if the script fails: `taste.css` ships a
 * `.no-js` escape and the observer sets `is-in` on mount for anything already
 * in view, so a visitor with JS off or a failed hydration still reads the page.
 * Transform and opacity only; `prefers-reduced-motion` drops the travel in CSS.
 */
export default function Rise({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // No IntersectionObserver (or reduced motion) → show immediately.
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-rise=""
      className={shown ? "is-in" : undefined}
      style={{ "--rise-delay": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

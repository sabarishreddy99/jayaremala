"use client";

import { useEffect, useRef } from "react";

const NAV_H = 50;

/*
 * Architecture:
 *   <sentinel h-0>          — non-sticky, tracks scroll position in page
 *   <section sticky z-N>    — sticky relative to PAGE (not a wrapper), stacks correctly
 *     <div ref=content>     — translates up via JS as user scrolls overflow
 *   <div ref=spacer>        — height = content overflow, gives scroll distance
 *
 * Why no outer wrapper: wrapping the sticky element makes the wrapper its containing block,
 * which constrains the sticky range to wrapper height ≈ 0 scroll. The sentinel + spacer
 * siblings keep the section's containing block as the page root, so sticking works across
 * the full page height.
 */
export default function StackSection({
  children,
  z,
  className = "",
}: {
  children: React.ReactNode;
  z: number;
  className?: string;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const content = contentRef.current;
    const spacer = spacerRef.current;
    if (!sentinel || !content || !spacer) return;

    function sync() {
      const viewH = window.innerHeight - NAV_H;
      const overflow = Math.max(0, content!.scrollHeight - viewH);

      // Give the page enough scroll distance to scrub through all content
      spacer!.style.height = `${overflow}px`;

      // sentinel.top decreases as user scrolls past the sticky point
      // scrolledPast = how many px we've scrolled past where this section sticks
      const scrolledPast = NAV_H - sentinel!.getBoundingClientRect().top;
      const translateY =
        overflow > 0 ? -Math.min(Math.max(0, scrolledPast), overflow) : 0;

      content!.style.transform =
        translateY !== 0 ? `translateY(${translateY}px)` : "";
    }

    sync();

    const ro = new ResizeObserver(sync);
    ro.observe(content);
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  return (
    <>
      {/* zero-height sentinel — not sticky, tracks true page scroll position */}
      <div ref={sentinelRef} className="h-0" aria-hidden />
      <section
        className={`sticky top-[50px] overflow-hidden bg-bg stack-sect`}
        style={{ height: "calc(100dvh - 50px)", zIndex: z }}
      >
        <div ref={contentRef} className={className} style={{ willChange: "transform" }}>
          {children}
        </div>
      </section>
      {/* spacer grows to fill overflow, creating page scroll distance */}
      <div ref={spacerRef} />
    </>
  );
}

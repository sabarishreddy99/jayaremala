"use client";

import { useEffect, useRef } from "react";
import { getLenisInstance } from "@/lib/lenis-store";

const NAV_H = 50;

/*
 * Sticky card-stacking scroll with content scrubbing.
 *
 * Structure (siblings in page root — no wrapper so page is the containing block):
 *   <div h-0 sentinel>   — non-sticky, tracks true page scroll offset
 *   <section sticky>     — stacks via z-index; height = viewport - nav
 *     <div content>      — translateY driven by scroll (GPU, no reflow)
 *   <div spacer>         — height = content overflow; updated only on resize, not scroll
 *
 * Scroll handler only writes transform (paint-only, no layout).
 * Spacer height (layout) only updates on ResizeObserver / window resize.
 * Debounced resize prevents iOS address-bar height changes from causing layout jank.
 */
export default function StackSection({
  children,
  z,
  className = "",
  seamless = false,
}: {
  children: React.ReactNode;
  z: number;
  className?: string;
  seamless?: boolean;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const overflowRef = useRef(0);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const content = contentRef.current;
    const spacer = spacerRef.current;
    if (!sentinel || !content || !spacer) return;

    // ── Layout pass — only runs when content or window size changes ────────
    function measure() {
      const viewH = window.innerHeight - NAV_H;
      overflowRef.current = Math.max(0, content!.scrollHeight - viewH);
      spacer!.style.height = `${overflowRef.current}px`;
      updateTransform();
    }

    // ── Paint pass — runs on every scroll tick, zero layout reflow ─────────
    function updateTransform() {
      const scrolledPast = NAV_H - sentinel!.getBoundingClientRect().top;
      const ov = overflowRef.current;
      const translateY = ov > 0 ? -Math.min(Math.max(0, scrolledPast), ov) : 0;
      content!.style.transform =
        translateY !== 0 ? `translateY(${translateY}px)` : "";
    }

    // Debounce resize so iOS address-bar height animation doesn't thrash layout
    let resizeTimer: ReturnType<typeof setTimeout>;
    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(measure, 120);
    }

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(content);
    window.addEventListener("resize", onResize, { passive: true });

    // Prefer Lenis scroll events — they fire within the same RAF tick as the
    // lerped scroll update, so translateY stays in sync with the painted frame.
    // Fall back to native scroll events when Lenis isn't active.
    const lenis = getLenisInstance();
    if (lenis) {
      lenis.on("scroll", updateTransform);
    } else {
      window.addEventListener("scroll", updateTransform, { passive: true });
    }

    return () => {
      clearTimeout(resizeTimer);
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      if (lenis) {
        lenis.off("scroll", updateTransform);
      } else {
        window.removeEventListener("scroll", updateTransform);
      }
    };
  }, []);

  return (
    <>
      {/* sentinel — plain div, never sticks, gives us the true scroll offset */}
      <div ref={sentinelRef} className="h-0" aria-hidden />
      <section
        className={`sticky top-[50px] overflow-hidden bg-bg${seamless ? "" : " stack-sect"}`}
        style={{ height: "calc(100dvh - 50px)", zIndex: z }}
      >
        <div
          ref={contentRef}
          className={className}
          style={{ willChange: "transform" }}
        >
          {children}
        </div>
      </section>
      {/* spacer — grows to fill overflow, creating the scroll distance for content scrubbing */}
      <div ref={spacerRef} />
    </>
  );
}

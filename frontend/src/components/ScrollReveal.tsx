"use client";

import { useEffect, useRef, type ReactNode } from "react";

export default function ScrollReveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced-motion preference
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Set hidden state via JS — avoids SSR flash and the CSS-class timing race
    el.style.opacity = "0";
    el.style.transform = "translateY(18px)";
    el.style.transition =
      "opacity 0.55s cubic-bezier(0.16,1,0.3,1), transform 0.55s cubic-bezier(0.16,1,0.3,1)";
    el.style.willChange = "opacity, transform";

    const reveal = () => {
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
      el.style.willChange = "auto";
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        // Double rAF ensures the initial hidden state is painted before the
        // reveal transition fires — critical for elements already in the viewport
        if (delay > 0) {
          setTimeout(reveal, delay);
        } else {
          requestAnimationFrame(() => requestAnimationFrame(reveal));
        }
        observer.unobserve(el);
      },
      { threshold: 0.06, rootMargin: "0px 0px -20px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";

export default function ReadingProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    const update = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? window.scrollY / docHeight : 0;
      bar.style.transform = `scaleX(${pct})`;
    };

    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <div className="absolute bottom-0 left-0 right-0 h-0.5 pointer-events-none overflow-hidden">
      <div
        ref={barRef}
        className="h-full w-full bg-accent origin-left will-change-transform"
        style={{ transform: "scaleX(0)", transition: "transform 80ms linear" }}
      />
    </div>
  );
}

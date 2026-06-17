"use client";

import { useEffect, useState } from "react";

/** Sticky "back to top" button, bottom-left, fades in after scrolling down. */
export default function GVScrollTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className={`fixed bottom-5 left-5 z-30 grid h-12 w-12 place-items-center rounded-full border border-border bg-surface/80 text-fg shadow-lg backdrop-blur transition-all duration-300 hover:border-accent/40 hover:text-accent active:scale-95 ${
        show ? "opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}

"use client";

import { useEffect, useState } from "react";

const R = 19;
const C = 2 * Math.PI * R;

/**
 * Floating back-to-top on the left edge of every portfolio page.
 *
 * Left, because the right-hand corner belongs to the Avocado chat button.
 * The ring around it fills with the accent as you read down the page, so it
 * doubles as a quiet progress indicator. Appears after the first screenful;
 * 44px on touch screens so it is a real tap target.
 */
export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setVisible(window.scrollY > 400);
      setProgress(max > 0 ? Math.min(window.scrollY / max, 1) : 0);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const toTop = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <button
      onClick={toTop}
      aria-label="Scroll to top"
      tabIndex={visible ? 0 : -1}
      className={`to-top group fixed bottom-5 left-4 z-40 grid h-11 w-11 place-items-center rounded-full sm:bottom-6 sm:left-5
                  transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
                  ${visible ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-3"}`}
    >
      <svg aria-hidden viewBox="0 0 44 44" className="absolute inset-0 h-full w-full -rotate-90">
        <circle cx="22" cy="22" r={R} fill="none" className="to-top-track" strokeWidth="2" />
        <circle
          cx="22" cy="22" r={R} fill="none" className="to-top-fill" strokeWidth="2" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - progress)}
        />
      </svg>
      <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        className="relative transition-transform duration-200 group-hover:-translate-y-0.5">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}

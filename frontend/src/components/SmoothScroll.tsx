"use client";

import Lenis from "lenis";
import { useLayoutEffect } from "react";
import { setLenisInstance } from "@/lib/lenis-store";

// useLayoutEffect runs synchronously after DOM mutations and BEFORE child
// useEffects fire, so getLenisInstance() is populated by the time StackSection
// (a child) subscribes to it in its own useEffect.
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useLayoutEffect(() => {
    const lenis = new Lenis({
      duration: 0.9,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo-out
      smoothWheel: true,
      // smoothTouch: false (default) — keeps native momentum scroll on mobile
    });

    setLenisInstance(lenis);

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      setLenisInstance(null);
    };
  }, []);

  return <>{children}</>;
}

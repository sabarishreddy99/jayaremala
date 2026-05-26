"use client";

import { useEffect, useRef, useState } from "react";

type Phase = "hidden" | "split" | "full";

export default function HeroName({ name }: { name: string }) {
  const words = name.split(" "); // ["Jaya", "Sabarish", "Reddy", "Remala"]
  const midRef = useRef<HTMLSpanElement>(null);
  const [phase, setPhase] = useState<Phase>("hidden");
  const [shift, setShift] = useState(0);

  useEffect(() => {
    const mid = midRef.current;
    if (!mid) return;

    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      window.innerWidth < 640
    ) {
      setPhase("full");
      return;
    }

    // shift = half the natural rendered width of "Sabarish Reddy".
    // Jaya shifts right by this amount, Remala shifts left by this amount,
    // so they appear close together near the visual centre of the full name.
    // Then on "full" they spring outward to their real positions — the extremes.
    setShift(mid.offsetWidth / 2);

    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setPhase("split");
        setTimeout(() => setPhase("full"), 650);
      })
    );
  }, []);

  const ease = "cubic-bezier(0.76, 0, 0.24, 1)";

  return (
    <h1
      aria-label={name}
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "baseline",
        columnGap: "0.28em",
        fontFamily: "var(--font-display)",
        fontSize: "clamp(1.75rem, 4.8vw, 3.25rem)",
        fontWeight: 700,
        lineHeight: 1.1,
        letterSpacing: "-0.02em",
        margin: 0,
      }}
    >
      {/* Jaya — starts shifted right toward centre, slides to left extreme */}
      <span
        aria-hidden
        style={{
          display: "inline-block",
          whiteSpace: "nowrap",
          color: "var(--fg)",
          opacity: phase === "hidden" ? 0 : 1,
          transform: `translateX(${phase === "split" ? shift : 0}px)`,
          transition:
            phase === "full"
              ? `transform 1.1s ${ease}, opacity 0.6s ease`
              : "opacity 0.45s ease",
          willChange: "transform",
        }}
      >
        {words[0]}
      </span>

      {/* Sabarish Reddy — invisible during split, fades in as the name opens up */}
      <span
        ref={midRef}
        aria-hidden
        style={{
          display: "inline-flex",
          columnGap: "0.28em",
          whiteSpace: "nowrap",
          opacity: phase === "full" ? 1 : 0,
          transition: phase === "full" ? "opacity 0.8s ease 0.4s" : "none",
        }}
      >
        <span style={{ color: "var(--fg)" }}>{words[1]}</span>
        <span style={{ color: "var(--fg)" }}>{words[2]}</span>
      </span>

      {/* Remala — starts shifted left toward centre, slides to right extreme */}
      <span
        aria-hidden
        style={{
          display: "inline-block",
          whiteSpace: "nowrap",
          color: "#4f46e5",
          opacity: phase === "hidden" ? 0 : 1,
          transform: `translateX(${phase === "split" ? -shift : 0}px)`,
          transition:
            phase === "full"
              ? `transform 1.1s ${ease}, opacity 0.6s ease`
              : "opacity 0.45s ease",
          willChange: "transform",
        }}
      >
        {words[3]}
      </span>
    </h1>
  );
}

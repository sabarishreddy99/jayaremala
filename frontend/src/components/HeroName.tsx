"use client";

import { useEffect, useState } from "react";

export default function HeroName({ name }: { name: string }) {
  const words = name.split(" ");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReady(true);
      return;
    }
    requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)));
  }, []);

  const ease = "cubic-bezier(0.16, 1, 0.3, 1)";

  return (
    <h1
      aria-label={name}
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "baseline",
        justifyContent: "center",
        columnGap: "0.22em",
        rowGap: "0.1em",
        fontFamily: "var(--font-cormorant), Georgia, serif",
        fontSize: "clamp(3rem, 9vw, 7.5rem)",
        fontWeight: 600,
        lineHeight: 1.0,
        letterSpacing: "0.01em",
        margin: 0,
      }}
    >
      {words.map((word, i) => {
        const isLast = i === words.length - 1;
        const delay = i * 90;
        return (
          <span
            key={word}
            aria-hidden
            style={{
              display: "inline-block",
              overflow: "hidden",
              lineHeight: 1.2,
              paddingBottom: "0.05em",
            }}
          >
            <span
              style={{
                display: "inline-block",
                color: isLast ? "var(--accent)" : "var(--fg)",
                transform: ready ? "translateY(0)" : "translateY(108%)",
                opacity: ready ? 1 : 0,
                transition: ready
                  ? `transform 1s ${ease} ${delay}ms, opacity 0.5s ease ${delay}ms`
                  : "none",
                willChange: "transform",
              }}
            >
              {word}
            </span>
          </span>
        );
      })}
    </h1>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

export default function HeroName({ name }: { name: string }) {
  const words = name.split(" ");
  const [ready, setReady] = useState(false);
  const [tagPos, setTagPos] = useState<{ left: number; top: number } | null>(null);
  const h1Ref = useRef<HTMLHeadingElement>(null);
  const lastWordRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReady(true);
      return;
    }
    requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)));
  }, []);

  useEffect(() => {
    function measure() {
      if (!h1Ref.current || !lastWordRef.current) return;
      const h1 = h1Ref.current.getBoundingClientRect();
      const word = lastWordRef.current.getBoundingClientRect();
      setTagPos({ left: word.right - h1.left, top: word.bottom - h1.top });
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const ease = "cubic-bezier(0.22, 1, 0.36, 1)";
  const tagDelay = (words.length - 1) * 90 + 1200;

  return (
    <h1
      ref={h1Ref}
      aria-label={name}
      style={{
        position: "relative",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "flex-end",
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
          /* Every word — including last — uses the exact same structure.
           * No wrapper differences means no flex height/baseline discrepancy on mobile. */
          <span
            key={word}
            ref={isLast ? lastWordRef : undefined}
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
                  ? `transform 1s ${ease} ${delay}ms, opacity 0.6s ease ${delay}ms`
                  : "none",
                willChange: "transform, opacity",
              }}
            >
              {word}
            </span>
          </span>
        );
      })}

      {/* Tag anchor — positioned from the h1 via JS measurement, fully outside flex flow */}
      {tagPos && (
        <span
          aria-hidden
          className="hero-tag-anchor"
          style={{
            position: "absolute",
            left: tagPos.left,
            top: tagPos.top,
            pointerEvents: "none",
            userSelect: "none",
            zIndex: 10,
          }}
        >
          {/* Layer 2 — fade in */}
          <span
            style={{
              display: "block",
              animation: ready ? `hero-tag-appear 0.35s ease ${tagDelay}ms both` : "none",
              opacity: ready ? undefined : 0,
            }}
          >
            {/* Layer 3 — pendulum swing-in then gentle sway */}
            <span
              style={{
                display: "block",
                transformOrigin: "top center",
                animation: ready
                  ? `hero-tag-swing-in 1.6s ${ease} ${tagDelay}ms both, hero-tag-sway 6s ease-in-out ${tagDelay + 1600}ms infinite`
                  : "none",
              }}
            >
              <span style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span
                  style={{
                    display: "block",
                    width: "1px",
                    height: "13px",
                    background: "var(--accent)",
                    opacity: 0.4,
                  }}
                />
                <span
                  style={{
                    display: "block",
                    border: "1px solid var(--accent)",
                    borderRadius: "3px",
                    padding: "3px 8px 4px",
                    fontSize: "0.6rem",
                    letterSpacing: "0.13em",
                    textTransform: "uppercase",
                    color: "var(--accent)",
                    background: "var(--bg)",
                    fontFamily: "var(--font-geist-sans), sans-serif",
                    fontWeight: 500,
                    lineHeight: 1.5,
                    whiteSpace: "nowrap",
                  }}
                >
                  do hard things
                </span>
              </span>
            </span>
          </span>
        </span>
      )}
    </h1>
  );
}

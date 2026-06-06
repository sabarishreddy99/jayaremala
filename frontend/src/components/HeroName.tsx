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

  const ease = "cubic-bezier(0.22, 1, 0.36, 1)";
  const tagDelay = (words.length - 1) * 90 + 1200;

  return (
    <h1
      aria-label={name}
      style={{
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

        if (isLast) {
          return (
            /*
             * align-items:flex-end on h1 means all word spans align by bottom edge —
             * no baseline calculation, so this overflow:visible wrapper never causes
             * the last word to jump relative to siblings.
             */
            <span key={word} style={{ position: "relative", display: "inline-block" }}>

              <span
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
                    color: "var(--accent)",
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

              {/*
               * Hanging tag — 3 separate animation layers (no transform conflicts):
               * Layer 1: static position (left:100% + translateX via .hero-tag-anchor class)
               * Layer 2: opacity appear only
               * Layer 3: pendulum rotation only
               */}
              <span
                aria-hidden
                className="hero-tag-anchor"
                style={{
                  position: "absolute",
                  top: "100%",
                  left: "100%",
                  pointerEvents: "none",
                  userSelect: "none",
                  zIndex: 10,
                }}
              >
                <span
                  style={{
                    display: "block",
                    animation: ready
                      ? `hero-tag-appear 0.35s ease ${tagDelay}ms both`
                      : "none",
                    opacity: ready ? undefined : 0,
                  }}
                >
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
            </span>
          );
        }

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
                color: "var(--fg)",
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
    </h1>
  );
}

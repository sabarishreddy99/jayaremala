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
      const h1   = h1Ref.current.getBoundingClientRect();
      const word = lastWordRef.current.getBoundingClientRect();
      setTagPos({ left: word.right - h1.left, top: word.bottom - h1.top });
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const ease    = "cubic-bezier(0.22, 1, 0.36, 1)";
  const tagDelay = (words.length - 1) * 90 + 1200;

  return (
    <h1
      ref={h1Ref}
      aria-label={name}
      style={{
        position:      "relative",
        display:       "flex",
        flexWrap:      "wrap",
        alignItems:    "flex-end",
        justifyContent:"center",
        columnGap:     "0.22em",
        rowGap:        "0.1em",
        fontFamily:    "var(--font-cormorant), Georgia, serif",
        fontSize:      "clamp(3rem, 9vw, 7.5rem)",
        fontWeight:    600,
        lineHeight:    1.0,
        letterSpacing: "0.01em",
        margin:        0,
      }}
    >
      {words.map((word, i) => {
        const isLast = i === words.length - 1;
        const delay  = i * 90;

        return (
          <span
            key={word}
            ref={isLast ? lastWordRef : undefined}
            aria-hidden
            style={{ display: "inline-block", overflow: "hidden", lineHeight: 1.2, paddingBottom: "0.05em" }}
          >
            <span
              style={{
                display:    "inline-block",
                color:      isLast ? "var(--accent)" : "var(--fg)",
                transform:  ready ? "translateY(0)"  : "translateY(108%)",
                opacity:    ready ? 1 : 0,
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

      {/* Hang tag — positioned from h1 via JS, fully outside flex flow */}
      {tagPos && (
        <span
          aria-hidden
          className="hero-tag-anchor"
          style={{
            position:      "absolute",
            left:          tagPos.left,
            top:           tagPos.top,
            pointerEvents: "none",
            userSelect:    "none",
            zIndex:        10,
          }}
        >
          {/* Layer 2 — drop + fade */}
          <span
            style={{
              display:   "block",
              animation: ready ? `hero-tag-drop 0.55s ease-out ${tagDelay}ms both` : "none",
              opacity:   ready ? undefined : 0,
            }}
          >
            {/* Layer 3 — pendulum swing-in, then slow sway */}
            <span
              style={{
                display:         "block",
                transformOrigin: "top center",
                animation: ready
                  ? `hero-tag-swing-in 1.9s ${ease} ${tagDelay}ms both, hero-tag-sway 8s ease-in-out ${tagDelay + 1900}ms infinite`
                  : "none",
              }}
            >
              <span style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>

                {/* Punch-hole dot */}
                <span
                  style={{
                    display:      "block",
                    width:        "5px",
                    height:       "5px",
                    borderRadius: "50%",
                    border:       "1px solid var(--border-strong)",
                    background:   "var(--bg)",
                    marginBottom: "-3px",
                    position:     "relative",
                    zIndex:       1,
                    flexShrink:   0,
                  }}
                />

                {/* Thread */}
                <span
                  style={{
                    display:    "block",
                    width:      "1px",
                    height:     "18px",
                    background: "linear-gradient(to bottom, var(--fg-faint) 0%, transparent 100%)",
                    flexShrink: 0,
                  }}
                />

                {/* Card */}
                <span
                  style={{
                    display:      "block",
                    position:     "relative",
                    border:       "1px solid var(--border-strong)",
                    borderRadius: "4px",
                    padding:      "4px 10px 5px",
                    background:   "var(--surface)",
                    boxShadow:    "0 2px 8px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06)",
                    overflow:     "hidden",
                  }}
                >
                  {/* Subtle centered accent shimmer across top edge */}
                  <span
                    style={{
                      position:     "absolute",
                      top:          0,
                      left:         "15%",
                      right:        "15%",
                      height:       "1px",
                      background:   "linear-gradient(to right, transparent, var(--accent), transparent)",
                      opacity:      0.55,
                      borderRadius: "4px 4px 0 0",
                    }}
                  />
                  <span
                    style={{
                      display:        "block",
                      fontFamily:     "var(--font-geist-sans), sans-serif",
                      fontSize:       "0.575rem",
                      letterSpacing:  "0.14em",
                      textTransform:  "uppercase",
                      color:          "var(--fg-subtle)",
                      fontWeight:     500,
                      lineHeight:     1.4,
                      whiteSpace:     "nowrap",
                    }}
                  >
                    do hard things
                  </span>
                </span>

              </span>
            </span>
          </span>
        </span>
      )}
    </h1>
  );
}

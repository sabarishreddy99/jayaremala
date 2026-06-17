/**
 * Hero title with the same formal masked word-rise as the portfolio HeroName: each
 * word slides up from behind an overflow-hidden mask (Cormorant Garamond, weight 600).
 * Pure CSS staggered animation — SSR/static-export safe, identical on every screen,
 * and disabled under prefers-reduced-motion. `accent` colors a substring (e.g. "VIT").
 */
export default function GVHeroTitle({
  text,
  accent,
  className = "",
  style,
}: {
  text: string;
  accent?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const words = text.split(" ");
  const start = accent ? text.indexOf(accent) : -1;
  const end = start >= 0 ? start + (accent as string).length : -1;
  // Absolute char offset where each word begins in `text` (no mutable running index).
  const wordStarts = words.map((_, i) =>
    words.slice(0, i).reduce((sum, w) => sum + w.length + 1, 0),
  );

  return (
    <h1
      aria-label={text}
      className={className}
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "flex-end",
        justifyContent: "center",
        columnGap: "0.22em",
        rowGap: "0.1em",
        fontFamily: "var(--font-cormorant), Georgia, serif",
        fontSize: "clamp(2.75rem, 8.5vw, 6rem)",
        fontWeight: 600,
        lineHeight: 1,
        letterSpacing: "0.01em",
        margin: 0,
        ...style,
      }}
    >
      {words.map((word, wi) => (
        <span key={wi} aria-hidden className="gv-rise-mask">
          <span className="gv-rise-inner" style={{ animationDelay: `${wi * 90}ms` }}>
            {[...word].map((ch, ci) => {
              const abs = wordStarts[wi] + ci;
              const inAccent = start >= 0 && abs >= start && abs < end;
              return (
                <span key={ci} style={inAccent ? { color: "var(--accent)" } : undefined}>
                  {ch}
                </span>
              );
            })}
          </span>
        </span>
      ))}
    </h1>
  );
}

const nameStyle: React.CSSProperties = {
  fontFamily: "var(--font-display), 'Helvetica Neue', Arial, sans-serif",
  fontSize: "clamp(4.25rem, 20vw, 14rem)",
  fontWeight: 800,
  lineHeight: 1.0,
  color: "var(--fg-subtle)",
  whiteSpace: "nowrap",
  paddingBottom: "0.08em",
};

const dotStyle: React.CSSProperties = {
  display: "inline-block",
  width: "clamp(0.5rem, 1.3vw, 1.1rem)",
  height: "clamp(0.5rem, 1.3vw, 1.1rem)",
  borderRadius: "50%",
  background: "var(--accent)",
  margin: "0 clamp(0.75rem, 2.4vw, 2.25rem)",
  flexShrink: 0,
};

/** One seamless-loop unit: the name repeated a few times, each trailed by an accent dot. */
function NameGroup({ name }: { name: string }) {
  return (
    <div className="flex items-center shrink-0" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span key={i} className="flex items-center shrink-0">
          <span className="hero-name-word" style={nameStyle}>{name}</span>
          <span className="hero-name-dot" style={dotStyle} />
        </span>
      ))}
    </div>
  );
}

/**
 * Oversized hero wordmark: the name as a heavy grotesque marquee scrolling
 * right → left. Two identical groups tile the track; the CSS animation
 * translates exactly one group width (-50%) for a seamless loop.
 */
export default function HeroName({ name }: { name: string }) {
  return (
    <h1
      className="hero-name-band w-full self-stretch overflow-hidden select-none m-0"
      aria-label={name}
    >
      <div className="hero-name-track flex items-center w-max">
        <NameGroup name={name} />
        <NameGroup name={name} />
      </div>
    </h1>
  );
}

/**
 * A seed with a line of text running around it, turning slowly — the
 * "still running" mark. The pit is the avocado's stone; the ring is a sentence,
 * not decoration, so it carries real copy and is announced once via sr-only.
 * Rotation stops under reduced motion (see .seed-ring in globals.css).
 */
export default function SeedRing({ text, size = 88 }: { text: string; size?: number }) {
  const r = 38;
  // Unique per sentence, so two rings on one page never share a path id.
  const pathId = `seed-ring-${Array.from(text).reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7).toString(36)}`;
  return (
    <span className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <span className="sr-only">{text}</span>
      <svg aria-hidden viewBox="0 0 100 100" className="seed-ring absolute inset-0 h-full w-full text-fg-subtle">
        <defs>
          <path id={pathId} d={`M50,50 m-${r},0 a${r},${r} 0 1,1 ${r * 2},0 a${r},${r} 0 1,1 -${r * 2},0`} />
        </defs>
        <text className="fill-current font-mono uppercase" style={{ fontSize: 9.5, letterSpacing: "0.16em" }}>
          <textPath href={`#${pathId}`} textLength={2 * Math.PI * r - 2}>{text}</textPath>
        </text>
      </svg>
      <span aria-hidden className="seed-ring-pit relative h-[38%] w-[38%] rounded-full bg-[var(--pit)] shadow-[inset_0_-4px_8px_rgb(0_0_0/0.25)]" />
    </span>
  );
}

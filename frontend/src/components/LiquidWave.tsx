export default function LiquidWave({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`lw-svg absolute bottom-0 left-0 w-full pointer-events-none ${className}`}
      style={{ height: "clamp(110px, 22vh, 220px)", zIndex: 0 }}
      viewBox="0 0 1440 180"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Front wave */}
      <path
        className="lw-path"
        fill="currentColor"
        opacity="0.35"
        d="M 0,95 C 240,58 480,118 720,80 C 960,42 1200,105 1440,72 L 1440,180 L 0,180 Z"
      />
      {/* Back wave — offset phase for depth */}
      <path
        className="lw-path"
        fill="currentColor"
        opacity="0.15"
        style={{ animationDelay: "-8s", animationDuration: "28s" }}
        d="M 0,110 C 260,72 520,130 760,92 C 1000,54 1220,115 1440,85 L 1440,180 L 0,180 Z"
      />
    </svg>
  );
}

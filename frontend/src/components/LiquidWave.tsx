export default function LiquidWave() {
  return (
    <svg
      className="lw-svg absolute bottom-0 left-0 w-full pointer-events-none"
      style={{ height: "clamp(110px, 22vh, 220px)", zIndex: 0 }}
      viewBox="0 0 1440 180"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="lw-grad" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="#4f46e5" />
          <stop offset="55%"  stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <path
        className="lw-path"
        fill="url(#lw-grad)"
        d="M 0,95 C 240,58 480,118 720,80 C 960,42 1200,105 1440,72 L 1440,180 L 0,180 Z"
      />
    </svg>
  );
}

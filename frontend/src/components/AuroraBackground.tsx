"use client";

/*
 * Aurora background — a calm, premium gradient mesh that slowly drifts.
 * Replaces the busy particle-dots. Four large, heavily-blurred colour fields
 * breathe and drift at different speeds/phases, creating depth + curiosity
 * without distraction. Movement is disabled under prefers-reduced-motion (CSS).
 */

const FIELDS = [
  { className: "aurora-field aurora-1", color: "rgba(99,102,241,0.30)",  size: 620, top: "-12%", left: "-8%"  }, // indigo
  { className: "aurora-field aurora-2", color: "rgba(139,92,246,0.26)",  size: 540, top: "8%",   left: "55%"  }, // violet
  { className: "aurora-field aurora-3", color: "rgba(56,189,248,0.20)",  size: 460, top: "48%",  left: "10%"  }, // sky
  { className: "aurora-field aurora-4", color: "rgba(168,85,247,0.18)",  size: 500, top: "38%",  left: "62%"  }, // purple
];

export default function AuroraBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-20 overflow-hidden">
      {/* Base wash — anchors the aurora to the page background tone */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/30 via-transparent to-transparent dark:from-indigo-500/[0.04]" />

      {/* Drifting colour fields */}
      {FIELDS.map((f, i) => (
        <div
          key={i}
          className={f.className}
          style={{
            position: "absolute",
            top: f.top,
            left: f.left,
            width: f.size,
            height: f.size,
            borderRadius: "9999px",
            background: `radial-gradient(circle at center, ${f.color} 0%, transparent 68%)`,
            filter: "blur(60px)",
            willChange: "transform",
          }}
        />
      ))}

      {/* Fine grain to kill gradient banding on large fields */}
      <div
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.025] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}

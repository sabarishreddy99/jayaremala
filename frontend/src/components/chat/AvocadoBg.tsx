"use client";

/*
 * Floating avocado background for the Avocado chat page.
 * Each shape bobs gently at a unique speed / phase to avoid uniformity.
 * Opacity is kept very low so the chat content stays readable.
 */

const SHAPES: {
  left: string; top: string;
  size: number; rotate: number;
  dur: number; delay: number;
}[] = [
  { left: "5%",  top: "10%", size: 64, rotate: -14, dur: 9,  delay: 0    },
  { left: "18%", top: "64%", size: 44, rotate:  10, dur: 11, delay: 2.4  },
  { left: "30%", top: "22%", size: 78, rotate:  -6, dur: 10, delay: 5.1  },
  { left: "50%", top: "70%", size: 52, rotate:  18, dur: 13, delay: 1.2  },
  { left: "64%", top: "14%", size: 68, rotate:  -9, dur: 8,  delay: 3.7  },
  { left: "80%", top: "52%", size: 40, rotate:   6, dur: 12, delay: 6.8  },
  { left: "11%", top: "82%", size: 56, rotate: -18, dur: 10, delay: 4.3  },
  { left: "88%", top: "80%", size: 72, rotate:  12, dur: 9,  delay: 7.2  },
  { left: "43%", top: "42%", size: 36, rotate:  -3, dur: 14, delay: 8.6  },
  { left: "73%", top: "33%", size: 48, rotate:  22, dur: 11, delay: 0.9  },
];

function AvocadoSVG({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={Math.round(size * 1.28)}
      viewBox="0 0 80 102"
      aria-hidden
      focusable="false"
    >
      {/* skin */}
      <path
        d="M40 3C21 3 8 22 8 47c0 27 14 52 32 52s32-25 32-52C72 22 59 3 40 3z"
        fill="#2d5a3d"
      />
      {/* flesh */}
      <path
        d="M40 14C27 14 18 28 18 47c0 20 10 43 22 43s22-23 22-43c0-19-9-33-22-33z"
        fill="#c8e054"
      />
      {/* pit */}
      <ellipse cx="40" cy="65" rx="11" ry="15" fill="#7c4a1e" />
    </svg>
  );
}

export default function AvocadoBg() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden select-none z-0"
    >
      {/* Very soft avocado-green gradient wash */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,#d4edda22_0%,transparent_70%)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,#1a3d2510_0%,transparent_70%)]" />

      {SHAPES.map((s, i) => (
        <div
          key={i}
          className="absolute opacity-[0.055] dark:opacity-[0.09]"
          style={{
            left: s.left,
            top: s.top,
            animation: `avo-float ${s.dur}s ${s.delay}s ease-in-out infinite`,
          }}
        >
          <div style={{ transform: `rotate(${s.rotate}deg)` }}>
            <AvocadoSVG size={s.size} />
          </div>
        </div>
      ))}
    </div>
  );
}

"use client";

import { useRef, useEffect } from "react";

// Characters to scatter — math operators, letters, digits
const CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz" +
  "0123456789" +
  "+-*/=<>≤≥≠∑∏∫√∞πΔΩ±÷%^~!?{}[]|&";

const GRID = 42;   // px between characters
const FONT = 11;   // font-size px
const GLOW = 90;   // illumination radius px

// Deterministic LCG — same seed → same layout every render
function lcg(seed: number) {
  let s = seed;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) | 0;
    return (s >>> 0) / 4294967296;
  };
}

type Cell = { x: number; y: number; ch: string };

export default function HeroDotGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cellsRef  = useRef<Cell[]>([]);
  const mouseRef  = useRef({ x: -9999, y: -9999 });
  const rafRef    = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0;

    function buildCells() {
      const rand = lcg(42);
      cellsRef.current = [];
      const cols = Math.ceil(w / GRID) + 1;
      const rows = Math.ceil(h / GRID) + 1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          cellsRef.current.push({
            x:  c * GRID + rand() * 16 - 8,
            y:  r * GRID + rand() * 16 - 8,
            ch: CHARS[Math.floor(rand() * CHARS.length)],
          });
        }
      }
    }

    function getAccent() {
      return (
        getComputedStyle(document.documentElement)
          .getPropertyValue("--accent")
          .trim() || "#4f46e5"
      );
    }

    function draw() {
      ctx!.clearRect(0, 0, w, h);
      ctx!.font         = `${FONT}px "Roboto Mono", monospace`;
      ctx!.textAlign    = "center";
      ctx!.textBaseline = "middle";

      const dark      = document.documentElement.classList.contains("dark");
      const baseColor = dark ? "#ffffff" : "#000000";
      const accent    = getAccent();
      const { x: mx, y: my } = mouseRef.current;

      for (const { x, y, ch } of cellsRef.current) {
        const d = Math.hypot(x - mx, y - my);

        if (d < GLOW) {
          const t = 1 - d / GLOW;            // 1 at centre → 0 at edge
          ctx!.fillStyle   = accent;
          ctx!.globalAlpha = 0.14 + t * 0.76; // 0.14 dim rim → 0.90 bright centre
        } else {
          ctx!.fillStyle   = baseColor;
          ctx!.globalAlpha = 0.22;
        }

        ctx!.fillText(ch, x, y);
      }

      ctx!.globalAlpha = 1;
    }

    function resize() {
      const dpr  = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas!.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas!.width  = Math.round(w * dpr);
      canvas!.height = Math.round(h * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildCells();
      draw();
    }

    function onMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      const x    = e.clientX - rect.left;
      const y    = e.clientY - rect.top;
      mouseRef.current =
        x >= 0 && x <= rect.width && y >= 0 && y <= rect.height
          ? { x, y }
          : { x: -9999, y: -9999 };
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(draw);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      ro.disconnect();
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}

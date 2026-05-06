"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function AvocadoChatButton() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [permanentlyClosed, setPermanentlyClosed] = useState(false);
  const [hoverKey, setHoverKey] = useState(0);
  const autoHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  /* Auto-show 2.5s after mount */
  useEffect(() => {
    if (!mounted || permanentlyClosed) return;
    const t = setTimeout(() => setVisible(true), 2500);
    return () => clearTimeout(t);
  }, [mounted, permanentlyClosed]);

  /* Auto-hide 6s after bubble becomes visible */
  useEffect(() => {
    if (!visible) return;
    if (autoHideTimer.current) clearTimeout(autoHideTimer.current);
    autoHideTimer.current = setTimeout(() => setVisible(false), 6000);
    return () => {
      if (autoHideTimer.current) clearTimeout(autoHideTimer.current);
    };
  }, [visible]);

  const handleHoverEnter = () => {
    if (!permanentlyClosed) setVisible(true);
    setHoverKey((k) => k + 1);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setVisible(false);
    setPermanentlyClosed(true);
  };

  if (!mounted) return null;

  return (
    <div className="hidden md:block fixed bottom-7 right-7 z-50">
      <div className="flex flex-col items-end gap-3.5">

        {/* ── Speech bubble ── */}
        {visible && (
          <div className="animate-bubble-in relative">
            <div className="relative bg-surface border border-border rounded-2xl w-56 overflow-hidden"
              style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08)" }}>

              {/* Top accent stripe */}
              <div className="h-[3px] w-full bg-gradient-to-r from-green-500 via-green-400 to-emerald-500" />

              <div className="p-4">
                {/* Header row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    {/* Mini avocado avatar */}
                    <div className="relative flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0"
                      style={{ background: "radial-gradient(circle at 38% 32%, #7ed957, #2d7d1e)" }}>
                      <svg viewBox="0 0 100 120" className="w-4 h-5" fill="none">
                        <path d="M50 8 C30 8 16 26 16 50 C16 82 30 112 50 112 C70 112 84 82 84 50 C84 26 70 8 50 8Z" fill="#1a5216"/>
                        <path d="M50 17 C34 17 25 33 25 52 C25 78 36 103 50 103 C64 103 75 78 75 52 C75 33 66 17 50 17Z" fill="#9fd654"/>
                        <ellipse cx="50" cy="70" rx="17" ry="22" fill="#7a4f2d"/>
                        <ellipse cx="50" cy="70" rx="13" ry="18" fill="#a06842"/>
                        <ellipse cx="44" cy="63" rx="4" ry="5" fill="rgba(255,255,255,0.22)" transform="rotate(-10 44 63)"/>
                      </svg>
                      {/* Online pulse dot */}
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-surface" />
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-fg leading-none">Avocado</p>
                      <p className="text-[10px] text-green-600 dark:text-green-400 leading-none mt-0.5 font-medium">
                        AI · Online
                      </p>
                    </div>
                  </div>

                  {/* Close button */}
                  <button
                    onClick={handleClose}
                    className="flex items-center justify-center w-5 h-5 rounded-full text-fg-faint hover:text-fg hover:bg-surface-raised transition-colors text-base leading-none"
                    aria-label="Dismiss"
                  >
                    ×
                  </button>
                </div>

                {/* Message */}
                <p className="text-[12px] text-fg-muted leading-relaxed mb-3.5">
                  Hi! Ask me anything about Jaya's experience, projects, skills, education, or just say hello.
                </p>

                {/* CTA */}
                <Link
                  href="/chat"
                  className="flex items-center justify-center gap-1.5 text-[12px] font-semibold text-white rounded-xl px-3 py-2 transition-opacity hover:opacity-90 shadow-sm"
                  style={{ background: "linear-gradient(135deg, #4f46e5, #6366f1)" }}
                >
                  Ask Avocado
                  <span className="opacity-80">✦</span>
                </Link>
              </div>
            </div>

            {/* Triangle arrow pointing down toward the button */}
            <div
              className="absolute -bottom-[9px] right-[26px] w-4 h-4 bg-surface border-r border-b border-border rotate-45"
              aria-hidden
            />
          </div>
        )}

        {/* ── Floating avocado button ── */}
        <Link
          href="/chat"
          onMouseEnter={handleHoverEnter}
          aria-label="Chat with Avocado AI"
          className="animate-avo-float animate-avo-glow group relative flex items-center justify-center w-[60px] h-[60px] rounded-full transition-transform duration-200 hover:scale-110 active:scale-95"
          style={{
            background: "radial-gradient(circle at 36% 30%, #7ed957, #2d7d1e)",
          }}
        >
          {/* Hover glow ring */}
          <span
            className="absolute inset-[-4px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{ boxShadow: "0 0 0 3px rgba(100,200,60,0.35)" }}
            aria-hidden
          />

          {/* Avocado SVG — key forces remount on each hover, restarting the 3D spin */}
          <svg
            key={hoverKey}
            viewBox="0 0 100 120"
            className={`w-8 h-[38px] relative z-10 drop-shadow-sm${hoverKey > 0 ? " avo-3d-svg" : ""}`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            {/* Outer dark-green skin */}
            <path
              d="M50 8 C30 8 16 26 16 50 C16 82 30 112 50 112 C70 112 84 82 84 50 C84 26 70 8 50 8Z"
              fill="#1a5216"
            />
            {/* Pebble texture spots */}
            <circle cx="37" cy="31" r="3.2" fill="#133d10" opacity="0.55"/>
            <circle cx="63" cy="27" r="2.8" fill="#133d10" opacity="0.5"/>
            <circle cx="27" cy="54" r="2.4" fill="#133d10" opacity="0.42"/>
            <circle cx="73" cy="57" r="2.8" fill="#133d10" opacity="0.42"/>
            <circle cx="40" cy="68" r="1.8" fill="#133d10" opacity="0.32"/>
            <circle cx="67" cy="82" r="2.2" fill="#133d10" opacity="0.32"/>
            {/* Light-green flesh */}
            <path
              d="M50 17 C34 17 25 33 25 52 C25 78 36 103 50 103 C64 103 75 78 75 52 C75 33 66 17 50 17Z"
              fill="#9fd654"
            />
            {/* Flesh highlight streak */}
            <path
              d="M40 24 C34 33 32 44 34 55"
              stroke="rgba(255,255,255,0.38)"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            {/* Seed outer */}
            <ellipse cx="50" cy="70" rx="17" ry="22" fill="#7a4f2d"/>
            {/* Seed inner */}
            <ellipse cx="50" cy="70" rx="13" ry="18" fill="#a06842"/>
            {/* Seed shine */}
            <ellipse
              cx="44" cy="63"
              rx="4.5" ry="5.5"
              fill="rgba(255,255,255,0.2)"
              transform="rotate(-10 44 63)"
            />
          </svg>

          {/* Subtle inner top-glow on the button itself */}
          <span
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at 40% 25%, rgba(255,255,255,0.22) 0%, transparent 65%)"
            }}
            aria-hidden
          />
        </Link>
      </div>
    </div>
  );
}

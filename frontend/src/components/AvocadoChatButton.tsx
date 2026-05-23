"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const SESSION_KEY  = "avocado_popup_shown";   // sessionStorage — once per browser session
const DISMISS_KEY  = "avocado_popup_snoozed"; // localStorage  — timestamp, snooze 7 days on ×

function shouldAutoShow(): boolean {
  if (typeof window === "undefined") return false;
  // Don't re-show within the same browser session
  if (sessionStorage.getItem(SESSION_KEY)) return false;
  // Don't re-show if user explicitly dismissed within the last 7 days
  const snoozed = localStorage.getItem(DISMISS_KEY);
  if (snoozed && Date.now() - Number(snoozed) < 7 * 24 * 60 * 60 * 1000) return false;
  return true;
}

export default function AvocadoChatButton() {
  const [mounted, setMounted]                 = useState(false);
  const [visible, setVisible]                 = useState(false);
  const [permanentlyClosed, setPermanentlyClosed] = useState(false);
  const [hoverKey, setHoverKey]               = useState(0);
  const autoHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setMounted(true); }, []);

  /* Auto-show once per session, 4 s after mount */
  useEffect(() => {
    if (!mounted || permanentlyClosed) return;
    if (!shouldAutoShow()) return;
    const t = setTimeout(() => {
      setVisible(true);
      sessionStorage.setItem(SESSION_KEY, "1"); // mark shown for this session
    }, 4000);
    return () => clearTimeout(t);
  }, [mounted, permanentlyClosed]);

  /* Auto-hide after 8 s of being visible */
  useEffect(() => {
    if (!visible) return;
    if (autoHideTimer.current) clearTimeout(autoHideTimer.current);
    autoHideTimer.current = setTimeout(() => setVisible(false), 8000);
    return () => { if (autoHideTimer.current) clearTimeout(autoHideTimer.current); };
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
    // Snooze for 7 days
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  if (!mounted) return null;

  return (
    <div className="hidden md:block fixed bottom-7 right-7 z-50">
      <div className="flex flex-col items-end gap-3">

        {/* ── Popup card ── */}
        {visible && (
          <div className="animate-bubble-in">
            <div
              className="relative w-64 rounded-2xl border border-border bg-surface overflow-hidden"
              style={{ boxShadow: "0 12px 48px rgba(0,0,0,0.10), 0 3px 14px rgba(79,70,229,0.08)" }}
            >
              {/* Accent stripe */}
              <div className="h-[2px] w-full bg-gradient-to-r from-indigo-500 via-violet-400 to-indigo-500" />

              <div className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
                      style={{ background: "radial-gradient(circle at 38% 32%, #7ed957, #2d7d1e)" }}
                    >
                      <svg viewBox="0 0 100 120" className="h-4 w-4" fill="none">
                        <path d="M50 8 C30 8 16 26 16 50 C16 82 30 112 50 112 C70 112 84 82 84 50 C84 26 70 8 50 8Z" fill="#1a5216"/>
                        <path d="M50 17 C34 17 25 33 25 52 C25 78 36 103 50 103 C64 103 75 78 75 52 C75 33 66 17 50 17Z" fill="#9fd654"/>
                        <ellipse cx="50" cy="70" rx="17" ry="22" fill="#7a4f2d"/>
                        <ellipse cx="50" cy="70" rx="13" ry="18" fill="#a06842"/>
                      </svg>
                      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-green-500" />
                    </div>
                    <div>
                      <p className="text-[12px] font-bold leading-none text-fg">Avocado</p>
                      <p className="mt-0.5 text-[10px] font-medium leading-none text-green-500 dark:text-green-400">Online</p>
                    </div>
                  </div>

                  <button
                    onClick={handleClose}
                    className="flex h-5 w-5 items-center justify-center rounded-full text-base leading-none text-fg-faint transition-colors hover:bg-surface-raised hover:text-fg"
                    aria-label="Dismiss"
                  >
                    ×
                  </button>
                </div>

                {/* Message */}
                <p className="mb-3.5 text-[12px] leading-relaxed text-fg-muted">
                  Ask me anything about Jaya — his projects, experience, or what makes him unique.
                </p>

                {/* CTA */}
                <Link
                  href="/chat"
                  className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #4f46e5, #6366f1)" }}
                >
                  Start chatting
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </Link>
              </div>
            </div>

            {/* Triangle tail */}
            <div
              className="absolute -bottom-[9px] right-[26px] h-4 w-4 rotate-45 border-b border-r border-border bg-surface"
              aria-hidden
            />
          </div>
        )}

        {/* ── Floating avocado button ── */}
        <Link
          href="/chat"
          onMouseEnter={handleHoverEnter}
          aria-label="Chat with Avocado AI"
          className="animate-avo-float animate-avo-glow group relative flex h-[60px] w-[60px] items-center justify-center rounded-full transition-transform duration-200 hover:scale-110 active:scale-95"
          style={{ background: "radial-gradient(circle at 36% 30%, #7ed957, #2d7d1e)" }}
        >
          <span
            className="absolute inset-[-4px] rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none"
            style={{ boxShadow: "0 0 0 3px rgba(100,200,60,0.35)" }}
            aria-hidden
          />
          <svg
            key={hoverKey}
            viewBox="0 0 100 120"
            className={`relative z-10 h-[38px] w-8 drop-shadow-sm${hoverKey > 0 ? " avo-3d-svg" : ""}`}
            fill="none"
            aria-hidden
          >
            <path d="M50 8 C30 8 16 26 16 50 C16 82 30 112 50 112 C70 112 84 82 84 50 C84 26 70 8 50 8Z" fill="#1a5216"/>
            <circle cx="37" cy="31" r="3.2" fill="#133d10" opacity="0.55"/>
            <circle cx="63" cy="27" r="2.8" fill="#133d10" opacity="0.5"/>
            <circle cx="27" cy="54" r="2.4" fill="#133d10" opacity="0.42"/>
            <circle cx="73" cy="57" r="2.8" fill="#133d10" opacity="0.42"/>
            <circle cx="40" cy="68" r="1.8" fill="#133d10" opacity="0.32"/>
            <circle cx="67" cy="82" r="2.2" fill="#133d10" opacity="0.32"/>
            <path d="M50 17 C34 17 25 33 25 52 C25 78 36 103 50 103 C64 103 75 78 75 52 C75 33 66 17 50 17Z" fill="#9fd654"/>
            <path d="M40 24 C34 33 32 44 34 55" stroke="rgba(255,255,255,0.38)" strokeWidth="4.5" strokeLinecap="round"/>
            <ellipse cx="50" cy="70" rx="17" ry="22" fill="#7a4f2d"/>
            <ellipse cx="50" cy="70" rx="13" ry="18" fill="#a06842"/>
            <ellipse cx="44" cy="63" rx="4.5" ry="5.5" fill="rgba(255,255,255,0.2)" transform="rotate(-10 44 63)"/>
          </svg>
          <span
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 40% 25%, rgba(255,255,255,0.22) 0%, transparent 65%)" }}
            aria-hidden
          />
        </Link>
      </div>
    </div>
  );
}

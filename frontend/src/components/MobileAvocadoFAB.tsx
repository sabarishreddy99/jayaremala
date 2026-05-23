"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const FAB_SESSION_KEY = "avocado_fab_expanded";

export default function MobileAvocadoFAB() {
  const [mounted, setMounted]   = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Only expand once per browser session
    if (sessionStorage.getItem(FAB_SESSION_KEY)) return;

    const t1 = setTimeout(() => setExpanded(true), 2000);
    const t2 = setTimeout(() => {
      setExpanded(false);
      sessionStorage.setItem(FAB_SESSION_KEY, "1");
    }, 7000);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (!mounted) return null;

  return (
    <div className="md:hidden fixed bottom-6 right-5 z-50 animate-float">
      <Link
        href="/chat"
        aria-label="Chat with Avocado AI"
        className={`
          relative flex items-center rounded-full
          transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)]
          active:scale-95
          ${expanded ? "pl-2.5 pr-5 py-2" : "p-2"}
        `}
        style={{
          background: "radial-gradient(circle at 36% 30%, #7ed957, #2d7d1e)",
          boxShadow: "0 6px 24px rgba(34,110,20,0.42), 0 2px 10px rgba(0,0,0,0.22)",
        }}
      >
        <svg
          viewBox="0 0 100 120"
          className="w-9 h-[43px] flex-shrink-0 relative z-10"
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
          className="overflow-hidden whitespace-nowrap text-white font-semibold text-sm leading-none relative z-10 transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)]"
          style={{
            maxWidth: expanded ? "110px" : "0px",
            opacity:  expanded ? 1 : 0,
            marginLeft: expanded ? "8px" : "0px",
          }}
          aria-hidden={!expanded}
        >
          Ask Avocado <span className="opacity-70">✦</span>
        </span>

        <span
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 40% 25%, rgba(255,255,255,0.2) 0%, transparent 60%)" }}
          aria-hidden
        />
      </Link>
    </div>
  );
}

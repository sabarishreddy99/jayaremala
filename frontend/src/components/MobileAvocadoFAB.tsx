"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { profile } from "@/data/profile";

const NAV_ITEMS = [
  {
    href: "/portfolio",
    label: "Home",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    href: "/experience",
    label: "Experience",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
        <line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
      </svg>
    ),
  },
  {
    href: "/education",
    label: "Education",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
      </svg>
    ),
  },
  {
    href: "/projects",
    label: "Projects",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
      </svg>
    ),
  },
  {
    href: "/lab",
    label: "Lab",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-3"/>
        <path d="M9 3a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2"/><path d="M9 3a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/>
        <line x1="9" y1="14" x2="15" y2="14"/><line x1="9" y1="10" x2="15" y2="10"/>
      </svg>
    ),
  },
  {
    href: "/blog",
    label: "Blog",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
  },
  {
    href: "/quotes",
    label: "Quotes",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
        <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
      </svg>
    ),
  },
  {
    href: profile.resume,
    label: "Resume",
    external: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/>
      </svg>
    ),
  },
];

export default function MobileAvocadoFAB() {
  const [open, setOpen]       = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const hidden = pathname.startsWith("/blog") || pathname.startsWith("/lab") || pathname === "/quotes";
  if (!mounted || hidden) return null;

  const isActive = (href: string) =>
    href === "/portfolio" ? pathname === "/portfolio" : pathname.startsWith(href);

  return (
    <>
      {/* FAB trigger */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open site navigation"
        className="md:hidden fixed bottom-6 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg shadow-indigo-500/25 active:scale-95 transition-transform duration-150"
        style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5"/>
          <rect x="14" y="3" width="7" height="7" rx="1.5"/>
          <rect x="14" y="14" width="7" height="7" rx="1.5"/>
          <rect x="3" y="14" width="7" height="7" rx="1.5"/>
        </svg>
      </button>

      {/* Backdrop */}
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={`md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Bottom sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        className={`md:hidden fixed bottom-0 inset-x-0 z-50 rounded-t-[28px] bg-surface border-t border-border
          transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)]
          ${open ? "translate-y-0" : "translate-y-full"}`}
        style={{ boxShadow: "0 -12px 48px rgba(0,0,0,0.18)" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-fg-faint mb-0.5">Pages</p>
            <p className="text-base font-bold text-fg leading-none">
              Jaya<span className="text-indigo-500">.</span>
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-raised text-fg-muted hover:text-fg transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Nav grid */}
        <div className="px-4 grid grid-cols-2 gap-2.5">
          {NAV_ITEMS.map((item) => {
            const active = !item.external && isActive(item.href);
            const linkProps = item.external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : { onClick: () => setOpen(false) };

            return (
              <Link
                key={item.href}
                href={item.href}
                {...linkProps}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 border transition-all duration-150
                  ${active
                    ? "bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400"
                    : "border-border bg-surface-raised text-fg-muted hover:border-indigo-200 dark:hover:border-indigo-800 hover:text-fg"
                  }`}
              >
                <span className={active ? "text-indigo-500" : "text-fg-faint"}>
                  {item.icon}
                </span>
                <span className="text-sm font-medium leading-none">{item.label}</span>
                {item.external && (
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="ml-auto text-fg-faint shrink-0">
                    <path d="M7 17L17 7M17 7H7M17 7v10"/>
                  </svg>
                )}
              </Link>
            );
          })}
        </div>

        {/* Avocado CTA */}
        <div className="px-4 pt-3 pb-8">
          <Link
            href="/chat"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between w-full rounded-2xl px-5 py-4 transition-opacity hover:opacity-90 active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}
          >
            <div className="flex items-center gap-3">
              {/* Avocado icon */}
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{ background: "radial-gradient(circle at 38% 32%, #7ed957, #2d7d1e)" }}
              >
                <svg viewBox="0 0 100 120" className="h-5 w-4" fill="none">
                  <path d="M50 8 C30 8 16 26 16 50 C16 82 30 112 50 112 C70 112 84 82 84 50 C84 26 70 8 50 8Z" fill="#1a5216"/>
                  <path d="M50 17 C34 17 25 33 25 52 C25 78 36 103 50 103 C64 103 75 78 75 52 C75 33 66 17 50 17Z" fill="#9fd654"/>
                  <ellipse cx="50" cy="70" rx="17" ry="22" fill="#7a4f2d"/>
                  <ellipse cx="50" cy="70" rx="13" ry="18" fill="#a06842"/>
                </svg>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-white/90 leading-none mb-0.5">Chat with Avocado</p>
                <p className="text-[10px] text-white/60 leading-none">Ask anything about Jaya</p>
              </div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="opacity-70">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>
      </div>
    </>
  );
}

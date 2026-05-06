"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ChatCloseButton() {
  const router = useRouter();

  /* Esc key navigates back to portfolio */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.push("/");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <Link
      href="/"
      aria-label="Back to portfolio (press Esc)"
      className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/70 backdrop-blur-sm px-3 py-1.5 text-fg-faint hover:text-fg hover:border-fg-subtle hover:bg-surface transition-all duration-200 group shadow-sm"
    >
      {/* Label expands on hover */}
      <span className="overflow-hidden whitespace-nowrap text-[11px] font-semibold tracking-wide max-w-0 group-hover:max-w-[70px] transition-[max-width] duration-200 ease-out">
        Portfolio
      </span>

      {/* × icon — always visible */}
      <svg
        width="13" height="13" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2.5"
        className="flex-shrink-0"
      >
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>

      {/* Esc badge — large screens only, appears on hover */}
      <span className="hidden lg:block text-[9px] font-mono tracking-wider opacity-0 group-hover:opacity-50 transition-opacity duration-200 border border-border rounded px-1 py-0.5 leading-none">
        esc
      </span>
    </Link>
  );
}

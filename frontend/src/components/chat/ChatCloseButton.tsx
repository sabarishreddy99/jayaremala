"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ChatCloseButton() {
  const router = useRouter();

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
      className="hidden md:inline-flex items-center gap-2.5 rounded-xl border border-border bg-surface/80 backdrop-blur-sm px-3.5 py-2 shadow-sm group
                 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md hover:bg-surface
                 transition-all duration-200"
    >
      {/* Back arrow — nudges left on hover */}
      <svg
        width="13" height="13" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round"
        className="text-fg-faint group-hover:text-indigo-500 dark:group-hover:text-indigo-400 group-hover:-translate-x-0.5 transition-all duration-150 shrink-0"
      >
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>

      {/* Label — always visible */}
      <span className="text-[12px] font-semibold text-fg-muted group-hover:text-fg transition-colors duration-150 tracking-wide">
        Portfolio
      </span>

      {/* Esc badge — always visible on lg+ */}
      <kbd className="hidden lg:inline-flex items-center text-[9px] font-mono bg-bg border border-border rounded-md px-1.5 py-0.5 leading-none text-fg-faint shadow-sm group-hover:border-indigo-200 dark:group-hover:border-indigo-800 transition-colors duration-150">
        esc
      </kbd>
    </Link>
  );
}

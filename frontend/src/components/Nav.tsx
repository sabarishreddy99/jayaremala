"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { profile } from "@/data/profile";
import ThemeToggle from "@/components/ThemeToggle";
import ReadingProgress from "@/components/blog/ReadingProgress";

const links = [
  { href: "/experience", label: "Experience" },
  { href: "/education",  label: "Education"  },
  { href: "/projects",   label: "Projects"   },
  { href: "/lab",        label: "Lab"        },
  { href: "/blog",       label: "Blog"       },
  { href: "/quotes",     label: "Quotes"     },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-border relative">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 sm:px-6 py-3.5">
        {/* Logo */}
        <Link
          href="/"
          className="text-sm font-bold tracking-tight text-fg hover:opacity-70 transition-opacity"
          onClick={() => setOpen(false)}
        >
          Jaya<span className="text-indigo-600 dark:text-indigo-400">.</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                pathname.startsWith(l.href)
                  ? "bg-surface-raised text-fg font-medium"
                  : "text-fg-subtle hover:text-fg hover:bg-surface-raised"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <a
            href={profile.resume}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 px-3 py-1.5 rounded-lg text-sm text-fg-subtle hover:text-fg hover:bg-surface-raised transition-colors inline-flex items-center gap-1"
          >
            Resume
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M7 17L17 7M17 7H7M17 7v10"/>
            </svg>
          </a>
          <ThemeToggle />
          <Link
            href="/admin"
            title="Admin"
            className={`p-2 rounded-lg transition-colors ${
              pathname === "/admin"
                ? "text-fg bg-surface-raised"
                : "text-fg-faint hover:text-fg-subtle hover:bg-surface-raised"
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </Link>
          <Link
            href="/chat"
            className="ml-2 px-4 py-1.5 rounded-full bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Chat with Avocado ✦
          </Link>
        </nav>

        {/* Mobile controls */}
        <div className="md:hidden flex items-center gap-1">
          <ThemeToggle />
          <Link
            href="/admin"
            title="Admin"
            onClick={() => setOpen(false)}
            className={`p-2 rounded-lg transition-colors ${
              pathname === "/admin"
                ? "text-fg bg-surface-raised"
                : "text-fg-faint hover:text-fg-subtle hover:bg-surface-raised"
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </Link>
          <button
            className="p-2 rounded-lg text-fg-subtle hover:text-fg hover:bg-surface-raised transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t border-border-subtle bg-surface px-4 pb-4 pt-2">
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  pathname.startsWith(l.href)
                    ? "bg-surface-raised text-fg font-medium"
                    : "text-fg-muted hover:bg-surface-raised"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <a
              href={profile.resume}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="px-3 py-2.5 rounded-lg text-sm text-fg-muted hover:bg-surface-raised transition-colors flex items-center gap-1.5"
            >
              Resume
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M7 17L17 7M17 7H7M17 7v10"/>
              </svg>
            </a>
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="px-3 py-2.5 rounded-lg text-sm text-fg-faint hover:bg-surface-raised transition-colors flex items-center gap-2"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Admin
            </Link>
          </nav>
        </div>
      )}

      {/* Reading progress — only on individual blog/lab posts */}
      {/^\/(blog|lab)\/.+/.test(pathname) && <ReadingProgress />}
    </header>
  );
}

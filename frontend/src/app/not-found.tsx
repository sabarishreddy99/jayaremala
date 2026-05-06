import Link from "next/link";
import type { ReactNode } from "react";

// ── Icons ─────────────────────────────────────────────────────────────────────
// All 18×18, stroke-based, theme-aware via currentColor

function IconHome() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  );
}

function IconBriefcase() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <line x1="12" y1="12" x2="12" y2="17" />
      <line x1="9.5" y1="14.5" x2="14.5" y2="14.5" />
    </svg>
  );
}

function IconCode() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function IconFileText() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}

function IconBook() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <line x1="12" y1="6" x2="16" y2="6" />
      <line x1="12" y1="10" x2="16" y2="10" />
    </svg>
  );
}

function IconFlask() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10 2v7.31l-4.72 8.09A2 2 0 0 0 7 20h10a2 2 0 0 0 1.72-2.6L14 9.31V2" />
      <line x1="8.5" y1="2" x2="15.5" y2="2" />
      <circle cx="9" cy="15" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="13" cy="16.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconMessageAI() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <circle cx="9" cy="10" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="12" cy="10" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="15" cy="10" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────

const LINKS: { href: string; label: string; desc: string; icon: ReactNode }[] = [
  { href: "/",           label: "Portfolio",  desc: "Home — hero, projects & contact", icon: <IconHome /> },
  { href: "/experience", label: "Experience", desc: "Work history & roles",            icon: <IconBriefcase /> },
  { href: "/projects",   label: "Projects",   desc: "Things I've built",               icon: <IconCode /> },
  { href: "/blog",       label: "Blog",       desc: "Notes & long-form writing",       icon: <IconFileText /> },
  { href: "/education",  label: "Education",  desc: "Degrees & highlights",            icon: <IconBook /> },
  { href: "/lab",        label: "Lab",        desc: "Living system docs",              icon: <IconFlask /> },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] bg-bg flex flex-col">

      {/* Minimal header */}
      <header className="px-5 sm:px-8 pt-5 pb-4 shrink-0">
        <Link
          href="/"
          className="text-sm font-black tracking-tight text-fg hover:opacity-70 transition-opacity"
        >
          Jaya<span className="text-indigo-600 dark:text-indigo-400">.</span>
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10 sm:py-16">

        {/* Hero — avocado floats over the "404" watermark */}
        <div className="relative flex flex-col items-center mb-10 sm:mb-12">

          {/* 404 watermark */}
          <span
            className="absolute inset-x-0 text-center select-none pointer-events-none font-black leading-none text-border/40 dark:text-border/30"
            style={{ fontSize: "clamp(7rem, 28vw, 15rem)", top: "50%", transform: "translateY(-50%)", zIndex: 0 }}
            aria-hidden
          >
            404
          </span>

          {/* Floating avocado */}
          <div className="relative z-10 mb-5" style={{ animation: "avo-float 3s ease-in-out infinite" }}>
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-green-400/15 blur-2xl scale-125" aria-hidden />
              <svg width="72" height="92" viewBox="0 0 80 102" aria-hidden focusable="false">
                <path d="M40 3C21 3 8 22 8 47c0 27 14 52 32 52s32-25 32-52C72 22 59 3 40 3z" fill="#2d5a3d" />
                <path d="M40 14C27 14 18 28 18 47c0 20 10 43 22 43s22-23 22-43c0-19-9-33-22-33z" fill="#c8e054" />
                <ellipse cx="40" cy="65" rx="11" ry="15" fill="#7c4a1e" />
              </svg>
            </div>
          </div>

          {/* Copy */}
          <div className="relative z-10 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-fg mb-2.5">
              This page got scooped out
            </h1>
            <p className="text-sm text-fg-subtle max-w-xs sm:max-w-sm mx-auto leading-relaxed">
              Looks like this pit led nowhere. Here&apos;s where you actually want to go:
            </p>
          </div>
        </div>

        {/* Navigation grid */}
        <div className="w-full max-w-xl grid grid-cols-1 sm:grid-cols-2 gap-2.5">

          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex items-center gap-3.5 rounded-2xl border border-border bg-surface px-4 py-3.5 transition-all duration-200 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md"
            >
              {/* Icon pill */}
              <div className="w-9 h-9 rounded-xl bg-surface-raised flex items-center justify-center text-fg-subtle shrink-0 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/60 group-hover:text-accent transition-colors duration-200">
                {link.icon}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-fg leading-none mb-1 group-hover:text-accent transition-colors duration-150">
                  {link.label}
                </p>
                <p className="text-[11px] text-fg-faint truncate">{link.desc}</p>
              </div>

              <svg
                className="shrink-0 text-fg-faint group-hover:text-accent group-hover:translate-x-0.5 transition-all duration-150"
                width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" aria-hidden
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          ))}

          {/* Chat with Avocado — full-width accent card */}
          <Link
            href="/chat"
            className="group sm:col-span-2 flex items-center gap-3.5 rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-accent-light px-4 py-4 transition-all duration-200 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-md"
          >
            {/* Icon pill — always accent-tinted */}
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-accent shrink-0 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900 transition-colors duration-200">
              <IconMessageAI />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-accent leading-none mb-1">
                Chat with Avocado ✦
              </p>
              <p className="text-[11px] text-fg-faint">
                Ask Jaya&apos;s AI anything — experience, projects, or just say hello
              </p>
            </div>

            <svg
              className="shrink-0 text-accent/50 group-hover:text-accent group-hover:translate-x-0.5 transition-all duration-150"
              width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" aria-hidden
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>

        </div>
      </main>

      {/* Footer */}
      <footer className="shrink-0 border-t border-border px-5 py-4 text-center">
        <p className="text-xs text-fg-faint">
          © {new Date().getFullYear()} Jaya Sabarish Reddy Remala
        </p>
      </footer>

    </div>
  );
}

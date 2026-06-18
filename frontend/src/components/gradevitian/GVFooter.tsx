"use client";

import { useEffect, useRef, useState } from "react";
import GVLink from "@/components/gradevitian/GVLink";
import GVInstall from "@/components/gradevitian/GVInstall";
import LiquidWave from "@/components/LiquidWave";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Calculators",
    links: [
      { label: "GPA", href: "/gpa" },
      { label: "CGPA", href: "/cgpa" },
      { label: "Grade Predictor", href: "/grade-predictor" },
      { label: "CGPA Estimator", href: "/cgpa-estimator" },
      { label: "Attendance", href: "/attendance" },
    ],
  },
  {
    title: "gradeVITian",
    links: [
      { label: "Your account", href: "/account" },
      { label: "Feedback", href: "/feedback" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

const GradHat = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M22 10 12 5 2 10l10 5 10-5Z" />
    <path d="M6 12v4.5c0 .9 2.7 2.5 6 2.5s6-1.6 6-2.5V12" />
    <path d="M22 10v5" />
  </svg>
);

export default function GVFooter() {
  const [revealed, setRevealed] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setRevealed(true); },
      { threshold: 0.06 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <footer ref={ref} className="relative mt-auto overflow-hidden bg-bg">
      {/* Depth glow */}
      <div aria-hidden className="pointer-events-none absolute bottom-0 left-0 right-0 h-2/3 bg-linear-to-t from-accent/5 via-transparent to-transparent" />
      {/* Liquid wave */}
      <div className="text-accent"><LiquidWave /></div>
      {/* Dot-grid texture */}
      <div aria-hidden className="hero-dot-grid pointer-events-none absolute inset-0 opacity-[0.3]" />

      <div
        className={`relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6 pt-16 pb-7 sm:pt-20
                    transition-[opacity,transform] duration-700 ease-out
                    ${revealed ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}
      >
        {/* ── Top: brand + columns ── */}
        <div className="grid gap-10 md:grid-cols-[1.3fr_2fr] lg:gap-16">
          {/* Brand */}
          <div>
            <GVLink
              href="/"
              className="inline-flex items-center gap-2 text-2xl font-normal tracking-widest text-fg transition-opacity hover:opacity-70"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              <span className="text-accent"><GradHat /></span>
              <span>grade<span className="text-accent">VIT</span>ian</span>
            </GVLink>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-fg-muted">
              Free GPA, CGPA, grade &amp; attendance calculators — built by a VITian, for every VITian.
            </p>
            <div className="mt-5">
              <GVInstall variant="hero" />
            </div>
          </div>

          {/* Columns */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="mb-3.5 text-[10px] font-bold uppercase tracking-[0.16em] text-fg-faint">{col.title}</p>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <GVLink href={l.href} className="text-[13px] text-fg-muted transition-colors hover:text-accent">
                        {l.label}
                      </GVLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="mt-12 flex flex-col gap-3 border-t border-border-subtle pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-[11px] font-semibold tracking-[0.06em] text-fg">
              © {new Date().getFullYear()} grade<span className="text-accent">VIT</span>ian
            </span>
            <span className="font-mono text-[10px] tracking-[0.08em] text-fg-subtle">
              From the Class of 2021 · VIT, Vellore
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <a href="/gradevitian/sitemap.xml" target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] tracking-[0.06em] text-fg-muted transition-colors hover:text-fg">Sitemap</a>
            <a href="https://jayaremala.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-mono text-[11px] tracking-[0.06em] text-fg-muted transition-colors hover:text-accent">
              Built by Jaya
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden><path d="M7 17L17 7M17 7H7M17 7v10" /></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

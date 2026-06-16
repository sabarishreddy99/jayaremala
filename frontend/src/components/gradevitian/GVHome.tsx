"use client";

import Image from "next/image";
import GVLink from "@/components/gradevitian/GVLink";
import ScrollReveal from "@/components/ScrollReveal";
import { useGVAuth } from "@/components/gradevitian/GVAuthProvider";

const TOOLS = [
  { href: "/gpa", title: "GPA Calculator", desc: "Your semester GPA from grades & credits.", img: "/gradevitian/gpaimg.svg" },
  { href: "/cgpa", title: "CGPA Calculator", desc: "Cumulative CGPA, semester by semester.", img: "/gradevitian/instant-cgpaimg.svg" },
  { href: "/grade-predictor", title: "Grade Predictor", desc: "See your final grade before results drop.", img: "/gradevitian/target.svg" },
  { href: "/cgpa-estimator", title: "CGPA Estimator", desc: "The GPA you need next sem to hit your goal.", img: "/gradevitian/growth.svg" },
  { href: "/attendance", title: "Attendance", desc: "Stay safely above the 75% line.", img: "/gradevitian/improve.svg" },
  { href: "/grade-predictor", title: "Weightage Converter", desc: "Turn raw scores into weighted marks.", img: "/gradevitian/weightage-conv.svg" },
];

export default function GVHome() {
  const { user, loading } = useGVAuth();
  const firstName = user?.name.split(" ")[0] ?? "";

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="gv-aurora" aria-hidden />
        <div className="grid-lines pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 md:grid-cols-[1.15fr_0.85fr] md:py-28">
          <ScrollReveal>
            {user ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-nano font-semibold uppercase tracking-[0.16em] text-accent">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Welcome back
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1 text-nano font-semibold uppercase tracking-[0.16em] text-fg-muted backdrop-blur">
                Built for VITians
              </span>
            )}

            <h1 className="mt-5 text-[2.5rem] font-bold leading-[1.05] tracking-tight text-fg sm:text-5xl md:text-6xl">
              {user ? (
                <>Hi, {firstName}.</>
              ) : (
                <>grade<span className="bg-gradient-to-r from-accent to-[color:var(--accent-secondary)] bg-clip-text text-transparent">VIT</span>ian</>
              )}
            </h1>

            <p className="mt-5 max-w-md text-lead leading-relaxed text-fg-muted">
              {user ? (
                <>Your calculators and saved results are right where you left them. Pick a tool and keep going.</>
              ) : (
                <>Your all-in-one grading companion — compute your <strong className="font-semibold text-fg">GPA</strong>, <strong className="font-semibold text-fg">CGPA</strong>, predict <strong className="font-semibold text-fg">grades</strong>, and track <strong className="font-semibold text-fg">attendance</strong>, beautifully.</>
              )}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {user ? (
                <>
                  <GVLink href="/account" className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-fg shadow-sm shadow-accent/25 transition-all duration-200 hover:bg-accent-hover hover:shadow-md active:scale-[0.97]">
                    Open your dashboard
                  </GVLink>
                  <GVLink href="/cgpa" className="rounded-xl border border-border bg-surface/60 px-6 py-3 text-sm font-semibold text-fg backdrop-blur transition-all duration-200 hover:bg-surface-raised active:scale-[0.97]">
                    Jump back in
                  </GVLink>
                </>
              ) : (
                <>
                  <GVLink href="/cgpa" className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-fg shadow-sm shadow-accent/25 transition-all duration-200 hover:bg-accent-hover hover:shadow-md active:scale-[0.97]">
                    Start calculating
                  </GVLink>
                  {!loading && (
                    <GVLink href="/signup" className="rounded-xl border border-border bg-surface/60 px-6 py-3 text-sm font-semibold text-fg backdrop-blur transition-all duration-200 hover:bg-surface-raised active:scale-[0.97]">
                      Create a free account
                    </GVLink>
                  )}
                </>
              )}
            </div>
          </ScrollReveal>

          <ScrollReveal direction="scale" delay={120} className="hidden justify-center md:flex">
            <div className="relative">
              <div className="absolute inset-0 -z-10 rounded-full bg-accent/10 blur-3xl" aria-hidden />
              <Image src="/gradevitian/intro-img.svg" alt="" width={440} height={440} className="w-full max-w-sm drop-shadow-xl" priority />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Tool grid */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <ScrollReveal>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-fg">{user ? "Your tools" : "Pick a tool"}</h2>
              <p className="mt-1 text-fg-muted">
                {user ? "Saved results sync to your account automatically." : "Free to use, no sign-up required. Log in to save results."}
              </p>
            </div>
          </div>
        </ScrollReveal>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((t, i) => (
            <ScrollReveal key={t.title} delay={i * 60}>
              <GVLink
                href={t.href}
                className="group flex h-full items-start gap-4 rounded-3xl border border-border-subtle bg-surface/70 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-[0_12px_40px_-12px_rgba(79,70,229,0.35)]"
              >
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-accent/15 to-[color:var(--accent-secondary)]/10 ring-1 ring-inset ring-accent/15">
                  <Image src={t.img} alt="" width={32} height={32} className="h-8 w-8" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-fg transition-colors group-hover:text-accent">{t.title}</h3>
                  <p className="mt-1 text-sm leading-snug text-fg-muted">{t.desc}</p>
                </div>
              </GVLink>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Bottom band — account-aware */}
      <section className="mx-auto max-w-6xl px-4 pb-8 sm:pb-10">
        <ScrollReveal>
          {user ? (
            <div className="overflow-hidden rounded-3xl border border-border-subtle bg-gradient-to-br from-accent/[0.08] to-transparent p-8 sm:p-10">
              <div className="flex flex-wrap items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent text-lg font-bold text-accent-fg shadow-sm shadow-accent/30">
                    {firstName.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-fg">This is your space, {firstName}.</h2>
                    <p className="mt-1 text-fg-muted">Saved calculations, notifications and more — all in one place.</p>
                  </div>
                </div>
                <GVLink href="/account" className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-fg shadow-sm shadow-accent/25 transition-all duration-200 hover:bg-accent-hover active:scale-[0.97]">
                  Go to dashboard
                </GVLink>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-border-subtle bg-gradient-to-br from-accent/[0.08] to-transparent p-8 sm:p-10">
              <div className="flex flex-wrap items-center justify-between gap-5">
                <div>
                  <h2 className="text-xl font-bold text-fg">Make it yours</h2>
                  <p className="mt-1 max-w-md text-fg-muted">Create a free account to save your calculations and pick up on any device.</p>
                </div>
                <GVLink href="/signup" className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-fg shadow-sm shadow-accent/25 transition-all duration-200 hover:bg-accent-hover active:scale-[0.97]">
                  Create free account
                </GVLink>
              </div>
            </div>
          )}
        </ScrollReveal>
      </section>

      {/* Feedback tile */}
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <ScrollReveal>
          <GVLink
            href="/feedback"
            className="group flex flex-col items-start gap-4 rounded-3xl border border-border-subtle bg-surface/70 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_12px_40px_-12px_rgba(79,70,229,0.3)] sm:flex-row sm:items-center sm:justify-between sm:p-7"
          >
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-accent/15 to-[color:var(--accent-secondary)]/10 text-accent ring-1 ring-inset ring-accent/15">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="font-semibold text-fg">Got a suggestion or found a bug?</h2>
                <p className="mt-0.5 text-sm text-fg-muted">We read every message — tell us what would make gradeVITian better.</p>
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-xl border border-border bg-surface/60 px-4 py-2 text-sm font-semibold text-fg transition-colors group-hover:border-accent/40 group-hover:text-accent sm:self-auto">
              Share feedback
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="transition-transform group-hover:translate-x-0.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </span>
          </GVLink>
        </ScrollReveal>
      </section>
    </>
  );
}

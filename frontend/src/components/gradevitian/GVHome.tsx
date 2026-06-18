"use client";

import Image from "next/image";
import GVLink from "@/components/gradevitian/GVLink";
import ScrollReveal from "@/components/ScrollReveal";
import GVStats, { type GVStat } from "@/components/gradevitian/GVStats";
import GVHeroTitle from "@/components/gradevitian/GVHeroTitle";
import GVVisits from "@/components/gradevitian/GVVisits";
import GVSearch from "@/components/gradevitian/GVSearch";
import GVNotes from "@/components/gradevitian/GVNotes";
import HeroDotGrid from "@/components/HeroDotGrid";
import Parallax from "@/components/Parallax";
import GVLinkedInEmbed from "@/components/gradevitian/GVLinkedInEmbed";
import GVRefer from "@/components/gradevitian/GVRefer";
import GVInstall from "@/components/gradevitian/GVInstall";
import { useGVAuth } from "@/components/gradevitian/GVAuthProvider";

const METRICS: GVStat[] = [
  { value: "17K+", label: "Monthly Active Users", sub: "Peak student traffic" },
  { value: "20K+", label: "Registered Accounts", sub: "VITians onboarded" },
  { value: "#2", label: "Google Search Rank", sub: "Programmatic SEO" },
  { value: "<1s", label: "Mobile Load Time", sub: "Sub-second, PWA-optimized" },
  { value: "6+", label: "Years in Production", sub: "Continuously live & maintained" },
];

const TOOLS = [
  { href: "/gpa", title: "GPA Calculator", desc: "Your semester GPA from grades & credits.", img: "/gradevitian/gpaimg.svg" },
  { href: "/cgpa", title: "CGPA Calculator", desc: "Cumulative CGPA, semester by semester.", img: "/gradevitian/instant-cgpaimg.svg" },
  { href: "/grade-predictor", title: "Grade Predictor", desc: "See your final grade before results drop.", img: "/gradevitian/target.svg" },
  { href: "/cgpa-estimator", title: "CGPA Estimator", desc: "The GPA you need next sem to hit your goal.", img: "/gradevitian/growth.svg" },
  { href: "/attendance", title: "Attendance", desc: "Stay safely above the 75% line.", img: "/gradevitian/improve.svg" },
  { href: "/grade-predictor", title: "Weightage Converter", desc: "Turn raw scores into weighted marks.", img: "/gradevitian/weightage-conv.svg" },
];

// Every environment gradeVITian runs on — it's an installable PWA, so it lives on
// any phone, laptop, or browser, and keeps working offline.
const PLATFORMS: { label: string; icon: React.ReactNode }[] = [
  {
    label: "iPhone",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="7" y="2" width="10" height="20" rx="2.5" /><path d="M11 18h2" />
      </svg>
    ),
  },
  {
    label: "Android",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M5 11a7 7 0 0 1 14 0Z" /><path d="M5 11v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
        <path d="M8 7 6.5 5M16 7l1.5-2M9.5 8.5h.01M14.5 8.5h.01" /><path d="M9 19v1.5M15 19v1.5" />
      </svg>
    ),
  },
  {
    label: "macOS",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="3" y="4" width="18" height="12" rx="2" /><path d="M2 20h20l-2-4H4Z" />
      </svg>
    ),
  },
  {
    label: "Windows",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="3" y="3" width="8" height="8" rx="0.5" /><rect x="13" y="3" width="8" height="8" rx="0.5" />
        <rect x="3" y="13" width="8" height="8" rx="0.5" /><rect x="13" y="13" width="8" height="8" rx="0.5" />
      </svg>
    ),
  },
  {
    label: "Any browser",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" />
      </svg>
    ),
  },
  {
    label: "Works offline",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M5 12.55a11 11 0 0 1 14 0M8.5 16.1a6 6 0 0 1 7 0M2 8.82a15 15 0 0 1 20 0" /><path d="M12 20h.01" />
      </svg>
    ),
  },
];

function PlatformStrip() {
  return (
    <div className="mt-9 flex flex-col items-center gap-3.5">
      <p className="text-micro font-medium text-fg-subtle">
        Yours on every device — install it once, use it like a native app
      </p>
      <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-2">
        {PLATFORMS.map((p) => (
          <span
            key={p.label}
            className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface/60 px-3 py-1.5 text-micro font-medium text-fg-muted backdrop-blur"
          >
            <span className="h-3.5 w-3.5 text-accent [&>svg]:h-full [&>svg]:w-full">{p.icon}</span>
            {p.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function GVHome() {
  const { user, loading } = useGVAuth();
  const firstName = user?.name.split(" ")[0] ?? "";

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <Parallax speed={0.18} className="pointer-events-none absolute inset-0">
          <HeroDotGrid />
        </Parallax>

        <div className="relative mx-auto max-w-4xl px-4 pt-24 pb-16 text-center sm:pt-32 sm:pb-20">
          <ScrollReveal>
            {user ? (
              <p className="text-nano font-semibold uppercase tracking-[0.22em] text-accent sm:text-micro">
                Welcome back
              </p>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent-light px-3.5 py-1.5 text-nano font-semibold uppercase tracking-[0.18em] text-accent sm:text-micro">
                <span className="relative flex h-1.5 w-1.5" aria-hidden>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                </span>
                By a VITian · for every VITian
              </span>
            )}

            <GVHeroTitle
              text={user ? `Hi, ${firstName}.` : "gradeVITian"}
              accent={user ? undefined : "VIT"}
              className="mt-6 text-fg"
            />

            <p className="mx-auto mt-6 max-w-xl text-lead leading-relaxed text-fg-muted">
              {user
                ? "Your calculators and saved results are right where you left them — pick a tool and keep going."
                : "Compute your GPA & CGPA, predict grades, and track attendance — fast and free. Built by a VITian, for every VITian, and made to feel like yours."}
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              {user ? (
                <>
                  <GVLink href="/account" className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-fg shadow-sm shadow-accent/25 transition-all duration-200 hover:bg-accent-hover hover:shadow-md active:scale-[0.97]">
                    Open your dashboard
                  </GVLink>
                  <GVLink href="/cgpa" className="rounded-full border border-border bg-surface/60 px-6 py-3 text-sm font-semibold text-fg backdrop-blur transition-all duration-200 hover:bg-surface-raised active:scale-[0.97]">
                    Jump back in
                  </GVLink>
                  <GVInstall variant="hero" />
                </>
              ) : (
                <>
                  <GVInstall variant="hero" prominent />
                  <GVLink href="/cgpa" className="rounded-full border border-border bg-surface/60 px-6 py-3 text-sm font-semibold text-fg backdrop-blur transition-all duration-200 hover:bg-surface-raised active:scale-[0.97]">
                    Start calculating
                  </GVLink>
                  {!loading && (
                    <GVLink href="/signup" className="group inline-flex items-center gap-1 px-2 py-3 text-sm font-semibold text-fg-muted transition-colors hover:text-fg">
                      Create a free account
                      <span className="transition-transform group-hover:translate-x-0.5">→</span>
                    </GVLink>
                  )}
                </>
              )}
            </div>

            <PlatformStrip />

            <div className="mt-7">
              <GVSearch />
            </div>
          </ScrollReveal>

          {/* Impact metrics */}
          <ScrollReveal delay={120} className="mt-14">
            <GVStats stats={METRICS} />
            <p className="mx-auto mt-4 max-w-2xl text-micro leading-relaxed text-fg-subtle">
              Started by one VITian, made theirs by 20K+ more. Around 17K students reach for
              gradeVITian every month — #2 on Google, sub-second loads, and six years strong.
            </p>
            <GVVisits />
          </ScrollReveal>
        </div>
      </section>

      {/* ── Personal notes & goals (logged-in only) ──────────────────────── */}
      {user && (
        <section className="mx-auto max-w-6xl px-4 pt-4">
          <ScrollReveal>
            <GVNotes />
          </ScrollReveal>
        </section>
      )}

      {/* ── Tools ────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <ScrollReveal>
          <h2 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">{user ? "Your tools" : "Five calculators, one home"}</h2>
          <p className="mt-2 text-lead text-fg-muted">
            {user ? "Saved results sync to your account automatically." : "Free to use, no sign-up required. Log in to save your results across devices."}
          </p>
        </ScrollReveal>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((t, i) => (
            <ScrollReveal key={t.title} delay={i * 60}>
              <GVLink
                href={t.href}
                className="group flex h-full items-start gap-4 rounded-3xl border border-border-subtle bg-surface/70 p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-[0_18px_50px_-16px_rgba(79,70,229,0.4)]"
              >
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-accent/15 to-[color:var(--accent-secondary)]/10 ring-1 ring-inset ring-accent/15">
                  <Image src={t.img} alt="" width={32} height={32} className="h-8 w-8" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-fg transition-colors group-hover:text-accent">{t.title}</h3>
                  <p className="mt-1 text-body leading-snug text-fg-muted">{t.desc}</p>
                </div>
              </GVLink>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── Account band ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-8 sm:pb-10">
        <ScrollReveal>
          <div className="overflow-hidden rounded-3xl border border-border-subtle bg-gradient-to-br from-accent/[0.08] to-transparent p-8 sm:p-10">
            <div className="flex flex-wrap items-center justify-between gap-5">
              {user ? (
                <>
                  <div className="flex items-center gap-4">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent text-lg font-bold text-accent-fg shadow-sm shadow-accent/30">
                      {firstName.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-fg">This is your space, {firstName}.</h2>
                      <p className="mt-1 text-fg-muted">Saved calculations, notifications and more — all in one place.</p>
                    </div>
                  </div>
                  <GVLink href="/account" className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-fg shadow-sm shadow-accent/25 transition-all duration-200 hover:bg-accent-hover active:scale-[0.97]">
                    Go to dashboard
                  </GVLink>
                </>
              ) : (
                <>
                  <div>
                    <h2 className="text-xl font-bold text-fg">Make gradeVITian yours</h2>
                    <p className="mt-1 max-w-md text-fg-muted">Create a free account to save your calculations, set goals, and pick up right where you left off — on any device.</p>
                  </div>
                  <GVLink href="/signup" className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-fg shadow-sm shadow-accent/25 transition-all duration-200 hover:bg-accent-hover active:scale-[0.97]">
                    Create free account
                  </GVLink>
                </>
              )}
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ── Feedback tile ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-10">
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
                <p className="mt-0.5 text-body text-fg-muted">We read every message — tell us what would make gradeVITian better.</p>
                <p className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-accent">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden className="shrink-0"><path d="M12 2l2.2 6.6L21 11l-6.8 2.4L12 20l-2.2-6.6L3 11l6.8-2.4z" /></svg>
                  Share yours — you could be featured in our testimonials soon!
                </p>
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-border bg-surface/60 px-4 py-2 text-sm font-semibold text-fg transition-colors group-hover:border-accent/40 group-hover:text-accent sm:self-auto">
              Share feedback
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="transition-transform group-hover:translate-x-0.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </span>
          </GVLink>
        </ScrollReveal>
      </section>

      {/* ── Refer a fellow #VITian ────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <ScrollReveal>
          <GVRefer />
        </ScrollReveal>
      </section>

      {/* ── From the community (LinkedIn) ─────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 pb-24">
        <ScrollReveal>
          <h2 className="text-center text-2xl font-bold tracking-tight text-fg">From the community</h2>
          <p className="mt-1 text-center text-fg-muted">The journey, shared on LinkedIn.</p>
          <div className="gv-scroll-x mt-8 flex snap-x snap-mandatory items-start gap-4 overflow-x-auto px-1 pb-2 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0">
            <div className="min-w-[85%] shrink-0 snap-center md:min-w-0 md:shrink">
              <GVLinkedInEmbed activityId="7346981400148926465" title="gradeVITian relaunch on LinkedIn" />
            </div>
            <div className="min-w-[85%] shrink-0 snap-center md:min-w-0 md:shrink">
              <GVLinkedInEmbed activityId="6809389656187265024" title="gradeVITian on LinkedIn" />
            </div>
          </div>
          <p className="mt-3 text-center text-micro text-fg-subtle md:hidden">Swipe to see more →</p>
        </ScrollReveal>
      </section>
    </>
  );
}

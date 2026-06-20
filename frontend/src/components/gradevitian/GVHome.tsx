"use client";

import Image from "next/image";
import GVLink from "@/components/gradevitian/GVLink";
import ScrollReveal from "@/components/ScrollReveal";
import StackSection from "@/components/StackSection";
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
import GVWallOfLove from "@/components/gradevitian/GVWallOfLove";
import { useGVAuth } from "@/components/gradevitian/GVAuthProvider";

// Editorial display face — the same Cormorant Garamond the hero rises in, reused
// across every chapter headline to give the page one calm, premium voice.
const SERIF = "var(--font-cormorant), Georgia, serif";

// Portfolio-style identity line: three "·"-separated facets, rendered thin (the
// same font-light treatment as the portfolio home hero).
const TAGLINE = "By a VITian, for VITians · 20K+ students, #2 on Google · GPA, CGPA & attendance, always free";

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

/* ── Editorial helpers ──────────────────────────────────────────────────────── */

// Shared width container for stacked acts (mirrors the portfolio's <Inner>).
function Inner({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-5 sm:px-6 ${className}`}>{children}</div>
  );
}

// A small "chapter" marker — number + label between two hairlines — that gives the
// page a slow, deliberate, story-told-in-acts rhythm.
function Chapter({ index, label }: { index: string; label: string }) {
  return (
    <div className="flex items-center justify-center gap-3.5">
      <span className="h-px w-8 bg-border-subtle" aria-hidden />
      <span className="text-nano font-semibold uppercase tracking-[0.3em] text-fg-subtle">
        <span className="text-accent">{index}</span>
        <span className="mx-2 text-border-strong">/</span>
        {label}
      </span>
      <span className="h-px w-8 bg-border-subtle" aria-hidden />
    </div>
  );
}

// Cormorant serif headline used for every act.
function Headline({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h2
      style={{ fontFamily: SERIF, fontWeight: 600, lineHeight: 1.04, letterSpacing: "0.005em" }}
      className={`text-[clamp(2rem,4.6vw,3.4rem)] text-fg ${className}`}
    >
      {children}
    </h2>
  );
}

// Thin lead paragraph — the portfolio's font-light editorial body voice.
function Lead({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-lg font-light leading-relaxed text-fg-muted text-balance sm:text-xl ${className}`}>
      {children}
    </p>
  );
}

function PlatformStrip() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-2.5">
      {PLATFORMS.map((p) => (
        <span
          key={p.label}
          className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface/60 px-4 py-2 text-micro font-medium text-fg-muted backdrop-blur"
        >
          <span className="h-3.5 w-3.5 text-accent [&>svg]:h-full [&>svg]:w-full">{p.icon}</span>
          {p.label}
        </span>
      ))}
    </div>
  );
}

export default function GVHome() {
  const { user } = useGVAuth();
  const firstName = user?.name.split(" ")[0] ?? "";

  return (
    <>
      {/* ══ Act I — The hero (normal flow; stacking starts after) ═══════════════ */}
      <section className="relative overflow-hidden">
        <Parallax speed={0.18} className="pointer-events-none absolute inset-0">
          <HeroDotGrid />
        </Parallax>
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[-8rem] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
          style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--accent) 18%, transparent), transparent 70%)" }}
        />

        <div className="relative mx-auto max-w-3xl px-5 pt-28 pb-24 text-center sm:pt-40 sm:pb-32">
          <ScrollReveal>
            {user ? (
              <p className="text-nano font-semibold uppercase tracking-[0.28em] text-accent sm:text-micro">
                Welcome back
              </p>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent-light px-4 py-1.5 text-nano font-semibold uppercase tracking-[0.2em] text-accent sm:text-micro">
                <span className="relative flex h-1.5 w-1.5" aria-hidden>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                </span>
                Free forever · No sign-up · Works offline
              </span>
            )}

            <GVHeroTitle
              text={user ? `Hi, ${firstName}.` : "gradeVITian"}
              accent={user ? undefined : "VIT"}
              className="mt-8 text-fg"
            />

            {/* Tagline — portfolio-style identity line, thin font */}
            <Lead className="mx-auto mt-7 max-w-2xl">
              {user
                ? "Your calculators and saved results are right where you left them — pick a tool and keep going."
                : TAGLINE}
            </Lead>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              {user ? (
                <>
                  <GVLink href="/account" className="rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-accent-fg shadow-sm shadow-accent/25 transition-all duration-200 hover:bg-accent-hover hover:shadow-md active:scale-[0.97]">
                    Open your dashboard
                  </GVLink>
                  <GVLink href="/cgpa" className="rounded-full border border-border bg-surface/60 px-7 py-3.5 text-sm font-semibold text-fg backdrop-blur transition-all duration-200 hover:bg-surface-raised active:scale-[0.97]">
                    Jump back in
                  </GVLink>
                </>
              ) : (
                <>
                  <GVInstall variant="hero" prominent />
                  <GVLink href="/cgpa" className="rounded-full border border-border bg-surface/60 px-7 py-3.5 text-sm font-semibold text-fg backdrop-blur transition-all duration-200 hover:bg-surface-raised active:scale-[0.97]">
                    Start calculating
                  </GVLink>
                </>
              )}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={120} className="mt-16">
            <p className="mb-4 text-micro font-medium uppercase tracking-[0.18em] text-fg-subtle">
              Jump straight to a tool
            </p>
            <div className="mx-auto max-w-lg">
              <GVSearch />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Personal notes & goals (logged-in only, normal flow) ──────────── */}
      {user && (
        <section className="mx-auto max-w-6xl px-5 pt-2 pb-10">
          <ScrollReveal>
            <GVNotes />
          </ScrollReveal>
        </section>
      )}

      {/* ══ Act II — The toolkit (first stacked card; seamless blend from hero) ══ */}
      <StackSection z={2} seamless id="toolkit">
        <Inner className="py-20 sm:py-28">
          <ScrollReveal className="text-center">
            <Chapter index="01" label="The toolkit" />
            <Headline className="mt-6">{user ? "Your tools" : "Six tiny tools, one calm home."}</Headline>
            <Lead className="mx-auto mt-5 max-w-xl">
              {user
                ? "Saved results sync to your account automatically — pick up wherever you left off."
                : "Each one quietly handles the math every VITian dreads, so you can get back to actually living."}
            </Lead>
          </ScrollReveal>

          <div className="mx-auto mt-14 grid max-w-5xl gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {TOOLS.map((t, i) => (
              <ScrollReveal key={t.title} delay={i * 70}>
                <GVLink
                  href={t.href}
                  className="group flex h-full items-start gap-5 rounded-3xl border border-border-subtle bg-surface/70 p-7 shadow-[0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-accent/40 hover:shadow-[0_22px_60px_-18px_rgba(79,70,229,0.42)] sm:p-8"
                >
                  <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-accent/15 to-[color:var(--accent-secondary)]/10 ring-1 ring-inset ring-accent/15 transition-transform duration-300 group-hover:scale-105">
                    <Image src={t.img} alt="" width={34} height={34} className="h-[34px] w-[34px]" />
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[1.05rem] font-semibold text-fg transition-colors group-hover:text-accent">{t.title}</h3>
                      <span className="text-fg-subtle opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden>→</span>
                    </div>
                    <p className="mt-1.5 text-body font-light leading-relaxed text-fg-muted">{t.desc}</p>
                  </div>
                </GVLink>
              </ScrollReveal>
            ))}
          </div>
        </Inner>
      </StackSection>

      {/* ══ Act III — The story so far (impact) ═════════════════════════════════ */}
      <StackSection z={3} id="story">
        <Inner className="py-20 text-center sm:py-28">
          <ScrollReveal>
            <Chapter index="02" label="The story so far" />
            <Headline className="mx-auto mt-6 max-w-3xl">
              Started by one VITian.
              <br className="hidden sm:block" />{" "}
              Made theirs by <span className="text-accent">twenty thousand</span> more.
            </Headline>
            <Lead className="mx-auto mt-6 max-w-2xl">
              It began as one student&apos;s shortcut through exam-season math. Six years later it&apos;s
              a quiet campus ritual — around 17,000 students every month, #2 on Google, and sub-second
              loads on the cheapest phone in the room.
            </Lead>
          </ScrollReveal>

          <ScrollReveal delay={140} className="mx-auto mt-14 max-w-5xl">
            <GVStats stats={METRICS} />
            <div className="mt-6">
              <GVVisits />
            </div>
          </ScrollReveal>
        </Inner>
      </StackSection>

      {/* ══ Act IV — On every device ════════════════════════════════════════════ */}
      <StackSection z={4} id="devices">
        <Inner className="py-20 text-center sm:py-28">
          <ScrollReveal className="mx-auto max-w-2xl">
            <Chapter index="03" label="Anywhere you study" />
            <Headline className="mt-6">Yours on every device.</Headline>
            <Lead className="mx-auto mt-5 max-w-md">
              Install it once and it lives on your phone, laptop, or browser like a native app —
              and it still works when the campus Wi-Fi doesn&apos;t.
            </Lead>
            <div className="mt-10">
              <PlatformStrip />
            </div>
          </ScrollReveal>
        </Inner>
      </StackSection>

      {/* ══ Act V — Make it yours (account + feedback + refer) ══════════════════ */}
      <StackSection z={5} id="make-it-yours">
        <Inner className="space-y-6 py-20 sm:py-28">
          {/* Account band */}
          <ScrollReveal>
            <div className="overflow-hidden rounded-[2rem] border border-border-subtle bg-gradient-to-br from-accent/[0.09] to-transparent p-9 sm:p-12">
              <div className="flex flex-wrap items-center justify-between gap-6">
                {user ? (
                  <>
                    <div className="flex items-center gap-5">
                      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-accent text-xl font-bold text-accent-fg shadow-sm shadow-accent/30">
                        {firstName.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <h2 style={{ fontFamily: SERIF, fontWeight: 600 }} className="text-2xl text-fg sm:text-[1.7rem]">This is your space, {firstName}.</h2>
                        <p className="mt-1.5 font-light text-fg-muted">Saved calculations, notifications and more — all in one place.</p>
                      </div>
                    </div>
                    <GVLink href="/account" className="rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-accent-fg shadow-sm shadow-accent/25 transition-all duration-200 hover:bg-accent-hover active:scale-[0.97]">
                      Go to dashboard
                    </GVLink>
                  </>
                ) : (
                  <>
                    <div className="max-w-md">
                      <h2 style={{ fontFamily: SERIF, fontWeight: 600 }} className="text-2xl text-fg sm:text-[1.8rem]">Make gradeVITian yours.</h2>
                      <p className="mt-2 font-light text-fg-muted">Create a free account to save your calculations, set goals, and pick up right where you left off — on any device.</p>
                    </div>
                    <GVLink href="/signup" className="rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-accent-fg shadow-sm shadow-accent/25 transition-all duration-200 hover:bg-accent-hover active:scale-[0.97]">
                      Create free account
                    </GVLink>
                  </>
                )}
              </div>
            </div>
          </ScrollReveal>

          {/* Feedback tile */}
          <ScrollReveal>
            <GVLink
              href="/feedback"
              className="group flex flex-col items-start gap-4 rounded-[2rem] border border-border-subtle bg-surface/70 p-7 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_16px_48px_-14px_rgba(79,70,229,0.32)] sm:flex-row sm:items-center sm:justify-between sm:p-9"
            >
              <div className="flex items-center gap-5">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-accent/15 to-[color:var(--accent-secondary)]/10 text-accent ring-1 ring-inset ring-accent/15">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-[1.05rem] font-semibold text-fg">Got a suggestion or found a bug?</h2>
                  <p className="mt-1 text-body font-light text-fg-muted">We read every message — tell us what would make gradeVITian better.</p>
                  <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-accent">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden className="shrink-0"><path d="M12 2l2.2 6.6L21 11l-6.8 2.4L12 20l-2.2-6.6L3 11l6.8-2.4z" /></svg>
                    Share yours — you could be featured in our testimonials soon!
                  </p>
                </div>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-border bg-surface/60 px-5 py-2.5 text-sm font-semibold text-fg transition-colors group-hover:border-accent/40 group-hover:text-accent sm:self-auto">
                Share feedback
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="transition-transform group-hover:translate-x-0.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
            </GVLink>
          </ScrollReveal>

          {/* Refer a fellow #VITian */}
          <ScrollReveal>
            <GVRefer />
          </ScrollReveal>
        </Inner>
      </StackSection>

      {/* ══ Act VI — From the community ═════════════════════════════════════════ */}
      <StackSection z={6} id="community">
        <Inner className="py-20 sm:py-28">
          <ScrollReveal className="text-center">
            <Chapter index="04" label="In their words" />
            <Headline className="mt-6">From the community.</Headline>
            <Lead className="mx-auto mt-4">The journey, shared on LinkedIn.</Lead>
          </ScrollReveal>
          <ScrollReveal delay={100} className="mx-auto max-w-5xl">
            <div className="gv-scroll-x mt-12 flex snap-x snap-mandatory items-start gap-4 overflow-x-auto px-1 pb-2 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0">
              <div className="min-w-[85%] shrink-0 snap-center md:min-w-0 md:shrink">
                <GVLinkedInEmbed activityId="7346981400148926465" title="gradeVITian relaunch on LinkedIn" />
              </div>
              <div className="min-w-[85%] shrink-0 snap-center md:min-w-0 md:shrink">
                <GVLinkedInEmbed activityId="6809389656187265024" title="gradeVITian on LinkedIn" />
              </div>
            </div>
            <p className="mt-4 text-center text-micro text-fg-subtle md:hidden">Swipe to see more →</p>
          </ScrollReveal>
        </Inner>
      </StackSection>

      {/* ── Wall of love — scrolling student feedback (closing, normal flow) ── */}
      <GVWallOfLove />
    </>
  );
}

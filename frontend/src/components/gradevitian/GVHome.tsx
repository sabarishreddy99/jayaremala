"use client";

import { useState } from "react";
import GVLink from "@/components/gradevitian/GVLink";
import { GV_GROUPS } from "@/lib/gradevitian/nav";
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

// Warm, personal identity line — calm and a little inviting, rendered thin (the
// same font-light treatment as the portfolio home hero). Kept stat-free on purpose
// so the hero feels like a quiet home, not a pitch (the numbers live in Act 02).
const TAGLINE = "A calm little home for your GPA, CGPA and attendance — free forever, works offline, and quietly becomes yours.";

const METRICS: GVStat[] = [
  { value: "17K+", label: "Monthly Active Users", sub: "Peak student traffic" },
  { value: "20K+", label: "Registered Accounts", sub: "VITians onboarded" },
  { value: "#2", label: "Google Search Rank", sub: "Programmatic SEO" },
  { value: "<1s", label: "Mobile Load Time", sub: "Sub-second, PWA-optimized" },
  { value: "6+", label: "Years in Production", sub: "Continuously live & maintained" },
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

// Quiet "tell a friend" affordance — uses the native share sheet on mobile and a
// copy-link fallback elsewhere. Low-key by design so the hero stays calm.
function HeroShare() {
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = "https://gradevitian.jayaremala.com";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "gradeVITian", text: "A calm little home for your GPA, CGPA & attendance.", url });
      } catch { /* user dismissed the share sheet */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard unavailable */ }
  }
  return (
    <button onClick={share} className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-fg-subtle transition-colors hover:text-accent">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
      </svg>
      {copied ? "Link copied — pass it on" : "Share it with a friend"}
    </button>
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
        {/* Faint accent halo — kept very light so the page reads as the same clean
            white (--bg #fefefb) as the portfolio, with only the gentlest warmth. */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[-10rem] h-[30rem] w-[30rem] -translate-x-1/2 rounded-full opacity-35 blur-3xl"
          style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--accent) 10%, transparent), transparent 70%)" }}
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
                Made by a VITian, for you
              </span>
            )}

            <GVHeroTitle
              text={user ? `Hi, ${firstName}.` : "Your grades, kept calm."}
              accent={user ? undefined : "calm"}
              className="mt-8 text-fg"
              style={user ? undefined : { fontSize: "clamp(2.5rem, 7vw, 5rem)" }}
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

            <HeroShare />
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
            <Headline className="mt-6">{user ? "Your tools" : "Everything you need, in one place."}</Headline>
            <Lead className="mx-auto mt-5 max-w-xl">
              {user
                ? "Saved results sync to your account — pick up wherever you left off."
                : "Calculators for exam season, planners for the long game, and the rulebook for when you're not sure — all free."}
            </Lead>
          </ScrollReveal>

          <div className="mx-auto mt-14 max-w-5xl space-y-12">
            {GV_GROUPS.map((g, gi) => (
              <ScrollReveal key={g.label} delay={gi * 60}>
                <div className="mb-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 style={{ fontFamily: SERIF, fontWeight: 600 }} className="text-xl text-fg sm:text-2xl">{g.label}</h3>
                  <span className="text-sm font-light text-fg-muted">{g.blurb}</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
                  {g.items.map((it) => (
                    <GVLink
                      key={it.href}
                      href={it.href}
                      className="group flex h-full items-start gap-4 rounded-2xl border border-border-subtle bg-surface/70 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-[0_18px_50px_-16px_rgba(79,70,229,0.4)]"
                    >
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-accent/15 to-[color:var(--accent-secondary)]/10 text-accent ring-1 ring-inset ring-accent/15 transition-transform duration-300 group-hover:scale-105">
                        {it.icon}
                      </span>
                      <span className="min-w-0 pt-0.5">
                        <span className="flex items-center gap-2">
                          <span className="text-[0.97rem] font-semibold text-fg transition-colors group-hover:text-accent">{it.label}</span>
                          {it.isNew && <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-accent">New</span>}
                        </span>
                        <span className="mt-1 block text-sm font-light leading-relaxed text-fg-muted">{it.desc}</span>
                      </span>
                    </GVLink>
                  ))}
                </div>
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
          {/* Curiosity hook — reasons to make a free account (logged-out only) */}
          {!user && (
            <ScrollReveal className="text-center">
              <Chapter index="04" label="A reason to stay" />
              <Headline className="mx-auto mt-6 max-w-2xl">More than a calculator once you sign in.</Headline>
              <Lead className="mx-auto mt-5 max-w-xl">
                A free account turns gradeVITian into your own academic command centre — and it&apos;s the
                same login on every device.
              </Lead>
              <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { title: "Save your semester", desc: "Enter courses once, reuse everywhere.", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 9v12" /></svg> },
                  { title: "Chase a CGPA goal", desc: "See exactly what each sem needs.", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.4H22l-6 4.4 2.3 7.2L12 16.6 5.7 21l2.3-7.2-6-4.4h7.6z" /></svg> },
                  { title: "Earn badges", desc: "Unlock milestones as you go.", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="15" r="6" /><path d="M9 9.5 7 2h10l-2 7.5" /></svg> },
                  { title: "Keep a streak", desc: "Little wins, every day.", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2c1.6 3 4 4.5 4 8a4 4 0 0 1-8 0c0-1.6.6-2.6 1.6-3.6C10.6 7.4 11 4.4 12 2z" /></svg> },
                ].map((b) => (
                  <div key={b.title} className="rounded-2xl border border-border-subtle bg-surface/60 p-4 text-center backdrop-blur">
                    <div className="text-accent [&>svg]:mx-auto [&>svg]:h-7 [&>svg]:w-7">{b.icon}</div>
                    <p className="mt-2 text-sm font-semibold text-fg">{b.title}</p>
                    <p className="mt-1 text-[11px] font-light leading-snug text-fg-muted">{b.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-9">
                <GVLink href="/signup" className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-accent-fg shadow-sm shadow-accent/25 transition-all duration-200 hover:bg-accent-hover hover:shadow-md active:scale-[0.97]">
                  Create your free account
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </GVLink>
              </div>
            </ScrollReveal>
          )}

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
            <Chapter index="05" label="In their words" />
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

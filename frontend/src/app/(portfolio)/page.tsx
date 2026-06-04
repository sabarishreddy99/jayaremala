import Link from "next/link";
import { profile } from "@/data/profile";
import { projects } from "@/data/projects";
import { skills } from "@/data/skills";
import { quotes } from "@/data/quotes";
import { getAllPosts } from "@/lib/blog";
import TestimonialsCarousel from "@/components/TestimonialsCarousel";
import ContactForm from "@/components/ContactForm";
import ScrollReveal from "@/components/ScrollReveal";
import HeroName from "@/components/HeroName";
import HeroStats from "@/components/HeroStats";
import ShareSiteChip from "@/components/ShareSiteChip";
import RagPipelineCard from "@/components/RagPipelineCard";
import StackSection from "@/components/StackSection";
import SkillsSection from "@/components/SkillsSection";
import SkillsConstellation from "@/components/SkillsConstellation";
import MobileNoBg from "@/components/MobileNoBg";
import SiteVitals from "@/components/SiteVitals";
import { experience } from "@/data/experience";

export const metadata = {
  title: "Jaya Sabarish Reddy Remala — Software Engineer",
  description:
    "Software Engineer specializing in Agentic AI, distributed systems, and production ML infrastructure. Qualcomm Edge AI Hackathon Winner. NYU Tandon CS. Previously at Shell, Wipro, NYU IT.",
  alternates: { canonical: "https://jayaremala.com/" },
  openGraph: {
    type: "website",
    url: "https://jayaremala.com/",
    title: "Jaya Sabarish Reddy Remala — Software Engineer",
    description:
      "Software Engineer specializing in Agentic AI, distributed systems, and production ML infrastructure. Qualcomm Edge AI Hackathon Winner. NYU Tandon CS.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Jaya Sabarish Reddy Remala",
  alternateName: "Jaya Remala",
  url: "https://jayaremala.com",
  jobTitle: "Software Engineer",
  description:
    "Software Engineer specializing in Agentic AI, distributed systems, and production ML infrastructure. Qualcomm Edge AI Hackathon Winner. NYU Tandon CS.",
  email: "jr6421@nyu.edu",
  sameAs: [
    "https://linkedin.com/in/jayasabarishreddyr",
    "https://github.com/sabarishreddy99",
    "https://jayaremala.com",
  ],
  alumniOf: {
    "@type": "EducationalOrganization",
    name: "New York University Tandon School of Engineering",
    url: "https://engineering.nyu.edu",
  },
  worksFor: {
    "@type": "Organization",
    name: "New York University",
  },
  knowsAbout: [
    "Agentic AI", "Distributed Systems", "Machine Learning", "RAG",
    "FastAPI", "LangGraph", "Edge AI", "LLM Inference", "Python",
  ],
  award: "Qualcomm Edge AI Hackathon Winner",
  address: { "@type": "PostalAddress", addressLocality: "New York", addressRegion: "NY", addressCountry: "US" },
};

/** Shared inner-content constraint */
function Inner({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`mx-auto w-full max-w-6xl xl:max-w-7xl 2xl:max-w-[90rem] px-4 sm:px-6 xl:px-8 ${className}`}>
      {children}
    </div>
  );
}

/** Wrap standalone numbers (optionally with unit suffix) in mono-bold spans */
function HighlightNumbers({ text }: { text: string }) {
  const parts = text.split(/(\d+(?:\.\d+)?(?:%|ms|GB|TB|MB|K\+?|M\+?|x|\+)?)/g);
  return (
    <>
      {parts.map((part, i) =>
        /^\d/.test(part) ? (
          <span key={i} className="font-mono font-bold text-fg">{part}</span>
        ) : (
          part
        )
      )}
    </>
  );
}


/** Find the most relevant experience entry for a company chip name */
function findExp(chipName: string) {
  const n = chipName.toLowerCase().trim();
  return experience.find(
    (e) => e.company.toLowerCase().includes(n.split(" ")[0]) || n.includes(e.company.toLowerCase().split(" ")[0])
  );
}

export default function PortfolioHome() {
  const featured = projects.filter((p) => p.featured);
  const latestPost = getAllPosts()[0] ?? null;
  const latestQuote = quotes.find((q) => q.featured) ?? [...quotes].sort((a, b) => b.addedAt.localeCompare(a.addedAt))[0] ?? null;

  return (
    <div className="w-full">
      <MobileNoBg />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── 1 · Hero — not sticky, scrolls away naturally ──────── */}
      <section id="hero" className="relative overflow-x-clip scroll-mt-[50px] hero-section-bg">

        {/* ── Hero background — bg-surface base + visible dot grid ── */}
        <div aria-hidden className="pointer-events-none absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-accent/[0.05] via-transparent to-transparent" />
        <div aria-hidden className="hero-dot-pattern pointer-events-none absolute inset-0 opacity-50" />

        {/* ── Focal hero — single centered column ── */}
        <Inner className="flex flex-col items-center text-center pt-16 sm:pt-24 lg:pt-28 pb-10 gap-5 max-w-3xl">

          {/* Status badge */}
          {(() => {
            const avail = profile.availability;
            const isOpen = avail?.open ?? true;
            const label = avail?.label ?? "Open to opportunities";
            const parts = avail
              ? [...(avail.types ?? []), ...(avail.locations ?? [])]
              : [profile.location];
            const chipText = parts.length > 0 ? `${label} · ${parts.join(" · ")}` : label;
            return (
              <div
                className="animate-fade-up flex items-center gap-2"
                style={{ animationDelay: "0ms" }}
              >
                <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${isOpen ? "bg-green-500 animate-pulse" : "bg-zinc-400 dark:bg-zinc-500"}`} />
                <span className="text-[11px] font-medium tracking-wide text-fg-faint/80">
                  {chipText}
                </span>
              </div>
            );
          })()}

          {/* Name — the single anchor */}
          <HeroName name={profile.name} />

          {/* Tagline — one balanced line, constrained for readability */}
          <p
            className="animate-fade-up text-base sm:text-xl font-medium text-fg-muted leading-relaxed max-w-xl text-balance"
            style={{ animationDelay: "140ms" }}
          >
            {profile.tagline}
          </p>

          {/* CTAs — one primary, one secondary, one tertiary */}
          <div
            className="animate-fade-up flex flex-row flex-wrap items-center justify-center gap-2.5 sm:gap-3 mt-1"
            style={{ animationDelay: "240ms" }}
          >
            <Link
              href="/chat"
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-200"
            >
              Ask Avocado
              <span className="opacity-80">✦</span>
            </Link>
            <Link
              href="/projects"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border-2 border-border px-6 py-3 text-sm font-semibold text-fg-muted hover:border-fg hover:text-fg transition-colors duration-200"
            >
              View Projects
            </Link>
            <a
              href={profile.booking_url ?? "https://calendar.app.google/3sScGpHpeSpvPjpSA"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-3 text-sm font-medium text-fg-faint hover:text-fg transition-colors duration-200"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
              </svg>
              Book a call
            </a>
          </div>

          {/* Minimal social row */}
          <div className="animate-fade-up flex items-center justify-center gap-4 mt-0.5" style={{ animationDelay: "300ms" }}>
            <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"
              className="text-fg-faint hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
            </a>
            <a href={profile.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub"
              className="text-fg-faint hover:text-fg transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
            </a>
            {profile.resume && (
              <a href={profile.resume} target="_blank" rel="noopener noreferrer"
                className="text-[11px] font-medium text-fg-faint hover:text-fg border border-border/60 rounded-full px-3 py-1 hover:border-fg-muted transition-all">
                Resume ↗
              </a>
            )}
          </div>
        </Inner>

        {/* ── Second beat — proof stats (discovered just below the focal hero) ── */}
        <Inner className="pb-10 max-w-3xl">
          {/* Desktop: 4-col animated stat cards */}
          <div className="animate-fade-up hidden sm:block" style={{ animationDelay: "360ms" }}>
            <HeroStats stats={profile.heroStats} />
          </div>
          {/* Mobile: compact 2-col animated (same count-up as desktop) */}
          {profile.heroStats && profile.heroStats.length >= 2 && (
            <div className="animate-fade-up sm:hidden" style={{ animationDelay: "360ms" }}>
              <HeroStats stats={profile.heroStats.slice(0, 2)} cols={2} />
            </div>
          )}

          {/* Latest post — single subtle teaser, centered */}
          {latestPost && (
            <div className="flex justify-center mt-6">
              <Link href={`/blog/${latestPost.slug}`} className="group inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface/60 px-3.5 py-1.5 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all">
                <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-fg-faint shrink-0">Latest</span>
                <span className="w-px h-3 bg-border shrink-0" />
                <span className="text-[11px] text-fg-subtle group-hover:text-accent transition-colors line-clamp-1 max-w-[60vw] sm:max-w-xs">
                  {latestPost.title}
                </span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-fg-faint group-hover:text-accent shrink-0 transition-colors">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            </div>
          )}
        </Inner>

        {/* Section preview strip + scroll hint */}
        <Inner className="pb-3 sm:pb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Section chips — visual scent of what's below */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-fg-faint mr-1">Explore</span>
            {[
              { href: "#about",        label: "At a Glance" },
              { href: "#projects",     label: "Projects" },
              { href: "#skills",       label: "Skills" },
              { href: "#testimonials", label: "Testimonials" },
              { href: "#contact",      label: "Contact" },
            ].map((s) => (
              <a
                key={s.href}
                href={s.href}
                className="rounded-md border border-border bg-surface/60 px-2.5 py-0.5 text-[11px] font-medium text-fg-faint hover:text-fg hover:border-fg-muted transition-colors"
              >
                {s.label}
              </a>
            ))}
            {/* Divider + share */}
            <span className="w-px h-3 bg-border mx-0.5 hidden sm:inline-block" aria-hidden />
            <ShareSiteChip />
          </div>
          {/* Scroll hint — bouncing chevron */}
          <div className="flex flex-col items-center gap-1 opacity-40 animate-bounce" aria-hidden>
            <span className="text-[10px] font-medium text-fg-faint tracking-wide">scroll</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-fg-faint">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </div>
        </Inner>

        {/* Site vitals — unique visitors + Avocado questions answered */}
        <Inner className="pb-6 sm:pb-8">
          <SiteVitals />
        </Inner>
      </section>


      {/* ── 2 · At a Glance ── z-[2] ───────────────────────────── */}
      <StackSection z={2} seamless id="about">
<Inner className="py-16 sm:py-20 relative">
          {/* Ghost number */}
          <span aria-hidden className="pointer-events-none absolute -top-4 right-0 select-none font-black text-fg/[0.03] dark:text-fg/[0.04] leading-none"
            style={{ fontSize: "clamp(7rem,18vw,14rem)" }}>01</span>
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-0.5 h-4 bg-gradient-to-b from-indigo-500 to-violet-500 shrink-0" />
            <h2 className="text-xs font-bold uppercase tracking-widest label-gradient">At a Glance</h2>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_260px] xl:grid-cols-[1fr_300px] 2xl:grid-cols-[1fr_340px]">
            <div className="space-y-6">
              <ScrollReveal>
              <p className="text-base sm:text-lg leading-8 text-fg max-w-2xl">
                <HighlightNumbers text={profile.bio} />
              </p>
              </ScrollReveal>

              <ScrollReveal delay={80}>
              <div className="hanging-quote flex items-start gap-3 rounded-xl border border-border bg-surface-sunken px-4 py-3.5 max-w-2xl">
                <span className="mt-0.5 text-fg-faint shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9.983 3v7.391c0 5.704-3.731 9.57-8.983 10.609l-.995-2.151c2.432-.917 3.995-3.638 3.995-5.849h-4v-10h9.983zm14.017 0v7.391c0 5.704-3.748 9.571-9 10.609l-.996-2.151c2.433-.917 3.996-3.638 3.996-5.849h-3.983v-10h9.983z" />
                  </svg>
                </span>
                <p className="text-sm sm:text-base leading-7 text-fg-muted italic">{profile.obsession}</p>
              </div>
              </ScrollReveal>

            </div>

            <div className="hidden sm:flex flex-col gap-6 lg:pt-1">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-fg-faint mb-3">Previously</p>
                <div className="flex flex-wrap gap-2">
                  {profile.prev_domain.split(",").map((d) => (
                    <span key={d} className="rounded-md border border-border bg-surface-raised px-3 py-1 text-xs font-medium text-fg-subtle">
                      {d.trim()}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-fg-faint mb-3">Excited in</p>
                <div className="flex flex-wrap gap-2">
                  {profile.interested_domain.split(",").map((d) => (
                    <span key={d} className="rounded-md border border-border bg-surface-raised px-3 py-1 text-xs font-medium text-fg-subtle">
                      {d.trim()}
                    </span>
                  ))}
                  <span className="rounded-md border border-border bg-surface-raised px-3 py-1 text-xs font-medium text-fg-faint italic">& more</span>
                </div>
              </div>

              {/* Company mini-timeline with hover tooltips */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-fg-faint mb-3">Career path</p>
                <div className="flex flex-col">
                  {profile.previous.split(",").map((co, i, arr) => {
                    const exp = findExp(co.trim());
                    return (
                      <div key={co} className="flex items-start gap-2.5">
                        <div className="flex flex-col items-center">
                          <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${i === 0 ? "bg-accent" : "bg-border-strong"}`} />
                          {i < arr.length - 1 && (
                            <div className="w-px h-6 bg-gradient-to-b from-border-strong/60 to-transparent mt-0.5" />
                          )}
                        </div>
                        <div className="relative group/co pb-4">
                          <span className={`text-xs cursor-default ${i === 0 ? "text-fg font-medium" : "text-fg-subtle"}`}>
                            {co.trim()}
                          </span>
                          {exp && (
                            <div className="absolute left-0 top-full mt-1 z-10 hidden group-hover/co:block bg-surface border border-border rounded-xl px-3 py-2 shadow-md whitespace-nowrap pointer-events-none">
                              <p className="text-[11px] font-semibold text-fg">{exp.role}</p>
                              <p className="text-[10px] text-fg-faint font-mono tabular-nums">{exp.start} – {exp.end}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-10 pt-5 border-t border-border flex items-center justify-between">
            <span className="text-[10px] text-fg-faint uppercase tracking-widest">1 / 5</span>
            <a href="#projects" className="inline-flex items-center gap-1.5 text-[11px] text-fg-faint hover:text-fg transition-colors">
              See what I&apos;ve built
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
            </a>
          </div>
        </Inner>
      </StackSection>

      {/* ── 3 · Featured Projects ── z-[3] ─────────────────────── */}
      {featured.length > 0 && (
        <StackSection z={3} id="projects">
          <Inner className="py-16 sm:py-20 relative">
            {/* Ghost number */}
            <span aria-hidden className="pointer-events-none absolute -top-4 right-0 select-none font-black text-fg/[0.03] dark:text-fg/[0.04] leading-none"
              style={{ fontSize: "clamp(7rem,18vw,14rem)" }}>02</span>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-0.5 h-4 bg-gradient-to-b from-blue-500 to-cyan-500 shrink-0" />
                <h2 className="text-xs font-bold uppercase tracking-widest label-gradient">Featured Projects</h2>
              </div>
              <Link href="/projects" className="text-xs font-medium text-accent hover:text-accent-hover">
                All projects →
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {featured.map((p, i) => (
                <ScrollReveal key={p.title} delay={i * 80} className="flex" direction="scale">
                  {p.title.startsWith("jayaremala") ? (
                    <RagPipelineCard
                      title={p.title}
                      description={p.description}
                      tags={p.tags}
                      award={p.award}
                      note={p.note}
                      sourceLinks={p.sourceLinks}
                    />
                  ) : (
                    <div className="group relative flex-1 rounded-xl rounded-br-none border border-border bg-surface p-5 space-y-3 hover:border-border-strong card-lift overflow-hidden">
                      <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${p.award ? "from-amber-500 to-orange-500" : "from-blue-500 to-cyan-500"} origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300`} />
                      {/* Corner bracket accents — ridealso-style geometric marks */}
                      <svg className="absolute top-2.5 left-2.5 text-border/50 group-hover:text-accent/40 transition-colors duration-200 pointer-events-none" width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                        <path d="M9 1 L1 1 L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <svg className="absolute bottom-2.5 right-2.5 text-border/50 group-hover:text-accent/40 transition-colors duration-200 pointer-events-none" width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                        <path d="M1 9 L9 9 L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-fg text-sm leading-snug group-hover:text-accent transition-colors">{p.title}</h3>
                        {p.award && (
                          <span className="text-[10px] font-semibold rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-2 py-0.5 whitespace-nowrap flex-shrink-0">
                            🏆 {p.award}
                          </span>
                        )}
                      </div>
                      <p className="text-xs leading-5 text-fg-subtle">{p.description}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {p.tags.slice(0, 4).map((t) => (
                          <span key={t} className="rounded-full bg-surface-raised px-2 py-0.5 text-[10px] font-medium text-fg-muted">
                            {t}
                          </span>
                        ))}
                      </div>
                      {p.note && (
                        <p className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-900 rounded-xl px-2.5 py-1.5 leading-relaxed">
                          {p.note}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {p.sourceLinks && p.sourceLinks.length > 0
                          ? p.sourceLinks.map((link) => (
                              <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-full bg-accent-light border border-indigo-200 dark:border-indigo-800 px-2.5 py-0.5 text-[10px] font-semibold text-accent hover:opacity-80 transition-opacity">
                                {link.label}
                                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                              </a>
                            ))
                          : null}
                      </div>
                    </div>
                  )}
                </ScrollReveal>
              ))}
            </div>
          <div className="mt-10 pt-5 border-t border-border flex items-center justify-between">
            <span className="text-[10px] text-fg-faint uppercase tracking-widest">2 / 5</span>
            <a href="#skills" className="inline-flex items-center gap-1.5 text-[11px] text-fg-faint hover:text-fg transition-colors">
              Technologies I work with
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
            </a>
          </div>
          </Inner>
        </StackSection>
      )}

      {/* ── 4 · Skills ── z-[4] ────────────────────────────────── */}
      <StackSection z={4} id="skills">
        <Inner className="py-16 sm:py-20 relative">
          {/* Ghost number */}
          <span aria-hidden className="pointer-events-none absolute -top-4 right-0 select-none font-black text-fg/[0.03] dark:text-fg/[0.04] leading-none"
            style={{ fontSize: "clamp(7rem,18vw,14rem)" }}>03</span>
          <SkillsSection skills={skills} featuredProjects={featured} />

          {/* Interactive skills ↔ projects constellation — desktop only */}
          <div className="hidden lg:block mt-12 pt-10 border-t border-border">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-0.5 h-4 bg-gradient-to-b from-violet-500 to-indigo-500 shrink-0" />
              <h3 className="text-xs font-bold uppercase tracking-widest label-gradient">Skills in Action</h3>
            </div>
            <SkillsConstellation />
          </div>

          <div className="mt-10 pt-5 border-t border-border flex items-center justify-between">
            <span className="text-[10px] text-fg-faint uppercase tracking-widest">3 / 5</span>
            <a href="#testimonials" className="inline-flex items-center gap-1.5 text-[11px] text-fg-faint hover:text-fg transition-colors">
              What colleagues say
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
            </a>
          </div>
        </Inner>
      </StackSection>

      {/* ── 5 · Testimonials ── z-[5] ──────────────────────────── */}
      <StackSection z={5} id="testimonials">
        <Inner className="py-16 sm:py-20 relative">
          {/* Ghost number */}
          <span aria-hidden className="pointer-events-none absolute -top-4 right-0 select-none font-black text-fg/[0.03] dark:text-fg/[0.04] leading-none"
            style={{ fontSize: "clamp(7rem,18vw,14rem)" }}>04</span>
          <TestimonialsCarousel />
          <div className="mt-10 pt-5 border-t border-border flex items-center justify-between">
            <span className="text-[10px] text-fg-faint uppercase tracking-widest">4 / 5</span>
            <a href="#contact" className="inline-flex items-center gap-1.5 text-[11px] text-fg-faint hover:text-fg transition-colors">
              Let&apos;s connect
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
            </a>
          </div>
        </Inner>
      </StackSection>

      {/* ── 6 · Contact ── z-[6] ───────────────────────────────── */}
      <StackSection z={6} className="pb-16 sm:pb-24" id="contact">
        <Inner className="py-16 sm:py-20 relative">
          {/* Ghost number */}
          <span aria-hidden className="pointer-events-none absolute -top-4 right-0 select-none font-black text-fg/[0.03] dark:text-fg/[0.04] leading-none"
            style={{ fontSize: "clamp(7rem,18vw,14rem)" }}>05</span>
          <ContactForm />
        </Inner>
      </StackSection>
    </div>
  );
}

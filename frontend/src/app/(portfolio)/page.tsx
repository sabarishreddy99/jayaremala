import Link from "next/link";
import { profile } from "@/data/profile";
import { projects } from "@/data/projects";
import { skills } from "@/data/skills";
import { quotes } from "@/data/quotes";
import { getAllPosts } from "@/lib/blog";
import TestimonialsCarousel from "@/components/TestimonialsCarousel";
import ContactForm from "@/components/ContactForm";
import ScrollReveal from "@/components/ScrollReveal";
import HeroAvocado from "@/components/HeroAvocado";
import HeroName from "@/components/HeroName";
import HeroStats from "@/components/HeroStats";
import ParticleBackground from "@/components/ParticleBackground";
import RagPipelineCard from "@/components/RagPipelineCard";
import StackSection from "@/components/StackSection";
import SkillsSection from "@/components/SkillsSection";
import SectionNav from "@/components/SectionNav";

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
    <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className}`}>
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


export default function PortfolioHome() {
  const featured = projects.filter((p) => p.featured);
  const latestPost = getAllPosts()[0] ?? null;
  const latestQuote = quotes.find((q) => q.featured) ?? [...quotes].sort((a, b) => b.addedAt.localeCompare(a.addedAt))[0] ?? null;

  return (
    <div className="w-full">
      <SectionNav />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── 1 · Hero — not sticky, scrolls away naturally ──────── */}
      {/* isolate creates a local stacking context so the canvas (z:-20) and blobs (z:-10)
          are painted BELOW the section's normal-flow content without fighting the root context */}
      <section id="hero" className="relative isolate overflow-x-clip scroll-mt-[50px]">

        {/* Particle network — deepest layer in this stacking context */}
        <ParticleBackground />

        {/* Ambient blob layer */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="animate-blob absolute -top-32 -right-24 h-[560px] w-[560px] rounded-full bg-indigo-500/10 dark:bg-indigo-400/7 blur-[110px]" />
          <div className="animate-blob animation-delay-2000 absolute bottom-0 -left-16 h-[420px] w-[420px] rounded-full bg-violet-600/8 dark:bg-violet-500/6 blur-[90px]" />
          <div className="animate-blob animation-delay-4000 absolute top-1/2 left-[40%] h-[280px] w-[280px] -translate-y-1/2 rounded-full bg-blue-400/6 dark:bg-blue-400/4 blur-[70px]" />
        </div>

        <Inner className="grid lg:grid-cols-[1fr_420px] lg:gap-x-14 pt-14 sm:pt-16 pb-16 gap-y-5">

          {/* ── Left column ── */}
          <div className="flex flex-col gap-5">

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
                  className={`animate-fade-up w-fit flex items-center gap-2 rounded-full border px-3 py-1.5 sm:bg-transparent sm:border-transparent sm:px-0 sm:py-0 ${isOpen ? "bg-green-500/8 dark:bg-green-500/10 border-green-500/20" : "bg-zinc-500/8 dark:bg-zinc-500/10 border-zinc-400/20"}`}
                  style={{ animationDelay: "0ms" }}
                >
                  <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${isOpen ? "bg-green-500 animate-pulse" : "bg-zinc-400 dark:bg-zinc-500"}`} />
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-fg-faint">
                    {chipText}
                  </span>
                </div>
              );
            })()}

            {/* Name */}
            <HeroName name={profile.name} />

            {/* Tagline */}
            <p
              className="animate-fade-up text-base sm:text-lg font-medium text-accent leading-relaxed"
              style={{ animationDelay: "140ms" }}
            >
              {profile.tagline}
            </p>

            {/* Stats */}
            <div className="animate-fade-up" style={{ animationDelay: "220ms" }}>
              <HeroStats stats={profile.heroStats} />
            </div>

            {/* CTAs */}
            <div
              className="animate-fade-up flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3"
              style={{ animationDelay: "300ms" }}
            >
              <Link
                href="/chat"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 hover:bg-indigo-700 px-6 py-3.5 sm:py-2.5 text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all duration-200"
              >
                Chat with Avocado
                <span className="opacity-80">✦</span>
              </Link>
              <Link
                href="/projects"
                className="inline-flex items-center justify-center gap-1.5 rounded-full border-2 border-border px-6 py-3.5 sm:py-2.5 text-sm font-semibold text-fg-muted hover:border-fg hover:text-fg transition-colors duration-200"
              >
                View Projects
              </Link>
              <a
                href={profile.resume}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border px-5 py-3.5 sm:py-2.5 text-sm font-medium text-fg-subtle hover:text-fg hover:border-fg-muted transition-colors duration-200"
              >
                Resume ↗
              </a>
            </div>

            {/* Prev @ */}
            <div
              className="animate-fade-up flex flex-wrap items-center gap-2"
              style={{ animationDelay: "380ms" }}
            >
              <span className="text-sm text-fg-faint">Prev @</span>
              {profile.previous.split(",").map((co) => (
                <span key={co} className="rounded-full border border-border bg-surface-raised px-2.5 py-0.5 text-xs font-medium text-fg-subtle">
                  {co.trim()}
                </span>
              ))}
            </div>
          </div>

          {/* ── Right column ── */}
          <div className="mt-6 lg:mt-0 flex flex-col gap-5">

            {/* Currently deep in */}
            {profile.currently && (
              <div
                className="animate-fade-up flex items-start gap-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20 px-3.5 py-2.5"
                style={{ animationDelay: "80ms" }}
              >
                <span className="text-sm shrink-0 select-none">💭</span>
                <p className="text-xs text-fg-muted leading-relaxed">
                  <span className="font-semibold text-fg-subtle">Currently deep in</span>
                  {" — "}{profile.currently}
                </p>
              </div>
            )}

            {/* HeroAvocado */}
            <div className="animate-fade-up" style={{ animationDelay: "160ms" }}>
              <HeroAvocado />
            </div>

            {/* Latest teasers — blog + quote */}
            <div
              className="animate-fade-up flex flex-col gap-2"
              style={{ animationDelay: "240ms" }}
            >
              {latestPost && (
                <Link href={`/blog/${latestPost.slug}`} className="group inline-flex items-center gap-2 w-fit max-w-sm">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-fg-faint shrink-0">Blog</span>
                  <span className="text-xs text-fg-subtle group-hover:text-accent transition-colors line-clamp-1">
                    {latestPost.title} →
                  </span>
                </Link>
              )}
              {latestQuote && (
                <Link href="/quotes" className="group inline-flex items-center gap-2 w-fit max-w-sm">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-fg-faint shrink-0">Quote</span>
                  <span className="text-xs text-fg-subtle group-hover:text-accent transition-colors line-clamp-1 italic">
                    &ldquo;{latestQuote.text}&rdquo; — {latestQuote.author} →
                  </span>
                </Link>
              )}
            </div>
          </div>
        </Inner>
      </section>

      {/* ── 2 · At a Glance ── z-[2] ───────────────────────────── */}
      <StackSection z={2} seamless id="about">
<Inner className="py-16 sm:py-20">
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-0.5 h-3.5 rounded-full bg-gradient-to-b from-indigo-500 to-violet-500 shrink-0" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-fg-faint">At a Glance</h2>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_260px]">
            <div className="space-y-6">
              <p className="text-base sm:text-lg leading-8 text-fg max-w-2xl">
                <HighlightNumbers text={profile.bio} />
              </p>

              <div className="flex items-start gap-3 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/30 px-4 py-3.5 max-w-2xl">
                <span className="mt-0.5 text-indigo-400 shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9.983 3v7.391c0 5.704-3.731 9.57-8.983 10.609l-.995-2.151c2.432-.917 3.995-3.638 3.995-5.849h-4v-10h9.983zm14.017 0v7.391c0 5.704-3.748 9.571-9 10.609l-.996-2.151c2.433-.917 3.996-3.638 3.996-5.849h-3.983v-10h9.983z" />
                  </svg>
                </span>
                <p className="text-sm sm:text-base leading-7 text-fg-muted italic">{profile.obsession}</p>
              </div>
            </div>

            <div className="hidden sm:flex flex-col gap-6 lg:pt-1">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-fg-faint mb-3">Previously</p>
                <div className="flex flex-wrap gap-2">
                  {profile.prev_domain.split(",").map((d) => (
                    <span key={d} className="rounded-full border border-border bg-surface-raised px-3 py-1 text-xs font-medium text-fg-subtle">
                      {d.trim()}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-fg-faint mb-3">Excited in</p>
                <div className="flex flex-wrap gap-2">
                  {profile.interested_domain.split(",").map((d) => (
                    <span key={d} className="rounded-full border border-indigo-200 dark:border-indigo-800 bg-accent-light px-3 py-1 text-xs font-medium text-accent">
                      {d.trim()}
                    </span>
                  ))}
                  <span className="rounded-full border border-border bg-surface-raised px-3 py-1 text-xs font-medium text-fg-faint italic">& more</span>
                </div>
              </div>

              {/* Company mini-timeline */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-fg-faint mb-3">Career path</p>
                <div className="flex flex-col">
                  {profile.previous.split(",").map((co, i, arr) => (
                    <div key={co} className="flex items-start gap-2.5">
                      <div className="flex flex-col items-center">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${i === 0 ? "bg-accent" : "bg-border-strong"}`} />
                        {i < arr.length - 1 && (
                          <div className="w-px h-6 bg-gradient-to-b from-border-strong/60 to-transparent mt-0.5" />
                        )}
                      </div>
                      <span className={`text-xs pb-4 ${i === 0 ? "text-fg font-medium" : "text-fg-subtle"}`}>
                        {co.trim()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Inner>
      </StackSection>

      {/* ── 3 · Featured Projects ── z-[3] ─────────────────────── */}
      {featured.length > 0 && (
        <StackSection z={3} id="projects">
          <Inner className="py-16 sm:py-20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-0.5 h-3.5 rounded-full bg-gradient-to-b from-blue-500 to-cyan-500 shrink-0" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-fg-faint">Featured Projects</h2>
              </div>
              <Link href="/projects" className="text-xs font-medium text-accent hover:text-accent-hover">
                All projects →
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((p, i) => (
                <ScrollReveal key={p.title} delay={i * 80} className="flex">
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
                    <div className="group relative flex-1 rounded-2xl border border-border bg-surface p-5 space-y-3 hover:border-indigo-300 dark:hover:border-indigo-700 card-lift overflow-hidden">
                      <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${p.award ? "from-amber-500 to-orange-500" : "from-blue-500 to-cyan-500"} origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300`} />
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
                        <p className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-900 rounded-lg px-2.5 py-1.5 leading-relaxed">
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
          </Inner>
        </StackSection>
      )}

      {/* ── 4 · Skills ── z-[4] ────────────────────────────────── */}
      <StackSection z={4} id="skills">
        <Inner className="py-16 sm:py-20">
          <SkillsSection skills={skills} featuredProjects={featured} />
        </Inner>
      </StackSection>

      {/* ── 5 · Testimonials ── z-[5] ──────────────────────────── */}
      <StackSection z={5} id="testimonials">
        <Inner className="py-16 sm:py-20">
          <TestimonialsCarousel />
        </Inner>
      </StackSection>

      {/* ── 6 · Contact ── z-[6] ───────────────────────────────── */}
      <StackSection z={6} className="pb-16 sm:pb-24" id="contact">
        <Inner className="py-16 sm:py-20">
          <ContactForm />
        </Inner>
      </StackSection>
    </div>
  );
}

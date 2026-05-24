import Link from "next/link";
import { profile } from "@/data/profile";
import { projects } from "@/data/projects";
import { skills } from "@/data/skills";
import TestimonialsCarousel from "@/components/TestimonialsCarousel";
import ContactForm from "@/components/ContactForm";
import ScrollReveal from "@/components/ScrollReveal";
import HeroAvocado from "@/components/HeroAvocado";
import RagPipelineCard from "@/components/RagPipelineCard";
import StackSection from "@/components/StackSection";

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


export default function PortfolioHome() {
  const featured = projects.filter((p) => p.featured);

  return (
    <div className="w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── 1 · Hero — not sticky, scrolls away naturally ──────── */}
      <section className="bg-bg overflow-x-clip">
        <Inner className="grid gap-5 pt-10 sm:pt-16 pb-36 sm:pb-16">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-fg-faint">
              Open to opportunities · {profile.location}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold leading-tight tracking-tight text-fg max-w-2xl">
            {profile.name}
          </h1>

          <p className="text-base sm:text-lg font-medium text-accent">{profile.tagline}</p>

          <p className="max-w-xl text-sm sm:text-base leading-7 text-fg">
            Prev @ {profile.previous}
          </p>

          {/* Ask Avocado — localized ambient glow */}
          <div className="relative isolate max-w-xl">
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
              <div className="animate-blob absolute -top-16 -left-12 h-72 w-72 rounded-full bg-indigo-500/22 blur-[90px] dark:bg-indigo-500/15" />
              <div className="animate-blob animation-delay-2000 absolute -bottom-12 -right-8 h-64 w-64 rounded-full bg-violet-500/20 blur-[80px] dark:bg-violet-500/12" />
              <div className="animate-blob animation-delay-4000 absolute top-1/2 left-1/3 h-52 w-52 -translate-y-1/2 rounded-full bg-blue-400/15 blur-[70px] dark:bg-blue-400/10" />
            </div>
            <HeroAvocado />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:shadow-xl hover:-translate-y-px transition-all duration-200"
            >
              Chat with Avocado
              <span className="opacity-80">✦</span>
            </Link>
            <Link
              href="/projects"
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-border px-6 py-2.5 text-sm font-semibold text-fg-muted hover:border-fg hover:text-fg transition-colors duration-200"
            >
              View Projects
            </Link>
          </div>
        </Inner>
      </section>

      {/* ── 2 · At a Glance ── z-[2] ───────────────────────────── */}
      <StackSection z={2} seamless>
<Inner className="py-16 sm:py-20">
          <h2 className="text-xs font-bold uppercase tracking-widest text-fg-faint mb-8">At a Glance</h2>

          <div className="grid gap-8 lg:grid-cols-[1fr_260px]">
            <div className="space-y-6">
              <p className="text-base sm:text-lg leading-8 text-fg max-w-2xl">{profile.bio}</p>

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
            </div>
          </div>
        </Inner>
      </StackSection>

      {/* ── 3 · Featured Projects ── z-[3] ─────────────────────── */}
      {featured.length > 0 && (
        <StackSection z={3}>
          <Inner className="py-16 sm:py-20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-fg-faint">Featured Projects</h2>
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
                    <div className="group flex-1 rounded-2xl border border-border bg-surface p-5 space-y-3 hover:border-indigo-300 dark:hover:border-indigo-700 card-lift">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-fg text-sm leading-snug">{p.title}</h3>
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
      <StackSection z={4}>
        <Inner className="py-16 sm:py-20">
          <h2 className="text-xs font-bold uppercase tracking-widest text-fg-faint mb-6">Skills & Tools</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {skills.map((group, i) => (
              <ScrollReveal key={group.category} delay={i * 55}>
                <div className="rounded-2xl border border-border bg-surface-raised p-5 card-lift h-full">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-accent mb-3">{group.category}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.items.map((item) => (
                      <span key={item} className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs text-fg-muted transition-colors hover:border-border-strong hover:text-fg">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </Inner>
      </StackSection>

      {/* ── 5 · Testimonials ── z-[5] ──────────────────────────── */}
      <StackSection z={5}>
        <Inner className="py-16 sm:py-20">
          <TestimonialsCarousel />
        </Inner>
      </StackSection>

      {/* ── 6 · Contact ── z-[6] ───────────────────────────────── */}
      <StackSection z={6} className="pb-16 sm:pb-24">
        <Inner className="py-16 sm:py-20">
          <ContactForm />
        </Inner>
      </StackSection>
    </div>
  );
}

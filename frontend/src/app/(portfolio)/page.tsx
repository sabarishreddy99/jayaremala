import Link from "next/link";
import { profile } from "@/data/profile";
import { projects } from "@/data/projects";
import { skills } from "@/data/skills";
import TestimonialsCarousel from "@/components/TestimonialsCarousel";
import ContactForm from "@/components/ContactForm";
import ScrollReveal from "@/components/ScrollReveal";
import HeroAvocado from "@/components/HeroAvocado";

export const metadata = { title: "Jaya Sabarish Reddy Remala — Software Engineer" };

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Jaya Sabarish Reddy Remala",
  url: "https://jayaremala.com",
  jobTitle: "Software Engineer",
  description:
    "Software Engineer specializing in Agentic AI, distributed systems, and production ML infrastructure. Qualcomm Edge AI Hackathon Winner. NYU Tandon CS.",
  email: "jr6421@nyu.edu",
  sameAs: [
    "https://linkedin.com/in/jayasabarishreddyr",
    "https://github.com/sabarishreddy99",
  ],
  alumniOf: {
    "@type": "EducationalOrganization",
    name: "New York University Tandon School of Engineering",
  },
  knowsAbout: ["Agentic AI", "Distributed Systems", "Machine Learning", "RAG", "FastAPI"],
};

export default function PortfolioHome() {
  const featured = projects.filter((p) => p.featured);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 pb-24 pt-10 sm:pt-16 space-y-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="grid gap-5 border-b border-border pb-16">
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
        <p className="max-w-xl text-sm sm:text-base leading-7 text-fg">Prev @ {profile.previous}</p>
        <p className="max-w-xl text-sm sm:text-base leading-7 text-fg-muted">{profile.bio}</p>

        {/* Domain focus */}
        <div className="flex flex-col gap-1.5 max-w-xl border-l-2 border-border pl-4">
          <p className="text-[11px] text-fg-faint">
            <span className="font-semibold uppercase tracking-widest mr-2">Previously</span>
            {profile.prev_domain.split(",").map((d, i, arr) => (
              <span key={d}>
                <span className="text-fg-subtle">{d.trim()}</span>
                {i < arr.length - 1 && <span className="mx-1.5 text-fg-faint">·</span>}
              </span>
            ))}
          </p>
          <p className="text-[11px] text-fg-faint">
            <span className="font-semibold uppercase tracking-widest mr-2">Excited in</span>
            {profile.interested_domain.split(",").map((d, i, arr) => (
              <span key={d}>
                <span className="text-accent">{d.trim()}</span>
                {i < arr.length - 1 && <span className="mx-1.5 text-fg-faint">·</span>}
              </span>
            ))}
            <span className="mx-1.5 text-fg-faint">·</span>
            <span className="text-fg-faint italic">& more</span>
          </p>
        </div>

        <p className="max-w-xl text-sm sm:text-base leading-7 text-fg-muted">{profile.obsession}</p>
        <div className="flex flex-wrap gap-3 pt-1">
          <Link
            href="/experience"
            className="rounded-full border-2 border-fg bg-fg px-5 py-2 text-sm font-semibold text-bg hover:opacity-80 transition-opacity shadow-sm"
          >
            View Experience
          </Link>
          <Link
            href="/projects"
            className="rounded-full border-2 border-border px-5 py-2 text-sm font-semibold text-fg-muted hover:border-fg hover:text-fg transition-colors"
          >
            See Projects
          </Link>
          <Link
            href="/blog"
            className="rounded-full border-2 border-border px-5 py-2 text-sm font-semibold text-fg-muted hover:border-fg hover:text-fg transition-colors"
          >
            Read Blog
          </Link>
          <a
            href={profile.resume}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border-2 border-border px-5 py-2 text-sm font-semibold text-fg-muted hover:border-fg hover:text-fg transition-colors inline-flex items-center gap-1.5"
          >
            Resume
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M7 17L17 7M17 7H7M17 7v10"/>
            </svg>
          </a>
          <Link
            href="/chat"
            className="rounded-full bg-indigo-600 dark:bg-indigo-500 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 dark:hover:bg-indigo-400 transition-colors shadow-sm"
          >
            Avocado ✦
          </Link>
        </div>

        {/* Live Avocado demo — embedded hero chatbot */}
        <HeroAvocado />
      </section>

      {/* Featured Projects */}
      {featured.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-fg-faint">Featured Projects</h2>
            <Link href="/projects" className="text-xs font-medium text-accent hover:text-accent-hover">
              All projects →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p, i) => (
              <ScrollReveal key={p.title} delay={i * 80} className="flex">
              <div
                className="group flex-1 rounded-2xl border border-border bg-surface p-5 space-y-3 hover:border-indigo-300 dark:hover:border-indigo-700 card-lift"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-fg text-sm leading-snug">{p.title}</h3>
                  {p.award && (
                    <span className="text-[10px] font-semibold rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-2 py-0.5 whitespace-nowrap flex-shrink-0">
                      🏆 Winner
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
                  {p.sourceLinks && p.sourceLinks.length > 0 ? (
                    p.sourceLinks.map((link) => (
                      <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-full bg-accent-light border border-indigo-200 dark:border-indigo-800 px-2.5 py-0.5 text-[10px] font-semibold text-accent hover:opacity-80 transition-opacity">
                        {link.label}
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                      </a>
                    ))
                  ) : null}
                </div>
              </div>
              </ScrollReveal>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-fg-faint mb-6">Skills & Tools</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {skills.map((group, i) => (
            <ScrollReveal key={group.category} delay={i * 55}>
              <div className="rounded-2xl border border-border bg-surface p-5 card-lift h-full">
                <p className="text-[11px] font-bold uppercase tracking-wider text-accent mb-3">{group.category}</p>
                <div className="flex flex-wrap gap-1.5">
                  {group.items.map((item) => (
                    <span key={item} className="rounded-full border border-border bg-surface-raised px-2.5 py-0.5 text-xs text-fg-muted transition-colors hover:border-border-strong hover:text-fg">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <TestimonialsCarousel />

      {/* Contact */}
      <ContactForm />
    </div>
  );
}

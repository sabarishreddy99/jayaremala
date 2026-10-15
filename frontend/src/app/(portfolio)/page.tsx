import Link from "next/link";
import { profile } from "@/data/profile";
import { projects } from "@/data/projects";
import { skills } from "@/data/skills";
import TestimonialDeck from "@/components/portfolio/TestimonialDeck";
import ContactForm from "@/components/portfolio/ContactForm";
import ScrollReveal from "@/components/ui/ScrollReveal";
import Parallax from "@/components/ui/Parallax";
import RagPipelineCard from "@/components/portfolio/RagPipelineCard";
import Chapter, { Inner } from "@/components/portfolio/Chapter";
import Opinions from "@/components/portfolio/Opinions";
import SkillsSection from "@/components/portfolio/SkillsSection";
import SkillsConstellation from "@/components/portfolio/SkillsConstellation";
import MobileNoBg from "@/components/ui/MobileNoBg";
import HeroDotGrid from "@/components/ui/HeroDotGrid";
import SiteVitals from "@/components/portfolio/SiteVitals";
import InstallPWA from "@/components/ui/InstallPWA";
import SparkleIcon from "@/components/ui/SparkleIcon";
import StillRunning from "@/components/portfolio/StillRunning";
import OriginStory from "@/components/portfolio/OriginStory";
import HopeMolecules from "@/components/portfolio/HopeMolecules";
import HireImpact from "@/components/portfolio/HireImpact";
import NoteStack, { type Note } from "@/components/portfolio/NoteStack";
import SiteBubbles from "@/components/portfolio/SiteBubbles";
import { getAllPosts } from "@/lib/content/blog";
import { getAllLabEntries } from "@/lib/content/lab";
import SeedRing from "@/components/portfolio/SeedRing";
import AvocadoPreview from "@/components/portfolio/AvocadoPreview";
import { experience } from "@/data/experience";

export const metadata = {
  title: "Jaya Sabarish Reddy Remala | Software Engineer",
  description:
    "Software Engineer specializing in Agentic AI, distributed systems, and production ML infrastructure. Qualcomm Edge AI Hackathon Winner. NYU Tandon CS. Previously at Shell, Wipro, NYU IT.",
  alternates: { canonical: "https://jayaremala.com/" },
  openGraph: {
    type: "website",
    url: "https://jayaremala.com/",
    title: "Jaya Sabarish Reddy Remala | Software Engineer",
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
  email: profile.email,
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
  award: profile.award,
  address: { "@type": "PostalAddress", addressLocality: "Dallas", addressRegion: "TX", addressCountry: "US" },
};

/** Wrap standalone numbers (optionally with unit suffix) in mono-bold spans.
 *
 *  The leading (^|[^A-Za-z0-9.]) guard is what keeps "P99" and "Llama 3.1 70B"
 *  intact: without it the split fires mid-token and the resume paragraph
 *  rendered "cut P**99** RAG latency", breaking the word in two typefaces. */
function HighlightNumbers({ text }: { text: string }) {
  const parts = text.split(/(?:^|(?<=[^A-Za-z0-9.]))(\d+(?:\.\d+)?(?:%|ms|GB|TB|MB|K\+?|M\+?|x|\+)?)(?![A-Za-z0-9])/g);
  return (
    <>
      {parts.map((part, i) =>
        // A bare decimal with no unit is a version ("Llama 3.1"), not a
        // measurement, so it stays in the sentence's own face.
        i % 2 === 1 && !/^\d+\.\d+$/.test(part) ? (
          <span key={i} className="font-mono font-bold text-fg">{part}</span>
        ) : (
          part
        )
      )}
    </>
  );
}


/** Concise chip label — drop the qualifier after a dash or parenthesis
 *  ("NYU IT – High-Speed Research Network" → "NYU IT"). */
function shortCompany(name: string) {
  return name.split(/\s+[–-]\s+|\s+\(/)[0].trim();
}

/** The same split, keeping the half `shortCompany` throws away.
 *
 *  The qualifier is not decoration: "Wipro Limited (Client: Shell PLC)" loses
 *  the only recognisable name on the line if it is trimmed to "Wipro Limited",
 *  and Shell is precisely the signal a reviewer is scanning for. */
function splitCompany(name: string) {
  const short = shortCompany(name);
  const qualifier = name.slice(short.length).replace(/^[\s–\-(]+|[)\s]+$/g, "").trim();
  return { short, qualifier: qualifier || null };
}

/** The home page's selected experience — curated via the `featured` flag in
 *  experience.json, capped at four. Falls back to the most recent role at each
 *  of the three most recent employers if nothing is flagged, so the strip
 *  cannot silently empty itself if the flags are ever dropped. */
function selectedExperience() {
  const flagged = experience.filter((e) => e.featured);
  if (flagged.length > 0) return flagged.slice(0, 4);

  const seen = new Set<string>();
  return experience
    .filter((e) => {
      const c = e.company.trim();
      if (seen.has(c)) return false;
      seen.add(c);
      return true;
    })
    .slice(0, 3);
}

/** Masked word-rise — the same reveal the gradeVITian hero uses. */
function RisingWords({ text, className = "", style, baseDelay = 0 }: {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  baseDelay?: number;
}) {
  return (
    <p className={className} style={style}>
      {text.split(" ").map((word, i) => (
        <span key={i} className="gv-rise-mask">
          <span className="gv-rise-inner" style={{ animationDelay: `${baseDelay + i * 90}ms` }}>
            {word}
          </span>
          {i < text.split(" ").length - 1 && " "}
        </span>
      ))}
    </p>
  );
}

export default function PortfolioHome() {
  const featured = projects.filter((p) => p.featured);
  // gradeVITian and VRF Bricks already have the "Still running" ledger; the
  // home page shows the three featured builds that appear nowhere else on it.
  const shippedNames = new Set((profile.shipped ?? []).map((s) => s.name));
  const homeProjects = featured.filter((p) => !shippedNames.has(p.title)).slice(0, 3);
  const hero = profile.hero;
  const hire = profile.hire;
  const hope = profile.hopeMolecules;
  const shipped = profile.shipped ?? [];
  const selectedRoles = selectedExperience();
  const notes: Note[] = [
    ...getAllPosts().map((p) => ({
      href: `/blog/${p.slug}`,
      kind: "Blog",
      meta: `${p.readingTime} min read`,
      date: p.publishedAt ?? p.date,
      title: p.title,
      description: p.description,
      tags: p.tags,
      image: p.image,
    })),
    ...getAllLabEntries().map((l) => ({
      href: `/lab/${l.slug}`,
      kind: "Lab",
      meta: l.status,
      date: l.updatedAt || l.startedAt,
      title: l.title,
      description: l.description,
      tags: l.tech,
    })),
  ];

  return (
    <div className="w-full">
      <MobileNoBg />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Hero — full-viewport, scrolls away naturally ──────────── */}
      {/* svh rather than dvh: on mobile Safari a dvh hero resizes as the URL
          bar hides, which reflows the whole first screen mid-scroll. svh is
          the stable small-viewport height. */}
      <section
        id="hero"
        className="chapter relative flex flex-col overflow-x-clip hero-section-bg sm:min-h-[calc(100svh-var(--nav-h))]"
      >

        <Parallax speed={0.18} className="pointer-events-none absolute inset-0">
          <HeroDotGrid />
        </Parallax>

        <div className="relative z-[1] flex-1 flex flex-col">

          <Inner className="pt-8 sm:pt-12 md:pt-14 lg:pt-16">
            {/* The story column, and from lg up an Avocado preview beside it:
                the empty right half becomes a working demo of the site's own
                claim. Below lg it is omitted; the CTA row already links /chat. */}
            <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-center lg:gap-12 xl:grid-cols-[minmax(0,62ch)_minmax(0,25rem)] xl:justify-between xl:gap-16">
            <div className="max-w-[62ch]">
            <div className="flex flex-col gap-6 sm:gap-8 md:gap-9 min-w-0">

              {/* 1 · Status */}
              {(() => {
                const avail = profile.availability;
                const isOpen = avail?.open ?? true;
                const label = avail?.label ?? "Open to opportunities";
                const parts = avail
                  ? [...(avail.types ?? []), ...(avail.locations ?? [])]
                  : [profile.location];
                const chipText = parts.length > 0 ? `${label} · ${parts.join(" · ")}` : label;
                return (
                  <div className="animate-fade-up flex items-center gap-2" style={{ animationDelay: "0ms" }}>
                    <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${isOpen ? "bg-accent" : "bg-fg-faint"}`} />
                    <span className="text-[11px] font-medium tracking-wide text-fg-faint/80">{chipText}</span>
                  </div>
                );
              })()}

              {/* 2 · Headline — a person, not a metric.
                  Garamond via .display-serif rather than the grotesque
                  --font-display: at this size the serif is the whole voice of
                  the page, and it is also the one face that survives every
                  theme (midnight swaps --font-display to Roboto). */}
              <RisingWords
                text={hero?.headline ?? profile.bio.split(". ")[0] + "."}
                className="display-serif display-xl max-w-[24ch] text-fg"
                baseDelay={120}
              />

              {/* 2b · The six-second answer.
                  The headline is written for voice and says "things" on
                  purpose. A reviewer gives the first screen a few seconds and
                  used to leave it knowing only that he builds something — the
                  discipline sat in the smallest type on the page and the award
                  appeared nowhere above the fold. This is the byline under the
                  title: what he does, and where it held up. Same facts as
                  `previous` + `award`, no new claims. */}
              {(hero?.discipline || (hero?.proof?.length ?? 0) > 0) && (
                <div
                  className="animate-fade-up flex flex-col gap-2.5"
                  style={{ animationDelay: "170ms" }}
                >
                  {hero?.discipline && (
                    <p className="text-[0.9375rem] font-medium leading-snug text-fg-muted text-pretty">
                      {hero.discipline}
                    </p>
                  )}
                  {/* A quiet line, not a row of pills: the employers read as
                      facts, and only the award gets full ink. */}
                  {hero?.proof && hero.proof.length > 0 && (() => {
                    const isAward = (item: string) =>
                      item === profile.award || /hackathon|winner|award/i.test(item);
                    const places = hero.proof.filter((p) => !isAward(p));
                    const award = hero.proof.find(isAward);
                    return (
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[0.9375rem]">
                        {places.length > 0 && (
                          <p className="text-fg-subtle">{places.join("\u00a0\u00a0·\u00a0\u00a0")}</p>
                        )}
                        {award && (
                          <p className="inline-flex items-center gap-1.5 font-medium text-fg">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
                              <path d="M8 21h8M12 17v4M6 4h12v5a6 6 0 0 1-12 0zM6 6H3v2a3 3 0 0 0 3 3M18 6h3v2a3 3 0 0 0-3 3" />
                            </svg>
                            {award} winner
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* 3 · The person — one paragraph, in the author's voice. The
                  "these days" follow-up was cut: the discipline line above
                  already says it, and the next chapter proves it. */}
              {hero?.lead && (
                <p
                  className="animate-fade-up voice-serif text-fg-muted max-w-[54ch]"
                  style={{ fontSize: "clamp(1.0625rem, 1.6vw, 1.35rem)", lineHeight: 1.62, animationDelay: "200ms" }}
                >
                  {hero.lead}
                </p>
              )}

              {/* 4 · Two CTAs + social */}
              <div className="animate-fade-up flex flex-col gap-3.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3" style={{ animationDelay: "300ms" }}>
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
                    {/* The button said "Schedule a call" and scrolled to a
                        message form — the label promised a calendar and the
                        click delivered a textarea. booking_url was already in
                        the data and used only inside the chatbot. */}
                    <a
                      href={profile.booking_url || "#contact"}
                      {...(profile.booking_url
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                      className="btn-avo group inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-medium"
                    >
                      Schedule a call
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden
                        className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </a>
                    <Link
                      href="/chat"
                      className="btn-avo-ghost group inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium"
                    >
                      <SparkleIcon size={14} className="shrink-0 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-12" />
                      Ask Avocado
                    </Link>
                  </div>
                </div>

                <span className="w-px h-5 bg-border shrink-0 hidden sm:inline-block" aria-hidden />

                <div className="flex items-center gap-1 -ml-2 sm:ml-0">
                  <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"
                    className="inline-flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-full text-fg-faint hover:text-accent hover:bg-surface-raised transition-colors">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                  </a>
                  <a href={profile.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub"
                    className="inline-flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-full text-fg-faint hover:text-fg hover:bg-surface-raised transition-colors">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                  </a>
                  {profile.resume && (
                    <a href={profile.resume} target="_blank" rel="noopener noreferrer"
                      className="group ml-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-fg-muted transition-colors hover:text-fg">
                      Resume
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden
                        className="shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                        <path d="M7 17L17 7M17 7H7M17 7v10" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>

            </div>
            </div>

            {profile.avocadoPreview && profile.avocadoPreview.length > 0 && (
              <div className="hidden animate-fade-up lg:block" style={{ animationDelay: "450ms" }}>
                <AvocadoPreview items={profile.avocadoPreview} />
              </div>
            )}
            </div>
          </Inner>

          <div className="hidden sm:block sm:flex-1 sm:min-h-[5vh]" />

          {/* ── Bottom — meta row ── */}
          <div className="flex flex-col gap-2 sm:gap-3 mt-9 sm:mt-0">
            <Inner>
              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end sm:justify-between gap-x-8 gap-y-2 border-t border-border pt-3 sm:pt-4">
                {/* The role triple that sat here restated the discipline line
                    a few inches above it. The row now does a job instead: it is
                    the hiring manager's shortcut straight to the answer. */}
                {hire && (
                  <a
                    href="#impact"
                    className="group inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-fg transition-colors hover:text-accent"
                  >
                    Hiring? See what your team gets
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden
                      className="shrink-0 transition-transform duration-200 group-hover:translate-y-0.5">
                      <path d="M12 5v14M5 12l7 7 7-7" />
                    </svg>
                  </a>
                )}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs sm:text-sm text-fg-muted">
                  <a href={`mailto:${profile.email}`} className="hover:text-accent transition-colors break-all">{profile.email}</a>
                  <span className="text-fg-subtle">{profile.location}</span>
                </div>
              </div>
            </Inner>

            {/* The scrolling name band and the signature under it were cut:
                the name is already in the nav and the headline, and the
                footer closes on "Do hard things!". The hero now ends on its
                meta row. */}
            <div className="pb-8 sm:pb-10" />
          </div>
        </div>
      </section>

      {/* The page used to run nine chapters in story order, so the answer a
          recruiter came for (numbers, employers) sat three screens down and
          the colleagues vouching for it sat at the very bottom. It now runs
          in the order a screening visit asks its questions: what do I get,
          where was it proven, who says so, who is this person, how do they
          work, how do I reach them. */}


      {/* ── 01 · What your team gets ──────────────────────────────── */}
      {hire && hire.needs.length > 0 && (
        <Chapter
          n="01"
          label={hire.label}
          deck={hire.deck}
          id="impact"
          rail={false}
          nextHref="#projects"
          nextLabel="Where it was proven"
        >
          <HireImpact data={hire} bookingUrl={profile.booking_url} resumeUrl={profile.resume} />
        </Chapter>
      )}

      {/* ── 02 · The work ─────────────────────────────────────────── */}
      <Chapter
        n="02"
        label="The work"
        place="Shell PLC · NYU"
        year="2021—present"
        deck="Three roles, three builds. Everything else is one click away."
        id="projects"
        rail={false}
        nextHref="#testimonials"
        nextLabel="What colleagues say"
      >
        {/* Roles and builds share one shape: a row of three equal cards
            that lines up on laptop and desktop, and becomes a swipeable row
            on phones and tablets (snap, one card and a peek of the next).
            Each role leads with its first bullet that carries a number. */}
        {selectedRoles.length > 0 && (
          <div>
            <div className="mb-5 flex items-center justify-between gap-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-fg-faint">Roles</h3>
              <Link href="/experience" className="text-xs font-medium text-fg-muted transition-colors hover:text-fg">
                All roles →
              </Link>
            </div>
            <ol className="card-row">
              {selectedRoles.map((job, i) => {
                const { short, qualifier } = splitCompany(job.company);
                const line = job.bullets.find((b) => /\d/.test(b)) ?? job.bullets[0];
                return (
                  <li
                    key={`${job.company}-${job.role}`}
                    data-face={["skin", "paper", "flesh"][i % 3]}
                    className="role-card flex flex-col"
                  >
                    <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] tabular-nums opacity-75">
                      {job.start} – {job.end}
                    </p>
                    <p className="display-serif mt-3 text-[clamp(1.6rem,2.2vw,2rem)] leading-none">{short}</p>
                    <p className="mt-2 text-[0.9375rem] font-medium leading-snug opacity-90">{job.role}</p>
                    {qualifier && <p className="mt-0.5 text-sm leading-snug opacity-70">{qualifier}</p>}
                    {line && (
                      <p className="mt-5 line-clamp-5 text-[0.9375rem] leading-relaxed">
                        <HighlightNumbers text={line} />
                      </p>
                    )}
                    <span className="flex-1" />
                    {job.location && (
                      <p className="mt-5 inline-flex items-center gap-1.5 border-t border-current/15 pt-4 font-mono text-[0.6875rem] uppercase tracking-[0.14em] opacity-80">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" />
                        </svg>
                        {job.location}
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        {homeProjects.length > 0 && (
          <div className="mt-12">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-fg-faint">Builds</h3>
              <Link href="/projects" className="text-xs font-medium text-fg-muted transition-colors hover:text-fg">
                All projects →
              </Link>
            </div>
            <div className="card-row">
              {homeProjects.map((p, i) => (
                <ScrollReveal key={p.title} delay={i * 80} className="flex" direction="scale">
                  {p.title.startsWith("jayaremala") ? (
                    <RagPipelineCard
                      title={p.title}
                      description={p.description}
                      tags={p.tags}
                      award={p.award}
                      sourceLinks={p.sourceLinks}
                    />
                  ) : (
                    <div className="group relative min-w-0 flex-1 overflow-hidden rounded-card border border-border bg-surface p-5 card-lift hover:border-border-strong sm:p-6">
                      <div className={`absolute inset-x-0 top-0 h-px ${p.award ? "bg-accent" : "bg-fg/20"} origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100`} />
                      {p.award && (
                        <p className="mb-2 inline-flex items-center gap-1 text-[11px] font-semibold text-fg">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M8 21h8M12 17v4M6 4h12v5a6 6 0 0 1-12 0zM6 6H3v2a3 3 0 0 0 3 3M18 6h3v2a3 3 0 0 0-3 3" /></svg>
                          {p.award}
                        </p>
                      )}
                      <h4 className="text-[0.9375rem] font-semibold leading-snug text-fg">{p.title}</h4>
                      <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-fg-subtle">{p.description}</p>
                      <p className="mt-4 font-mono text-[11px] text-fg-faint">{p.tags.slice(0, 4).join(" · ")}</p>
                      {p.sourceLinks && p.sourceLinks.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
                          {p.sourceLinks.map((link) => (
                            <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium text-fg-muted transition-colors hover:text-accent">
                              {link.label} ↗
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </ScrollReveal>
              ))}
            </div>
          </div>
        )}
      </Chapter>

      {/* ── 03 · Kind words ───────────────────────────────────────────
          Third-party proof sits right after the claims it backs, not at the
          bottom of the page where only the most patient reader found it. */}
      <Chapter
        n="03"
        label="Kind words"
        deck="From people I shipped with at Shell, Wipro and Amazon. Unedited, from LinkedIn."
        id="testimonials"
        rail={false}
        nextHref="#why"
        nextLabel="Who I am"
      >
        <TestimonialDeck />
      </Chapter>

      {/* ── 04 · Why I build ──────────────────────────────────────────
          The person. The origin story, then the ledger that proves it was
          not a one-off, then the value frame that ties the two together.
          This replaces three chapters (Kavali, Vellore, Dallas) and the
          separate "Still running" chapter that each retold part of it. */}
      {profile.why && (
        <Chapter
          n="04"
          label={profile.why.label}
          place="Kavali, Nellore"
          year="2020"
          deck="Where this started, and what is still running because of it."
          id="why"
          nextHref="#how"
          nextLabel="How I work"
        >
          <OriginStory why={profile.why} />

          {shipped.length > 0 && (
            <div className="mt-14">
              <div className="mb-6 flex items-center gap-5">
                <SeedRing text="On call since 2020 · still running · " size={116} />
                <h3 className="display-serif display-md text-fg">
                  {profile.shippedLabel ?? "Still running"}
                </h3>
              </div>
              <StillRunning items={shipped} note={profile.shippedNote} />
              <div className="mt-8">
                <SiteVitals />
              </div>
            </div>
          )}

          {hope && (
            <div className="mt-14 border-t border-border pt-10">
              <HopeMolecules data={hope} variant="chapter" />
            </div>
          )}
        </Chapter>
      )}

      {/* ── 05 · How I work ───────────────────────────────────────────
          Stances first (how I'll behave on your team), toolkit second. The
          skills-to-projects map is for the reader who wants to check, so it
          opens on request instead of costing everyone a screen. */}
      <Chapter
        n="05"
        label={profile.opinions?.label ?? "How I work"}
        deck={profile.opinions?.deck}
        id="how"
        nextHref="#writing"
        nextLabel="What I write"
      >
        {profile.opinions && <Opinions data={profile.opinions} />}

        <div className={profile.opinions ? "mt-14" : ""}>
          <SkillsSection skills={skills} featuredProjects={featured} />
        </div>

        <details className="group/map mt-10 border-t border-border pt-6">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-fg-muted transition-colors hover:text-fg [&::-webkit-details-marker]:hidden">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden
              className="shrink-0 transition-transform duration-200 group-open/map:rotate-90">
              <path d="M9 18l6-6-6-6" />
            </svg>
            See where each skill was used
          </summary>
          <div className="mt-6">
            <SkillsConstellation />
          </div>
        </details>
      </Chapter>

      {/* ── 06 · Writing ─────────────────────────────────────────────
          The posts and lab logs as a pile of notes you flip through by
          hand. Newest blog posts first, then the lab build logs. */}
      {notes.length > 0 && (
        <Chapter
          n="06"
          label="Writing"
          deck="Notes on building AI systems, and on the life around them. Flip through the pile."
          id="writing"
          rail={false}
          nextHref="#contact"
          nextLabel="Let's talk"
        >
          <NoteStack notes={notes} />
        </Chapter>
      )}

      {/* ── 07 · Explore the rest ─────────────────────────────────────
          The rest of the site as bubbles around the seed — one look shared
          with the phone menu. Placed last before contact: a visitor who has
          read this far is the one who wants to wander, and the seed in the
          middle gives anyone unsure a question to ask instead. */}
      {/* Hidden below md: on phones the same map is one tap away behind the
          seed in the nav, so a full-screen bubble field here only lengthened
          the scroll. */}
      <Chapter
        className="hidden md:block"
        n="07"
        label="Explore the rest"
        deck="Every other page, coloured by kind. Not sure where to go? The seed in the middle answers questions."
        id="explore"
        rail={false}
        nextHref="#contact"
        nextLabel="Let's talk"
      >
        <SiteBubbles />
      </Chapter>

      {/* ── 08 · Connect ──────────────────────────────────────────── */}
      <Chapter
        n="08"
        label="Let's talk"
        deck="Open to full-time roles, remote or hybrid. A call is the fastest way to reach me."
        id="contact"
        rail={false}
      >
        <ContactForm />

        {/* The eight-tile site index that lived here duplicated the footer
            directly beneath it, so it went. The two machine-facing doors
            stay. */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="inline-flex"><InstallPWA variant="chip" /></span>
          <a href="/llms.txt" target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-1.5 px-1 text-fg-faint transition-colors hover:text-accent">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden className="shrink-0 text-accent">
              <path d="M4 17l6-6-6-6"/><path d="M12 19h8"/>
            </svg>
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">Want your LLM to read my work?</span>
          </a>
        </div>
      </Chapter>
    </div>
  );
}

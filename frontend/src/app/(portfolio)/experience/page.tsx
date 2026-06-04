import { experience } from "@/data/experience";
import { profile } from "@/data/profile";
import ScrollReveal from "@/components/ScrollReveal";

export const metadata = {
  title: "Experience",
  description:
    "3+ years building production AI and distributed systems — NYU High-Speed Research Network, Shell PLC, Wipro. From maritime telemetry at 115 GB/day to 3 K+ RPS RAG pipelines.",
  alternates: { canonical: "https://jayaremala.com/experience" },
  openGraph: {
    type: "website" as const,
    url: "https://jayaremala.com/experience",
    title: "Experience — Jaya Sabarish Reddy Remala",
    description: "Career timeline: NYU IT, Shell PLC, Wipro — production AI and distributed systems at scale.",
  },
};

export default function ExperiencePage() {
  const uniqueCompanies = new Set(experience.map((e) => e.company)).size;
  const isActive = experience.some((e) => e.end === "Present");

  return (
    <div className="mx-auto w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl px-4 sm:px-6 xl:px-8 py-12 sm:py-16">

      {/* Header */}
      <header className="mb-12 sm:mb-16 relative">
        {/* Decorative bloom */}
        <div
          className="absolute -top-8 -right-8 w-72 h-72 rounded-full blur-3xl pointer-events-none -z-10"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.06) 60%, transparent 100%)" }}
          aria-hidden
        />

        <p className="text-[11px] font-bold uppercase tracking-widest text-fg-faint mb-3">Career · Timeline</p>

        {/* Title with gradient glyph */}
        <div className="flex items-baseline gap-4 mb-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-fg">Experience</h1>
          <span
            className="text-2xl sm:text-3xl select-none"
            style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
            aria-hidden
          >
            ◈
          </span>
        </div>

        {profile.page_experience && (
          <p className="text-sm text-fg-subtle max-w-xl leading-relaxed mb-4">
            {profile.page_experience}
          </p>
        )}

        {/* Stat chips */}
        <div className="flex flex-wrap gap-2 mt-4">
          {isActive && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-full px-3 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Currently active
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            {experience.length} roles
          </span>
          <span className="inline-flex items-center text-[11px] font-medium text-fg-muted bg-surface border border-border rounded-full px-3 py-1">
            {uniqueCompanies} companies
          </span>
        </div>
      </header>

      {/* Timeline */}
      <ol className="relative space-y-0">
        {experience.map((job, i) => (
          <li key={i} className="relative pl-8 pb-12 last:pb-0">
            {/* Timeline line — gradient fades toward bottom */}
            {i < experience.length - 1 && (
              <div className="absolute left-[10px] top-5 bottom-0 w-px bg-gradient-to-b from-indigo-300 dark:from-indigo-700 to-border" />
            )}

            {/* Timeline dot */}
            <div className="absolute left-0 top-1 h-[22px] w-[22px] rounded-full bg-indigo-600 shadow-sm ring-2 ring-indigo-200 dark:ring-indigo-800 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rotate-45 bg-white" />
            </div>

            <ScrollReveal delay={Math.min(i * 70, 280)} className="w-full">
              <div className="group relative rounded-xl rounded-br-none border border-border bg-surface p-5 sm:p-6 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all overflow-hidden">
                {/* Hover sweep */}
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                {/* Corner bracket accents */}
                <svg className="absolute top-2.5 left-2.5 text-border/50 group-hover:text-indigo-400/40 transition-colors duration-200 pointer-events-none" width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                  <path d="M9 1 L1 1 L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <svg className="absolute bottom-2.5 right-2.5 text-border/50 group-hover:text-indigo-400/40 transition-colors duration-200 pointer-events-none" width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                  <path d="M1 9 L9 9 L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>

                {/* Header row */}
                <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                  <div>
                    <h2 className="text-base font-bold text-fg">{job.role}</h2>
                    <p className="text-sm font-medium text-accent">{job.company}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block rounded-md bg-surface-raised px-3 py-0.5 text-[11px] font-medium text-fg-muted">
                      {job.start} – {job.end}
                    </span>
                    <p className="text-[11px] text-fg-faint mt-0.5">{job.location}</p>
                  </div>
                </div>

                {job.tech && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {job.tech.split(", ").map((t) => (
                      <span key={t} className="rounded-full bg-accent-light border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 text-[10px] font-medium text-accent">
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                <ul className="space-y-2.5">
                  {job.bullets.map((b, j) => (
                    <li key={j} className="flex gap-2.5 text-sm text-fg-muted leading-relaxed">
                      <span className="mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-400" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          </li>
        ))}
      </ol>
    </div>
  );
}

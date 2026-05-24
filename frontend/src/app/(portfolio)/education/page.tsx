import { education } from "@/data/education";
import { profile } from "@/data/profile";

export const metadata = {
  title: "Education",
  description:
    "B.S. Computer Science, NYU Tandon School of Engineering. Academic foundation in distributed systems, machine learning, and software engineering.",
  alternates: { canonical: "https://jayaremala.com/education" },
  openGraph: {
    type: "website" as const,
    url: "https://jayaremala.com/education",
    title: "Education — Jaya Sabarish Reddy Remala",
    description: "NYU Tandon School of Engineering — Computer Science. Academic foundation in AI and distributed systems.",
  },
};

export default function EducationPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-12 sm:py-16">

      {/* Header */}
      <header className="mb-12 sm:mb-16">
        <p className="text-[11px] font-bold uppercase tracking-widest text-fg-faint mb-2">Background</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-fg">Education</h1>
        {profile.page_education && <p className="mt-2 text-sm text-fg-subtle max-w-md">{profile.page_education}</p>}
      </header>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-0 top-3 bottom-3 w-px bg-border hidden sm:block" />

        <div className="space-y-10">
          {education.map((edu, i) => (
            <div key={i} className="sm:pl-10 relative">

              {/* Timeline dot */}
              <div className="hidden sm:flex absolute left-0 top-3 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-surface border-2 border-indigo-400" />

              <div className="rounded-2xl border border-border bg-surface p-6 sm:p-7 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm transition-all">

                {/* Top row: institution + period */}
                <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-fg leading-tight">
                      {edu.institution}
                    </h2>
                    <p className="text-xs text-fg-faint mt-0.5">{edu.school}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="rounded-full bg-surface-raised px-3 py-0.5 text-[11px] font-medium text-fg-muted whitespace-nowrap">
                      {edu.start} – {edu.end}
                    </span>
                    {edu.gpa && (
                      <span className="rounded-full bg-accent-light border border-indigo-200 dark:border-indigo-800 px-3 py-0.5 text-[11px] font-semibold text-accent whitespace-nowrap">
                        GPA {edu.gpa}
                      </span>
                    )}
                  </div>
                </div>

                {/* Degree + location row */}
                <div className="flex flex-wrap items-center gap-3 mt-3 mb-1">
                  <p className="text-sm font-semibold text-accent">
                    {edu.degree} — {edu.field}
                  </p>
                  <span className="flex items-center gap-1 text-[11px] text-fg-faint">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    {edu.location}
                  </span>
                </div>

                {/* Highlights */}
                {edu.highlights && edu.highlights.length > 0 && (
                  <ul className="mt-4 space-y-2.5 border-t border-border-subtle pt-4">
                    {edu.highlights.map((h, j) => {
                      const isAward = h.toLowerCase().includes("award") || h.toLowerCase().includes("outstanding") || h.toLowerCase().includes("winner");
                      return (
                        <li key={j} className="flex items-start gap-2.5 text-sm text-fg-muted leading-relaxed">
                          <span className={`mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full ${isAward ? "bg-amber-400" : "bg-indigo-300"}`} />
                          <span>
                            {isAward ? (
                              <span className="font-medium text-fg">{h}</span>
                            ) : h}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}

              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

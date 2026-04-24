import { experience } from "@/data/experience";
import { profile } from "@/data/profile";

export const metadata = { title: "Experience — Jaya Sabarish Reddy Remala" };

export default function ExperiencePage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-12 sm:py-16">
      <header className="mb-12 sm:mb-16">
        <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Career</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950">Experience</h1>
        {profile.page_experience && <p className="mt-2 text-sm text-zinc-500">{profile.page_experience}</p>}
      </header>

      <ol className="relative space-y-0">
        {experience.map((job, i) => (
          <li key={i} className="relative pl-8 pb-12 last:pb-0">
            {/* Timeline line */}
            {i < experience.length - 1 && (
              <div className="absolute left-[11px] top-4 bottom-0 w-px bg-zinc-200" />
            )}
            {/* Timeline dot */}
            <div className="absolute left-0 top-1 h-[22px] w-[22px] rounded-full border-2 border-white bg-indigo-600 shadow-sm ring-2 ring-zinc-200" />

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 hover:border-zinc-300 hover:shadow-sm transition-all">
              {/* Header row */}
              <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                <div>
                  <h2 className="text-base font-bold text-zinc-950">{job.role}</h2>
                  <p className="text-sm font-medium text-indigo-600">{job.company}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block rounded-full bg-zinc-100 px-3 py-0.5 text-[11px] font-medium text-zinc-600">
                    {job.start} – {job.end}
                  </span>
                  <p className="text-[11px] text-zinc-400 mt-0.5">{job.location}</p>
                </div>
              </div>

              {job.tech && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {job.tech.split(", ").map((t) => (
                    <span key={t} className="rounded-full bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                      {t}
                    </span>
                  ))}
                </div>
              )}

              <ul className="space-y-2.5">
                {job.bullets.map((b, j) => (
                  <li key={j} className="flex gap-2.5 text-sm text-zinc-600 leading-relaxed">
                    <span className="mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-400" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

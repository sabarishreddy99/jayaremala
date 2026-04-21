import Link from "next/link";
import { profile } from "@/data/profile";
import { projects } from "@/data/projects";
import { skills } from "@/data/skills";

export const metadata = { title: "Jaya Sabarish Reddy Remala — Software Engineer" };

export default function PortfolioHome() {
  const featured = projects.filter((p) => p.featured);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 pb-24 pt-10 sm:pt-16 space-y-20">

      {/* Hero */}
      <section className="grid gap-5 border-b border-zinc-200 pb-16">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
            Open to opportunities · {profile.location}
          </span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold leading-tight tracking-tight text-zinc-950 max-w-2xl">
          {profile.name}
        </h1>
        <p className="text-base sm:text-lg font-medium text-indigo-600">{profile.tagline}</p>
        <p className="max-w-xl text-sm sm:text-base leading-7 text-zinc-900">Prev @  {profile.previous}</p>
        <p className="max-w-xl text-sm sm:text-base leading-7 text-zinc-600">{profile.bio}</p>
        <p className="max-w-xl text-sm sm:text-base leading-7 text-zinc-800">{profile.obsession}</p>
        <div className="flex flex-wrap gap-3 pt-1">
          <Link
            href="/experience"
            className="rounded-full border-2 border-zinc-950 bg-zinc-950 px-5 py-2 text-sm font-semibold text-white hover:bg-zinc-800 hover:border-zinc-800 transition-colors shadow-sm"
          >
            View Experience
          </Link>
          <Link
            href="/projects"
            className="rounded-full border-2 border-zinc-300 px-5 py-2 text-sm font-semibold text-zinc-700 hover:border-zinc-950 hover:text-zinc-950 transition-colors"
          >
            See Projects
          </Link>
          <Link
            href="/blog"
            className="rounded-full border-2 border-zinc-300 px-5 py-2 text-sm font-semibold text-zinc-700 hover:border-zinc-950 hover:text-zinc-950 transition-colors"
          >
            Read Blog
          </Link>
          <a
            href={profile.resume}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border-2 border-zinc-300 px-5 py-2 text-sm font-semibold text-zinc-700 hover:border-zinc-950 hover:text-zinc-950 transition-colors inline-flex items-center gap-1.5"
          >
            Resume
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M7 17L17 7M17 7H7M17 7v10"/>
            </svg>
          </a>
          <Link
            href="/chat"
            className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Avocado ✦
          </Link>
        </div>
      </section>

      {/* Featured Projects */}
      {featured.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Featured Projects</h2>
            <Link href="/projects" className="text-xs font-medium text-indigo-600 hover:text-indigo-800">
              All projects →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <div
                key={p.title}
                className="group rounded-2xl border border-zinc-200 bg-white p-5 space-y-3 hover:border-indigo-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-zinc-950 text-sm leading-snug">{p.title}</h3>
                  {p.award && (
                    <span className="text-[10px] font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 whitespace-nowrap flex-shrink-0">
                      🏆 Winner
                    </span>
                  )}
                </div>
                <p className="text-xs leading-5 text-zinc-500">{p.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.tags.slice(0, 4).map((t) => (
                    <span key={t} className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="flex gap-3 pt-1">
                  {p.github && (
                    <a href={p.github} target="_blank" rel="noopener noreferrer"
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-800">
                      GitHub →
                    </a>
                  )}
                  {p.url && (
                    <a href={p.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-800">
                      Live →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6">Skills & Tools</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {skills.map((group) => (
            <div key={group.category} className="rounded-2xl border border-zinc-200 bg-white p-5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 mb-3">{group.category}</p>
              <div className="flex flex-wrap gap-1.5">
                {group.items.map((item) => (
                  <span key={item} className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs text-zinc-700">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8">
        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Get in Touch</h2>
        <p className="text-sm text-zinc-600 mb-5 max-w-md">
          Open to software engineering roles in AI/ML infrastructure, distributed systems, and full-stack. Healthcare, frontier research, and energy tech are my focus, but excited by any hard problem.
        </p>
        <div className="flex flex-wrap gap-3">
          <a href={`mailto:${profile.email}`}
            className="rounded-full border-2 border-zinc-950 bg-zinc-950 px-5 py-2 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors">
            {profile.email}
          </a>
          {profile.linkedin && (
            <a href={profile.linkedin} target="_blank" rel="noopener noreferrer"
              className="rounded-full border-2 border-zinc-300 px-5 py-2 text-sm font-semibold text-zinc-700 hover:border-zinc-950 hover:text-zinc-950 transition-colors">
              LinkedIn
            </a>
          )}
          {profile.github && (
            <a href={profile.github} target="_blank" rel="noopener noreferrer"
              className="rounded-full border-2 border-zinc-300 px-5 py-2 text-sm font-semibold text-zinc-700 hover:border-zinc-950 hover:text-zinc-950 transition-colors">
              GitHub
            </a>
          )}
          <a
            href={profile.resume}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border-2 border-indigo-200 bg-indigo-50 px-5 py-2 text-sm font-semibold text-indigo-700 hover:border-indigo-600 hover:bg-indigo-100 transition-colors inline-flex items-center gap-1.5"
          >
            Download Resume
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M7 17L17 7M17 7H7M17 7v10"/>
            </svg>
          </a>
        </div>
      </section>
    </div>
  );
}

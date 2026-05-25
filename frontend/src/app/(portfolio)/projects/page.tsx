import { projects } from "@/data/projects";
import { profile } from "@/data/profile";
import ProjectsGrid from "@/components/ProjectsGrid";

export const metadata = {
  title: "Projects",
  description:
    "Portfolio of AI systems, distributed infrastructure, and hackathon-winning projects — RAG pipelines, Edge AI inference on Snapdragon NPUs, and more.",
  alternates: { canonical: "https://jayaremala.com/projects" },
  openGraph: {
    type: "website" as const,
    url: "https://jayaremala.com/projects",
    title: "Projects — Jaya Sabarish Reddy Remala",
    description: "AI systems, distributed infrastructure, and hackathon-winning projects — RAG, Edge AI, LangGraph, FastAPI.",
  },
};

export default function ProjectsPage() {
  const featuredCount = projects.filter((p) => p.featured).length;
  const awardCount    = projects.filter((p) => p.award).length;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-12 sm:py-16">

      {/* Header */}
      <header className="mb-10 sm:mb-12 relative">
        {/* Decorative bloom */}
        <div
          className="absolute -top-8 -right-8 w-72 h-72 rounded-full blur-3xl pointer-events-none -z-10"
          style={{ background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, rgba(6,182,212,0.06) 60%, transparent 100%)" }}
          aria-hidden
        />

        <p className="text-[11px] font-bold uppercase tracking-widest text-fg-faint mb-3">Work · Built Things</p>

        {/* Title with gradient glyph */}
        <div className="flex items-baseline gap-4 mb-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-fg">Projects</h1>
          <span
            className="text-xl sm:text-2xl font-mono select-none"
            style={{
              background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
            aria-hidden
          >
            {"{ }"}
          </span>
        </div>

        {profile.page_projects && (
          <p className="text-sm text-fg-subtle max-w-xl leading-relaxed mb-4">
            {profile.page_projects}
          </p>
        )}

        {/* Stat chips */}
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="inline-flex items-center text-[11px] font-medium text-fg-muted bg-surface border border-border rounded-full px-3 py-1">
            {projects.length} projects
          </span>
          {featuredCount > 0 && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-full px-3 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              {featuredCount} featured
            </span>
          )}
          {awardCount > 0 && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-full px-3 py-1">
              🏆 {awardCount} award-winning
            </span>
          )}
        </div>
      </header>

      <ProjectsGrid projects={projects} />
    </div>
  );
}

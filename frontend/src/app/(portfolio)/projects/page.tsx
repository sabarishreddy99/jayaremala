import { projects } from "@/data/projects";
import { profile } from "@/data/profile";
import ProjectsGrid from "@/components/ProjectsGrid";

export const metadata = { title: "Projects — Jaya Sabarish Reddy Remala" };

export default function ProjectsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-12 sm:py-16">
      <header className="mb-10 sm:mb-12">
        <p className="text-[11px] font-bold uppercase tracking-widest text-fg-faint mb-2">Work</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-fg">Projects</h1>
        {profile.page_projects && <p className="mt-2 text-sm text-fg-subtle">{profile.page_projects}</p>}
      </header>

      <ProjectsGrid projects={projects} />
    </div>
  );
}

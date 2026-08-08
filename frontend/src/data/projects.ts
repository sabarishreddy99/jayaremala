import projectsJson from "@/data/knowledge/projects.json";

export interface SourceLink {
  label: string;
  url: string;
}

export interface Project {
  title: string;
  description: string;
  tags: string[];
  featured: boolean;
  award?: string;
  sourceLinks: SourceLink[];
  note?: string;
  /** Year first shipped — surfaced on the origin-story artifact card. */
  year?: string;
}

export const projects = projectsJson as Project[];

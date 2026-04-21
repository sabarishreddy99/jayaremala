import projectsJson from "@/data/knowledge/projects.json";

export interface Project {
  title: string;
  description: string;
  tags: string[];
  url?: string;
  github?: string;
  featured: boolean;
  award?: string;
}

export const projects = projectsJson as Project[];

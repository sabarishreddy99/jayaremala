import { apps } from "@/data/apps";
import { gallery } from "@/data/gallery";
import { quotes } from "@/data/quotes";
import { caseStudies } from "@/data/case-studies";
import { experience } from "@/data/experience";
import { education } from "@/data/education";
import { projects } from "@/data/projects";
import blogJson from "@/data/knowledge/blog.json";
import labJson from "@/data/knowledge/lab.json";

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const len = (v: unknown) => (Array.isArray(v) ? v.length : 0);

/**
 * A short, real count for each page in the site map ("8 projects",
 * "22 photos"). Read from the same knowledge files that render those pages,
 * so the number on the bubble can never disagree with the page behind it.
 * Pages without a natural count are simply absent and fall back to their
 * description.
 */
export const pageCounts: Record<string, string> = {
  "/experience": plural(experience.length, "role"),
  "/education": plural(education.length, "school"),
  "/projects": plural(projects.length, "project"),
  "/apps": `${plural(apps.length, "app")} live`,
  "/lab": plural(len(labJson), "build log"),
  "/blog": plural(len(blogJson), "post"),
  "/case-studies": plural(caseStudies.length, "case study", "case studies"),
  "/quotes": plural(quotes.length, "quote"),
  "/gallery": plural(gallery.length, "photo"),
  "/system": "live traces",
  "/mcp": "plug in your LLM",
};

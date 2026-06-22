import GVPageHeader from "@/components/gradevitian/GVPageHeader";
import GVExploreMore from "@/components/gradevitian/GVExploreMore";
import SemesterPlanner from "@/components/gradevitian/SemesterPlanner";
import GVJsonLd from "@/components/gradevitian/GVJsonLd";
import GVFaq, { type FaqItem } from "@/components/gradevitian/GVFaq";
import ScrollReveal from "@/components/ScrollReveal";
import { gvMetadata, breadcrumbLd, toolLd } from "@/lib/gradevitian/seo";

const DESC = "Plan your whole VIT semester in one place — courses, credits, expected grades and attendance with a live GPA. Saves to your free account and syncs across devices.";

export const metadata = gvMetadata({
  path: "/planner",
  title: "VIT Semester Planner",
  description: DESC,
  keywords: ["VIT semester planner", "plan VIT semester", "VIT course planner", "VIT GPA planner", "VIT credits planner", "gradeVITian planner"],
});

const FAQ: FaqItem[] = [
  { q: "What is the gradeVITian semester planner?", a: "It's one screen to lay out a whole semester — each course's credits, expected grade and attendance — with your GPA, total credits and overall attendance updating live." },
  { q: "Does the planner save my courses?", a: "Yes — with a free account your plan saves automatically and syncs across devices, so you can pick up where you left off." },
];

export default function PlannerPage() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 sm:py-24">
      <GVJsonLd data={[breadcrumbLd("/planner", "VIT Semester Planner"), toolLd({ path: "/planner", name: "VIT Semester Planner", description: DESC })]} />
      <GVPageHeader
        eyebrow="Plan"
        title="Semester Planner"
        subtitle="Your whole semester on one screen. Enter each course once — credits, grade and attendance — and your GPA, credits and attendance stay live. Sign in and it follows you to every device."
      />
      <ScrollReveal delay={80} className="mt-10">
        <SemesterPlanner />
      </ScrollReveal>
      <GVFaq items={FAQ} />
      <GVExploreMore current="/planner" />
    </section>
  );
}

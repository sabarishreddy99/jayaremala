import type { Metadata } from "next";
import GVPageHeader from "@/components/gradevitian/GVPageHeader";
import GVExploreMore from "@/components/gradevitian/GVExploreMore";
import SemesterPlanner from "@/components/gradevitian/SemesterPlanner";
import ScrollReveal from "@/components/ScrollReveal";

export const metadata: Metadata = {
  title: "Semester Planner",
  description: "Plan your whole semester in one place — enter your courses, credits, grades and attendance once and watch your GPA, total credits and attendance update live.",
};

export default function PlannerPage() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 sm:py-24">
      <GVPageHeader
        eyebrow="Plan"
        title="Semester Planner"
        subtitle="Your whole semester on one screen. Enter each course once — credits, grade and attendance — and your GPA, credits and attendance stay live. Sign in and it follows you to every device."
      />
      <ScrollReveal delay={80} className="mt-10">
        <SemesterPlanner />
      </ScrollReveal>
      <GVExploreMore current="/planner" />
    </section>
  );
}

import type { Metadata } from "next";
import GVPageHeader from "@/components/gradevitian/GVPageHeader";
import GVExploreMore from "@/components/gradevitian/GVExploreMore";
import CgpaGoalTracker from "@/components/gradevitian/CgpaGoalTracker";
import ScrollReveal from "@/components/ScrollReveal";

export const metadata: Metadata = {
  title: "CGPA Goal Tracker",
  description: "Set a target CGPA and see exactly what you need each remaining semester to get there — with a clear on-track / off-track read on your trajectory.",
};

export default function CgpaGoalPage() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 sm:py-24">
      <GVPageHeader
        eyebrow="Goal"
        title="CGPA Goal Tracker"
        subtitle="Name the CGPA you're chasing. We'll map the GPA you need every remaining semester to land it — and show you, semester by semester, whether you're on track."
      />
      <ScrollReveal delay={80} className="mt-10">
        <CgpaGoalTracker />
      </ScrollReveal>
      <GVExploreMore current="/cgpa-goal" />
    </section>
  );
}

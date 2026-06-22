import GVPageHeader from "@/components/gradevitian/GVPageHeader";
import GVExploreMore from "@/components/gradevitian/GVExploreMore";
import CgpaGoalTracker from "@/components/gradevitian/CgpaGoalTracker";
import GVJsonLd from "@/components/gradevitian/GVJsonLd";
import GVFaq, { type FaqItem } from "@/components/gradevitian/GVFaq";
import ScrollReveal from "@/components/ScrollReveal";
import { gvMetadata, breadcrumbLd, toolLd } from "@/lib/gradevitian/seo";

const DESC = "Set a target CGPA at VIT and see the GPA you need each remaining semester to get there — with a clear on-track read on your trajectory. Free, saves to your account.";

export const metadata = gvMetadata({
  path: "/cgpa-goal",
  title: "VIT CGPA Goal Tracker",
  description: DESC,
  keywords: ["VIT CGPA goal", "target CGPA tracker", "dream CGPA VIT", "CGPA trajectory VIT", "how to improve CGPA VIT", "gradeVITian goal tracker"],
});

const FAQ: FaqItem[] = [
  { q: "How does the CGPA goal tracker work?", a: "Enter your current CGPA, credits completed, target CGPA and semesters left. It maps the GPA you need each remaining semester and shows whether you're on track." },
  { q: "Is my dream CGPA still achievable?", a: "The tracker gives the required per-semester GPA — and if a target needs more than a 10.0, it flags that it's no longer reachable so you can reset realistically." },
];

export default function CgpaGoalPage() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 sm:py-24">
      <GVJsonLd data={[breadcrumbLd("/cgpa-goal", "VIT CGPA Goal Tracker"), toolLd({ path: "/cgpa-goal", name: "VIT CGPA Goal Tracker", description: DESC })]} />
      <GVPageHeader
        eyebrow="Goal"
        title="CGPA Goal Tracker"
        subtitle="Name the CGPA you're chasing. We'll map the GPA you need every remaining semester to land it — and show you, semester by semester, whether you're on track."
      />
      <ScrollReveal delay={80} className="mt-10">
        <CgpaGoalTracker />
      </ScrollReveal>
      <GVFaq items={FAQ} />
      <GVExploreMore current="/cgpa-goal" />
    </section>
  );
}

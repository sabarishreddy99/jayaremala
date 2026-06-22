import CgpaEstimator from "@/components/gradevitian/CgpaEstimator";
import GVPageHeader from "@/components/gradevitian/GVPageHeader";
import GVExploreMore from "@/components/gradevitian/GVExploreMore";
import GVJsonLd from "@/components/gradevitian/GVJsonLd";
import GVFaq, { type FaqItem } from "@/components/gradevitian/GVFaq";
import ScrollReveal from "@/components/ScrollReveal";
import { gvMetadata, breadcrumbLd, toolLd } from "@/lib/gradevitian/seo";

const DESC = "Find the exact GPA you need next semester to hit your target CGPA at VIT. Set your goal and gradeVITian works out what it takes — free and instant.";

export const metadata = gvMetadata({
  path: "/cgpa-estimator",
  title: "VIT CGPA Estimator",
  description: DESC,
  keywords: ["VIT CGPA estimator", "target CGPA VIT", "GPA needed VIT", "CGPA required calculator", "reach CGPA VIT", "gradeVITian estimator"],
});

const FAQ: FaqItem[] = [
  { q: "How much GPA do I need to reach my target CGPA?", a: "It depends on your current CGPA, credits completed and credits remaining. Enter those plus your target, and the estimator returns the minimum GPA you need next semester." },
  { q: "Can I still reach a 9.0 CGPA at VIT?", a: "Often yes, but it gets harder as your completed credits grow. The estimator gives the exact required GPA — and flags when a target is no longer mathematically reachable." },
  { q: "What's the difference between the estimator and the goal tracker?", a: "The estimator answers 'what do I need next semester?' for one term; the CGPA Goal Tracker maps the GPA you need across every remaining semester." },
];

export default function CgpaEstimatorPage() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 sm:py-24">
      <GVJsonLd data={[breadcrumbLd("/cgpa-estimator", "VIT CGPA Estimator"), toolLd({ path: "/cgpa-estimator", name: "VIT CGPA Estimator", description: DESC })]} />
      <GVPageHeader
        eyebrow="Planning"
        title="CGPA Estimator"
        subtitle="Set your dream CGPA, and find out exactly what next semester needs to look like."
      />
      <ScrollReveal delay={80} className="mt-10">
        <CgpaEstimator />
      </ScrollReveal>
      <GVFaq items={FAQ} />
      <GVExploreMore current="/cgpa-estimator" />
    </section>
  );
}

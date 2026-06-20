import type { Metadata } from "next";
import CgpaEstimator from "@/components/gradevitian/CgpaEstimator";
import GVPageHeader from "@/components/gradevitian/GVPageHeader";
import GVExploreMore from "@/components/gradevitian/GVExploreMore";
import ScrollReveal from "@/components/ScrollReveal";

export const metadata: Metadata = {
  title: "CGPA Estimator",
  description: "Find the minimum GPA you need next semester to reach your target CGPA.",
};

export default function CgpaEstimatorPage() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 sm:py-24">
      <GVPageHeader
        eyebrow="Planning"
        title="CGPA Estimator"
        subtitle="Set your dream CGPA, and find out exactly what next semester needs to look like."
      />
      <ScrollReveal delay={80} className="mt-10">
        <CgpaEstimator />
      </ScrollReveal>
      <GVExploreMore current="/cgpa-estimator" />
    </section>
  );
}

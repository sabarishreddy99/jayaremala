import type { Metadata } from "next";
import CgpaEstimator from "@/components/gradevitian/CgpaEstimator";
import GVPageHeader from "@/components/gradevitian/GVPageHeader";
import ScrollReveal from "@/components/ScrollReveal";

export const metadata: Metadata = {
  title: "CGPA Estimator",
  description: "Find the minimum GPA you need next semester to reach your target CGPA.",
};

export default function CgpaEstimatorPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-14">
      <GVPageHeader
        eyebrow="Planning"
        title="CGPA Estimator"
        subtitle="Work out the GPA you need next semester to hit your target."
      />
      <ScrollReveal delay={80} className="mt-10">
        <CgpaEstimator />
      </ScrollReveal>
    </section>
  );
}

import type { Metadata } from "next";
import CgpaCalculator from "@/components/gradevitian/CgpaCalculator";
import GVPageHeader from "@/components/gradevitian/GVPageHeader";
import GVExploreMore from "@/components/gradevitian/GVExploreMore";
import ScrollReveal from "@/components/ScrollReveal";

export const metadata: Metadata = {
  title: "CGPA Calculator",
  description: "Calculate your cumulative CGPA semester-wise, or instantly project it.",
};

export default function CgpaPage() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 sm:py-24">
      <GVPageHeader
        eyebrow="Cumulative"
        title="CGPA Calculator"
        subtitle="Watch your CGPA come together semester by semester — and see where this one takes it."
      />
      <ScrollReveal delay={80} className="mt-10">
        <CgpaCalculator />
      </ScrollReveal>
      <GVExploreMore current="/cgpa" />
    </section>
  );
}

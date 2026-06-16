import type { Metadata } from "next";
import CgpaCalculator from "@/components/gradevitian/CgpaCalculator";
import GVPageHeader from "@/components/gradevitian/GVPageHeader";
import ScrollReveal from "@/components/ScrollReveal";

export const metadata: Metadata = {
  title: "CGPA Calculator",
  description: "Calculate your cumulative CGPA semester-wise, or instantly project it.",
};

export default function CgpaPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-14">
      <GVPageHeader
        eyebrow="Cumulative"
        title="CGPA Calculator"
        subtitle="Add up your CGPA across semesters, or instantly project it for this one."
      />
      <ScrollReveal delay={80} className="mt-10">
        <CgpaCalculator />
      </ScrollReveal>
    </section>
  );
}

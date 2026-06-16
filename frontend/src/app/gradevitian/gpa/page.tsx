import type { Metadata } from "next";
import GpaCalculator from "@/components/gradevitian/GpaCalculator";
import GVPageHeader from "@/components/gradevitian/GVPageHeader";
import ScrollReveal from "@/components/ScrollReveal";

export const metadata: Metadata = {
  title: "GPA Calculator",
  description: "Calculate your semester GPA from your grades and credits.",
};

export default function GpaPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-14">
      <GVPageHeader
        eyebrow="Semester"
        title="GPA Calculator"
        subtitle="Compute your semester GPA from your course grades and credits."
      />
      <ScrollReveal delay={80} className="mt-10">
        <GpaCalculator />
      </ScrollReveal>
    </section>
  );
}

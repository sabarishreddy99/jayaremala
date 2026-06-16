import type { Metadata } from "next";
import GradePredictor from "@/components/gradevitian/GradePredictor";
import GVPageHeader from "@/components/gradevitian/GVPageHeader";
import ScrollReveal from "@/components/ScrollReveal";

export const metadata: Metadata = {
  title: "Grade Predictor",
  description: "Predict your final grade from CAT, DA, FAT, lab and J-component marks.",
};

export default function GradePredictorPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-14">
      <GVPageHeader
        eyebrow="Forecast"
        title="Grade Predictor"
        subtitle="Estimate your final grade across theory, lab and J-component marks."
      />
      <ScrollReveal delay={80} className="mt-10">
        <GradePredictor />
      </ScrollReveal>
    </section>
  );
}

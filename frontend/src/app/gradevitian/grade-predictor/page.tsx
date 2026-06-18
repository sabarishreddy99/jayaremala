import type { Metadata } from "next";
import GradePredictor from "@/components/gradevitian/GradePredictor";
import GVPageHeader from "@/components/gradevitian/GVPageHeader";
import GVExploreMore from "@/components/gradevitian/GVExploreMore";
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
        subtitle="See the grade you're heading for across theory, lab and J-component — before VTOP ever posts it."
      />
      <ScrollReveal delay={80} className="mt-10">
        <GradePredictor />
      </ScrollReveal>
      <GVExploreMore current="/grade-predictor" />
    </section>
  );
}

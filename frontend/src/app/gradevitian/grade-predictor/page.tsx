import GradePredictor from "@/components/gradevitian/GradePredictor";
import GVPageHeader from "@/components/gradevitian/GVPageHeader";
import GVExploreMore from "@/components/gradevitian/GVExploreMore";
import GVJsonLd from "@/components/gradevitian/GVJsonLd";
import GVFaq, { type FaqItem } from "@/components/gradevitian/GVFaq";
import ScrollReveal from "@/components/ScrollReveal";
import { gvMetadata, breadcrumbLd, toolLd } from "@/lib/gradevitian/seo";

const DESC = "Predict your final VIT grade from CAT, DA, FAT, lab and J-component marks — see the grade you're heading for before VTOP posts results. Free, no sign-up.";

export const metadata = gvMetadata({
  path: "/grade-predictor",
  title: "VIT Grade Predictor",
  description: DESC,
  keywords: ["VIT grade predictor", "VIT grade calculator", "predict VIT grade", "VIT FAT marks needed", "VIT S grade marks", "gradeVITian grade predictor"],
});

const FAQ: FaqItem[] = [
  { q: "How are grades decided at VIT?", a: "Grading is largely relative: your weighted total across CAT-1, CAT-2, digital assignments, FAT and other components is mapped to a letter grade (S–F). The predictor estimates your grade from the marks you enter." },
  { q: "What marks do I need for an S grade at VIT?", a: "There's no fixed cutoff under relative grading — it depends on the class. As a rough guide, ~90+ overall usually lands an S. Enter your component marks to see your projected grade." },
  { q: "Does the predictor include lab and J-component?", a: "Yes — you can enter theory, lab and J-component marks separately and it weights them into your final grade." },
  { q: "Is the VIT grade predictor accurate?", a: "It mirrors VIT's weighting so it's a strong estimate, but final grades depend on the class distribution and faculty moderation, so treat it as a guide." },
];

export default function GradePredictorPage() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 sm:py-24">
      <GVJsonLd data={[breadcrumbLd("/grade-predictor", "VIT Grade Predictor"), toolLd({ path: "/grade-predictor", name: "VIT Grade Predictor", description: DESC })]} />
      <GVPageHeader
        eyebrow="Forecast"
        title="Grade Predictor"
        subtitle="See the grade you're heading for across theory, lab and J-component — before VTOP ever posts it."
      />
      <ScrollReveal delay={80} className="mt-10">
        <GradePredictor />
      </ScrollReveal>
      <GVFaq items={FAQ} />
      <GVExploreMore current="/grade-predictor" />
    </section>
  );
}

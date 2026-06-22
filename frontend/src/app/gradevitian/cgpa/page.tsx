import CgpaCalculator from "@/components/gradevitian/CgpaCalculator";
import GVPageHeader from "@/components/gradevitian/GVPageHeader";
import GVExploreMore from "@/components/gradevitian/GVExploreMore";
import GVJsonLd from "@/components/gradevitian/GVJsonLd";
import GVFaq, { type FaqItem } from "@/components/gradevitian/GVFaq";
import ScrollReveal from "@/components/ScrollReveal";
import { gvMetadata, breadcrumbLd, toolLd } from "@/lib/gradevitian/seo";

const DESC = "Free VIT CGPA calculator — add each semester's GPA and credits to get your cumulative CGPA, or project this semester instantly. Built on VIT's 10-point scale.";

export const metadata = gvMetadata({
  path: "/cgpa",
  title: "VIT CGPA Calculator",
  description: DESC,
  keywords: ["VIT CGPA calculator", "VIT cumulative GPA", "calculate CGPA VIT", "CGPA calculator VIT Vellore", "CGPA to percentage VIT", "gradeVITian CGPA"],
});

const FAQ: FaqItem[] = [
  { q: "How is CGPA calculated at VIT?", a: "CGPA is the credit-weighted average of your grade points across all completed courses: total earned grade points ÷ total credits. Add each semester's GPA and credits and gradeVITian computes it instantly." },
  { q: "How do I convert CGPA to a percentage at VIT?", a: "VIT's commonly used conversion is percentage = CGPA × 10 (e.g., a 9.0 CGPA ≈ 90%). Always confirm the exact formula on your transcript or with the exam section." },
  { q: "What is a good CGPA at VIT?", a: "It depends on your goal, but 8.5+ is generally considered strong, and 9.0+ opens up honours, scholarships and most placement shortlists." },
  { q: "Can I project my CGPA before results are out?", a: "Yes — use the instant mode to add expected grades for the current semester and see where your CGPA lands." },
];

export default function CgpaPage() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 sm:py-24">
      <GVJsonLd data={[breadcrumbLd("/cgpa", "VIT CGPA Calculator"), toolLd({ path: "/cgpa", name: "VIT CGPA Calculator", description: DESC })]} />
      <GVPageHeader
        eyebrow="Cumulative"
        title="CGPA Calculator"
        subtitle="Watch your CGPA come together semester by semester — and see where this one takes it."
      />
      <ScrollReveal delay={80} className="mt-10">
        <CgpaCalculator />
      </ScrollReveal>
      <GVFaq items={FAQ} />
      <GVExploreMore current="/cgpa" />
    </section>
  );
}

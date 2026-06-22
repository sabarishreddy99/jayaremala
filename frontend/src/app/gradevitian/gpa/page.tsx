import GpaCalculator from "@/components/gradevitian/GpaCalculator";
import GVPageHeader from "@/components/gradevitian/GVPageHeader";
import GVExploreMore from "@/components/gradevitian/GVExploreMore";
import GVJsonLd from "@/components/gradevitian/GVJsonLd";
import GVFaq, { type FaqItem } from "@/components/gradevitian/GVFaq";
import ScrollReveal from "@/components/ScrollReveal";
import { gvMetadata, breadcrumbLd, toolLd } from "@/lib/gradevitian/seo";

const DESC = "Free VIT GPA calculator — enter your grades and credits to get your semester GPA (SGPA) instantly on VIT's 10-point scale. Mobile-first, accurate, no sign-up.";

export const metadata = gvMetadata({
  path: "/gpa",
  title: "VIT GPA Calculator",
  description: DESC,
  keywords: ["VIT GPA calculator", "VIT SGPA calculator", "VIT semester GPA", "GPA calculator VIT Vellore", "gradeVITian GPA"],
});

const FAQ: FaqItem[] = [
  { q: "How is GPA calculated at VIT?", a: "Your GPA is the credit-weighted average of your grade points: multiply each course's grade point (S=10, A=9, B=8, …) by its credits, add them up, and divide by your total credits. gradeVITian does this instantly as you type." },
  { q: "What is the difference between GPA and CGPA at VIT?", a: "GPA (also called SGPA) is for a single semester; CGPA is the cumulative average across all completed semesters, weighted by credits." },
  { q: "What grade points does VIT use?", a: "VIT uses a 10-point scale: S=10, A=9, B=8, C=7, D=6, E=5, and F/N=0. An 'N' (reported, not cleared) counts as 0 until you clear it." },
  { q: "Is the gradeVITian GPA calculator free?", a: "Yes — every gradeVITian calculator is free, needs no sign-up, and works offline as an installable app." },
];

export default function GpaPage() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 sm:py-24">
      <GVJsonLd data={[breadcrumbLd("/gpa", "VIT GPA Calculator"), toolLd({ path: "/gpa", name: "VIT GPA Calculator", description: DESC })]} />
      <GVPageHeader
        eyebrow="Semester"
        title="GPA Calculator"
        subtitle="Drop in your grades and credits — your semester GPA lands the moment you stop typing."
      />
      <ScrollReveal delay={80} className="mt-10">
        <GpaCalculator />
      </ScrollReveal>
      <GVFaq items={FAQ} />
      <GVExploreMore current="/gpa" />
    </section>
  );
}

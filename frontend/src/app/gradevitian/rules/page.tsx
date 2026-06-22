import GVPageHeader from "@/components/gradevitian/GVPageHeader";
import GVExploreMore from "@/components/gradevitian/GVExploreMore";
import RulesReference from "@/components/gradevitian/RulesReference";
import GVJsonLd from "@/components/gradevitian/GVJsonLd";
import GVFaq, { type FaqItem } from "@/components/gradevitian/GVFaq";
import ScrollReveal from "@/components/ScrollReveal";
import { gvMetadata, breadcrumbLd } from "@/lib/gradevitian/seo";

const DESC = "VIT's academic rules at a glance — grade scale, the 75% attendance rule, GPA/CGPA, academic standing, Re-FAT and FFCS — straight from the official regulations.";

export const metadata = gvMetadata({
  path: "/rules",
  title: "VIT Academic Regulations",
  description: DESC,
  keywords: ["VIT academic regulations", "VIT grading system", "VIT attendance rule", "VIT FFCS rules", "VIT Re-FAT", "VIT CGPA to percentage", "VIT academic standing"],
});

const FAQ: FaqItem[] = [
  { q: "What is the minimum attendance at VIT?", a: "75% in every course. Below that you can be debarred from the FAT for that course." },
  { q: "What is the VIT grade scale?", a: "S=10, A=9, B=8, C=7, D=6, E=5, F=0 and N=0 (not cleared). Your GPA/CGPA is the credit-weighted average of these points." },
  { q: "What happens if my CGPA drops below 4.0 at VIT?", a: "A CGPA below 4.0 typically places a student on academic probation. Check the current regulations for the exact thresholds and conditions." },
  { q: "What is a Re-FAT at VIT?", a: "A re-Final Assessment Test lets eligible students re-take the FAT under specified conditions (for example certain grades or genuine absences), as set out in the regulations." },
  { q: "How do I convert CGPA to a percentage at VIT?", a: "The commonly used conversion is percentage = CGPA × 10. Confirm the exact formula on your transcript or with the exam section." },
];

export default function RulesPage() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 sm:py-24">
      <GVJsonLd data={breadcrumbLd("/rules", "VIT Academic Regulations")} />
      <GVPageHeader
        eyebrow="Reference"
        title="VIT rules at a glance"
        subtitle="The numbers that actually matter — grade scale, the 75% attendance line, how CGPA works, and what happens when things go sideways — pulled straight from VIT's official regulations."
      />
      <ScrollReveal delay={80} className="mt-10">
        <RulesReference />
      </ScrollReveal>
      <GVFaq items={FAQ} />
      <GVExploreMore current="/rules" />
    </section>
  );
}

import AttendanceCalculator from "@/components/gradevitian/AttendanceCalculator";
import GVPageHeader from "@/components/gradevitian/GVPageHeader";
import GVExploreMore from "@/components/gradevitian/GVExploreMore";
import GVJsonLd from "@/components/gradevitian/GVJsonLd";
import GVFaq, { type FaqItem } from "@/components/gradevitian/GVFaq";
import ScrollReveal from "@/components/ScrollReveal";
import { gvMetadata, breadcrumbLd, toolLd } from "@/lib/gradevitian/seo";

const DESC = "Check your VIT attendance percentage and how many classes you can skip while staying above the mandatory 75%. Free, instant, no sign-up.";

export const metadata = gvMetadata({
  path: "/attendance",
  title: "VIT Attendance Calculator",
  description: DESC,
  keywords: ["VIT attendance calculator", "75 percent attendance VIT", "attendance percentage VIT", "VIT debarment attendance", "how many classes can I miss VIT", "gradeVITian attendance"],
});

const FAQ: FaqItem[] = [
  { q: "What is the minimum attendance at VIT?", a: "VIT requires a minimum of 75% attendance in each course. Falling below it can lead to being debarred from the FAT for that course." },
  { q: "How many classes can I miss at VIT?", a: "Enter your attended and total classes and the calculator shows your current percentage and exactly how many more classes you can miss before dropping below 75%." },
  { q: "What happens if my attendance falls below 75% at VIT?", a: "You risk debarment from the final assessment (FAT) for that course. Limited condonation/relaxation may apply in genuine cases — check the academic regulations." },
  { q: "Does VIT count medical leave in attendance?", a: "Approved leave can sometimes be condoned within limits, but it varies by case and school. Always confirm with your faculty/academic office and the current regulations." },
];

export default function AttendancePage() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 sm:py-24">
      <GVJsonLd data={[breadcrumbLd("/attendance", "VIT Attendance Calculator"), toolLd({ path: "/attendance", name: "VIT Attendance Calculator", description: DESC })]} />
      <GVPageHeader
        eyebrow="Attendance"
        title="Attendance Calculator"
        subtitle="Know exactly how many classes you can afford to miss — and stay safely above the 75% line."
      />
      <ScrollReveal delay={80} className="mt-10">
        <AttendanceCalculator />
      </ScrollReveal>
      <GVFaq items={FAQ} />
      <GVExploreMore current="/attendance" />
    </section>
  );
}

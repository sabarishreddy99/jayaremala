import type { Metadata } from "next";
import AttendanceCalculator from "@/components/gradevitian/AttendanceCalculator";
import GVPageHeader from "@/components/gradevitian/GVPageHeader";
import GVExploreMore from "@/components/gradevitian/GVExploreMore";
import ScrollReveal from "@/components/ScrollReveal";

export const metadata: Metadata = {
  title: "Attendance Calculator",
  description: "Track your attendance percentage and see if you're above the 75% mark.",
};

export default function AttendancePage() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 sm:py-24">
      <GVPageHeader
        eyebrow="Attendance"
        title="Attendance Calculator"
        subtitle="Know exactly how many classes you can afford to miss — and stay safely above the 75% line."
      />
      <ScrollReveal delay={80} className="mt-10">
        <AttendanceCalculator />
      </ScrollReveal>
      <GVExploreMore current="/attendance" />
    </section>
  );
}

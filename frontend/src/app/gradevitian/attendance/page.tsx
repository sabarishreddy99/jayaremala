import type { Metadata } from "next";
import AttendanceCalculator from "@/components/gradevitian/AttendanceCalculator";
import GVPageHeader from "@/components/gradevitian/GVPageHeader";
import ScrollReveal from "@/components/ScrollReveal";

export const metadata: Metadata = {
  title: "Attendance Calculator",
  description: "Track your attendance percentage and see if you're above the 75% mark.",
};

export default function AttendancePage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-14">
      <GVPageHeader
        eyebrow="Attendance"
        title="Attendance Calculator"
        subtitle="See your attendance percentage and whether you're safely above 75%."
      />
      <ScrollReveal delay={80} className="mt-10">
        <AttendanceCalculator />
      </ScrollReveal>
    </section>
  );
}

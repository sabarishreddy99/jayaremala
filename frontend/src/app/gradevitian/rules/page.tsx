import type { Metadata } from "next";
import GVPageHeader from "@/components/gradevitian/GVPageHeader";
import GVExploreMore from "@/components/gradevitian/GVExploreMore";
import RulesReference from "@/components/gradevitian/RulesReference";
import ScrollReveal from "@/components/ScrollReveal";

export const metadata: Metadata = {
  title: "VIT Rules at a glance",
  description: "The VIT academic rules every student should know — grade scale, attendance, GPA/CGPA, academic standing, Re-FAT — straight from the official FFCS regulations.",
};

export default function RulesPage() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 sm:py-24">
      <GVPageHeader
        eyebrow="Reference"
        title="VIT rules at a glance"
        subtitle="The numbers that actually matter — grade scale, the 75% attendance line, how CGPA works, and what happens when things go sideways — pulled straight from VIT's official regulations."
      />
      <ScrollReveal delay={80} className="mt-10">
        <RulesReference />
      </ScrollReveal>
      <GVExploreMore current="/rules" />
    </section>
  );
}

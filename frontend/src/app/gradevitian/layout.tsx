import type { Metadata } from "next";
import { GVAuthProvider } from "@/components/gradevitian/GVAuthProvider";
import GVNav from "@/components/gradevitian/GVNav";
import GVFooter from "@/components/gradevitian/GVFooter";

export const metadata: Metadata = {
  title: {
    default: "gradeVITian — GPA, CGPA, Grade & Attendance calculators for VITians",
    template: "%s — gradeVITian",
  },
  description:
    "Free online grading tools for VIT students: compute your GPA, CGPA, predict grades, estimate the GPA you need, and track attendance.",
  alternates: { canonical: "https://gradevitian.jayaremala.com" },
  manifest: "/gradevitian/manifest.webmanifest",
};

export default function GradeVITianLayout({ children }: { children: React.ReactNode }) {
  return (
    <GVAuthProvider>
      <div className="flex min-h-screen flex-col">
        <GVNav />
        <main className="relative flex-1">
          {children}
        </main>
        <GVFooter />
      </div>
    </GVAuthProvider>
  );
}

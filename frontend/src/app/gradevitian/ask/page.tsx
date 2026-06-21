import type { Metadata } from "next";
import GVPageHeader from "@/components/gradevitian/GVPageHeader";
import GVExploreMore from "@/components/gradevitian/GVExploreMore";
import AskRulebook from "@/components/gradevitian/AskRulebook";
import ScrollReveal from "@/components/ScrollReveal";

export const metadata: Metadata = {
  title: "Ask the Rulebook",
  description: "Ask any question about VIT's academic regulations and student code of conduct — attendance, grading, CGPA, Re-FAT, malpractice, ragging and more — answered in plain English, straight from the official rules.",
};

const si = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const BENEFITS = [
  {
    title: "Plain-English answers",
    desc: "Ask like you'd ask a senior — get a clear answer, not 40 pages of legalese.",
    icon: <svg {...si}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
  },
  {
    title: "Straight from the source",
    desc: "Grounded only in VIT's official regulations, with the exact clause cited every time.",
    icon: <svg {...si}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>,
  },
  {
    title: "Seconds, not scrolling",
    desc: "No hunting through a 43-page PDF the night before a FAT — just type and ask.",
    icon: <svg {...si}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
  },
  {
    title: "The doubts that matter",
    desc: "Attendance, Re-FAT, CGPA rules, malpractice, ragging, exam & hostel conduct — all covered.",
    icon: <svg {...si}><circle cx="12" cy="12" r="9" /><path d="M9.1 9a2.5 2.5 0 0 1 4.8.9c0 1.7-2.5 2.5-2.5 2.5" /><path d="M12 17h.01" /></svg>,
  },
];

export default function AskPage() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 sm:py-24">
      <GVPageHeader
        eyebrow="Rulebook"
        title="Ask the Rulebook"
        subtitle="Attendance, grading, CGPA, Re-FAT, malpractice, ragging — ask in plain English and get an answer grounded in VIT's official academic regulations and student code of conduct, with the clause to back it up."
      />

      <ScrollReveal delay={80} className="mt-10">
        <AskRulebook />
      </ScrollReveal>

      {/* How it helps you */}
      <ScrollReveal delay={120} className="mt-14">
        <h2 className="text-center text-xs font-bold uppercase tracking-widest text-fg-subtle">Why students keep it open</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {BENEFITS.map((b) => (
            <div key={b.title} className="flex items-start gap-3.5 rounded-2xl border border-border-subtle bg-surface/60 p-5 backdrop-blur">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-light text-accent [&>svg]:h-5 [&>svg]:w-5">{b.icon}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-fg">{b.title}</p>
                <p className="mt-1 text-[13px] font-light leading-relaxed text-fg-muted">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-5 text-center text-[11px] text-fg-subtle">
          A free account unlocks it — up to 5 questions an hour, on any device.
        </p>
      </ScrollReveal>

      <GVExploreMore current="/ask" />
    </section>
  );
}

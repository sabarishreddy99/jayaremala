import ScrollReveal from "@/components/ScrollReveal";
import GVLink from "@/components/gradevitian/GVLink";

// The five core tools, with a one-line tease that nudges students to the next one.
// Curiosity loop: every calculator points to the others, so a single visit turns
// into "let me check that too".
const TOOLS = [
  { href: "/gpa", label: "GPA Calculator", tease: "This semester's number, instantly" },
  { href: "/cgpa", label: "CGPA Calculator", tease: "Your full story, semester by semester" },
  { href: "/grade-predictor", label: "Grade Predictor", tease: "Know your grade before results drop" },
  { href: "/cgpa-estimator", label: "CGPA Estimator", tease: "The GPA you'll need to hit your goal" },
  { href: "/attendance", label: "Attendance", tease: "Stay safely above the 75% line" },
  { href: "/planner", label: "Semester Planner", tease: "Your whole semester on one screen" },
  { href: "/cgpa-goal", label: "CGPA Goal Tracker", tease: "Map the path to your dream CGPA" },
  { href: "/rules", label: "VIT Rules", tease: "The rules that actually matter" },
  { href: "/ask", label: "Ask the Rulebook", tease: "Any regulation, answered in plain English" },
];

const norm = (p: string) => p.replace(/\/+$/, "") || "/";

/** Cross-tool "keep going" block shown under each calculator — builds the habit of
 *  reaching for the whole toolkit, not just one tool. */
export default function GVExploreMore({ current }: { current: string }) {
  const cur = norm(current);
  const others = TOOLS.filter((t) => norm(t.href) !== cur).slice(0, 4);

  return (
    <ScrollReveal>
      <section className="mt-14">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="shrink-0 text-sm font-bold uppercase tracking-[0.16em] text-fg-subtle">
            Keep exploring your toolkit
          </h2>
          <div className="h-px flex-1 bg-border-subtle" aria-hidden />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {others.map((t) => (
            <GVLink
              key={t.href}
              href={t.href}
              className="group flex items-center justify-between gap-3 rounded-2xl border border-border-subtle bg-surface/60 px-4 py-3.5 backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:bg-surface-raised"
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-fg transition-colors group-hover:text-accent">
                  {t.label}
                </span>
                <span className="mt-0.5 block text-micro text-fg-muted">{t.tease}</span>
              </span>
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="shrink-0 text-fg-subtle transition-all group-hover:translate-x-0.5 group-hover:text-accent"
                aria-hidden
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </GVLink>
          ))}
        </div>
      </section>
    </ScrollReveal>
  );
}

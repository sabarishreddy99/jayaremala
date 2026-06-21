import type { ReactNode } from "react";

/**
 * Single source of truth for gradeVITian's feature pages. The nav (categorical
 * dropdowns), footer (link columns) and home page (grouped toolkit) all derive
 * from this — add a feature here once and it appears everywhere automatically.
 */
export interface GVFeature {
  href: string;
  label: string;
  desc: string;
  icon: ReactNode;
  /** Marks a recently added feature (badge in nav/home). */
  isNew?: boolean;
}
export interface GVGroup {
  label: string;
  /** One-line description of the category (shown on home). */
  blurb: string;
  items: GVFeature[];
}

const ic = {
  width: 18, height: 18, viewBox: "0 0 24 24", fill: "none",
  stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
};

export const GV_GROUPS: GVGroup[] = [
  {
    label: "Tools",
    blurb: "The numbers every VITian reaches for at exam season.",
    items: [
      { href: "/gpa", label: "GPA Calculator", desc: "This semester's number, instantly", icon: <svg {...ic}><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M8 6h8M8 10h2M8 14h2M8 18h2M14 10h2M14 14h2v4h-2z" /></svg> },
      { href: "/cgpa", label: "CGPA Calculator", desc: "Your full story, semester by semester", icon: <svg {...ic}><path d="M3 3v18h18" /><rect x="7" y="12" width="3" height="6" /><rect x="12" y="8" width="3" height="10" /><rect x="17" y="5" width="3" height="13" /></svg> },
      { href: "/grade-predictor", label: "Grade Predictor", desc: "Know your grade before results drop", icon: <svg {...ic}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></svg> },
      { href: "/cgpa-estimator", label: "CGPA Estimator", desc: "The GPA you'll need next semester", icon: <svg {...ic}><path d="M3 17 9 11l4 4 8-8" /><path d="M16 7h5v5" /></svg> },
      { href: "/attendance", label: "Attendance", desc: "Stay safely above the 75% line", icon: <svg {...ic}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4" /></svg> },
    ],
  },
  {
    label: "Planning",
    blurb: "Plan ahead and chase your goals — saved to your account.",
    items: [
      { href: "/planner", label: "Semester Planner", desc: "Your whole semester on one screen", icon: <svg {...ic}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 9v12" /></svg>, isNew: true },
      { href: "/cgpa-goal", label: "CGPA Goal Tracker", desc: "Map the path to your dream CGPA", icon: <svg {...ic}><path d="M12 2l2.4 7.4H22l-6 4.4 2.3 7.2L12 16.6 5.7 21l2.3-7.2-6-4.4h7.6z" /></svg>, isNew: true },
    ],
  },
  {
    label: "Rulebook",
    blurb: "VIT's official rules — and a way to just ask.",
    items: [
      { href: "/rules", label: "VIT Rules", desc: "The rules that actually matter", icon: <svg {...ic}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>, isNew: true },
      { href: "/ask", label: "Ask the Rulebook", desc: "Any regulation, answered in plain English", icon: <svg {...ic}><path d="M12 3l1.6 4.6L18 9.2l-4.4 1.6L12 15l-1.6-4.2L6 9.2l4.4-1.6z" /><path d="M19 14.5l.8 2.2 2.2.8-2.2.8L19 20.5l-.8-2.2-2.2-.8 2.2-.8z" /></svg>, isNew: true },
    ],
  },
];

/** Flat list of every feature page (handy for "is this route active" checks). */
export const GV_ALL_FEATURES: GVFeature[] = GV_GROUPS.flatMap((g) => g.items);

/** Footer-only link columns (account + legal) appended after the feature groups. */
export const GV_FOOTER_LINKS: { title: string; links: { label: string; href: string }[] }[] = [
  { title: "gradeVITian", links: [
    { label: "Your account", href: "/account" },
    { label: "Feedback", href: "/feedback" },
  ] },
  { title: "Legal", links: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ] },
];

import type { ReactNode } from "react";

export interface BadgeMeta {
  icon: ReactNode;
  label: string;
  description: string;
}

const ic = {
  viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
  strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
};

/** Catalog of milestone badges. Server awards them by id (see db/gradevitian.py);
 *  this maps ids → friendly display. Unknown `first_*` ids prettify automatically. */
const CATALOG: Record<string, BadgeMeta> = {
  first_gpa: { label: "First GPA", description: "Calculated your first semester GPA.", icon: <svg {...ic}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></svg> },
  first_cgpa_semwise: { label: "CGPA Tracker", description: "Worked out your cumulative CGPA.", icon: <svg {...ic}><path d="M3 17 9 11l4 4 8-8" /><path d="M16 7h5v5" /></svg> },
  first_cgpa_instant: { label: "Instant CGPA", description: "Projected your CGPA on the fly.", icon: <svg {...ic}><path d="M13 2 4 14h6l-1 8 9-12h-6z" /></svg> },
  first_cgpa_estimator: { label: "Goal Setter", description: "Estimated the GPA you'll need next sem.", icon: <svg {...ic}><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M8 6h8M8 10h2M8 14h2M8 18h2M14 10h2M14 14h2v4h-2z" /></svg> },
  first_attendance: { label: "Attendance Aware", description: "Checked your attendance.", icon: <svg {...ic}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4" /></svg> },
  first_grade_predictor: { label: "Fortune Teller", description: "Predicted a grade before results dropped.", icon: <svg {...ic}><circle cx="12" cy="10" r="7" /><path d="M7.5 18h9l-1 3h-7z" /></svg> },
  first_weightage: { label: "Weightage Wizard", description: "Converted marks to weighted scores.", icon: <svg {...ic}><path d="M12 3v18M9 21h6M6 7h12" /><path d="M6 7l-3 6a3 3 0 0 0 6 0z" /><path d="M18 7l-3 6a3 3 0 0 0 6 0z" /></svg> },
  "first_semester-plan": { label: "Planner", description: "Planned a full semester.", icon: <svg {...ic}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 9v12" /></svg> },
  "first_cgpa-goal": { label: "Dreamer", description: "Set a CGPA goal.", icon: <svg {...ic}><path d="M12 2l2.4 7.4H22l-6 4.4 2.3 7.2L12 16.6 5.7 21l2.3-7.2-6-4.4h7.6z" /></svg> },
  ten_calcs: { label: "Power User", description: "Saved 10+ calculations.", icon: <svg {...ic}><circle cx="12" cy="15" r="6" /><path d="M9 9.5 7 2h10l-2 7.5" /></svg> },
  streak_3: { label: "On a Roll", description: "Visited 3 days in a row.", icon: <svg {...ic}><path d="M12 2c1.6 3 4 4.5 4 8a4 4 0 0 1-8 0c0-1.6.6-2.6 1.6-3.6C10.6 7.4 11 4.4 12 2z" /></svg> },
  streak_7: { label: "Week Warrior", description: "A 7-day visit streak.", icon: <svg {...ic}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M8 15h2M14 15h2" /></svg> },
  streak_30: { label: "Legend", description: "A 30-day visit streak.", icon: <svg {...ic}><path d="M3 7l4.5 5L12 5l4.5 7L21 7l-1.5 12h-15z" /><path d="M5 19h14" /></svg> },
};

function fallbackIcon(): ReactNode {
  return <svg {...ic}><path d="M8 21h8M12 17v4M6 4h12v5a6 6 0 0 1-12 0zM6 6H3v2a3 3 0 0 0 3 3M18 6h3v2a3 3 0 0 0-3 3" /></svg>;
}

export function badgeMeta(id: string): BadgeMeta {
  if (CATALOG[id]) return CATALOG[id];
  if (id.startsWith("first_")) {
    const name = id.slice(6).replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      label: `First ${name}`,
      description: `Used the ${name} tool.`,
      icon: <svg {...ic}><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5 4.5-5" /></svg>,
    };
  }
  return { label: id, description: "", icon: fallbackIcon() };
}

/** Ordered list of all catalog badges (for showing locked/earned progress). */
export const ALL_BADGES = Object.keys(CATALOG);

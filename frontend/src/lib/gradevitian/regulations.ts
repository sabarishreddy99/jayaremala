import regulationsJson from "@/data/gradevitian/regulations.json";

/**
 * Authoritative VIT academic rules, curated from the official FFCS Academic
 * Regulations PDF (see `source`). Used to cite real numbers across the calculators
 * and to render the /rules reference page. Regenerate the source data with
 * `backend/scripts/parse_regulations.py`.
 */
export interface GradeRow {
  grade: string;
  points: number;
  min_marks: number | null;
  remark: string;
}

export interface RegulationRules {
  version: string;
  source: { title: string; url: string };
  grade_scale: GradeRow[];
  special_grades: { grade: string; remark: string }[];
  pass_grades: string[];
  attendance: {
    minimum_percent: number;
    expected_percent: number;
    consequence: string;
    relaxation: string;
  };
  gpa: { formula: string; description: string };
  cgpa: { formula: string; percentage_equivalent: string; rounding: string };
  academic_standing: { probation_cgpa_below: number; rule: string };
  credit_limits: { note: string; low_cgpa_max_credits: number };
  reexam: { re_cat: string; re_fat: string };
  ffcs: { description: string; categories: string[] };
  honours: { description: string };
}

export const regulations = regulationsJson as RegulationRules;

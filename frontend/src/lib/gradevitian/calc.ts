/**
 * gradeVITian calculator logic — direct, typed ports of the original client-side
 * JS (gradevitian/public_html/js/*.js). All functions are pure: given inputs they
 * return a { value, message, tone } result with no DOM access, so they're easy to
 * render and verify against the old site.
 */

export type Tone = "success" | "neutral" | "warning" | "danger";

export interface CalcResult {
  /** Numeric result when applicable (GPA/CGPA/percentage/marks), else null. */
  value: number | null;
  /** Primary human-readable line. */
  message: string;
  /** Optional secondary encouragement / explanation line. */
  detail?: string;
  tone: Tone;
}

// ── Grade → points (VIT absolute grading) ──────────────────────────────────────
export const GRADE_POINTS: Record<string, number> = {
  S: 10, A: 9, B: 8, C: 7, D: 6, E: 5, F: 0, N: 0,
};

export const GRADE_OPTIONS = ["S", "A", "B", "C", "D", "E", "F", "N"] as const;
export type Grade = (typeof GRADE_OPTIONS)[number];

// ── GPA Calculator ──────────────────────────────────────────────────────────
export interface GpaCourse {
  grade: Grade | "";
  credits: number | "";
}

/**
 * GPA = Σ(gradePoints × credits) / Σ(credits) over courses where both are set.
 * Mirrors validation from GPA Calculator.js: grade-without-credit and
 * credit-without-grade are errors.
 */
export function computeGPA(courses: GpaCourse[]): CalcResult {
  // grade selected but credits missing
  const gradeNoCredit = courses.some((c) => c.grade !== "" && (c.credits === "" || Number(c.credits) === 0));
  const creditNoGrade = courses.some((c) => c.grade === "" && Number(c.credits) >= 1);

  if (creditNoGrade) {
    return {
      value: null,
      message: "Please select the grade(s) for the course(s) whose credits are filled.",
      tone: "danger",
    };
  }
  if (gradeNoCredit) {
    return {
      value: null,
      message: "Please select the credit(s) for the course(s) whose grades are filled.",
      tone: "danger",
    };
  }

  let totalPoints = 0;
  let totalCredits = 0;
  for (const c of courses) {
    if (c.grade === "" || c.credits === "") continue;
    const cr = Number(c.credits);
    totalPoints += GRADE_POINTS[c.grade] * cr;
    totalCredits += cr;
  }

  const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
  return gpaMessage(gpa, "GPA");
}

// ── CGPA Calculator (semester-wise) ───────────────────────────────────────────
export interface Semester {
  credits: number | "";
  gpa: number | "";
}

export function computeCGPA(sems: Semester[]): CalcResult {
  const rows = sems.map((s) => ({ c: Number(s.credits) || 0, g: Number(s.gpa) || 0 }));

  if (rows.some((r) => r.g < 0)) {
    return { value: null, message: "Kindly check your GPA entries — they can't be negative.", tone: "danger" };
  }
  if (rows.some((r) => r.g > 10 || r.c > 50)) {
    return { value: null, message: "Check the limits: 0 < credits ≤ 50 and 0 < GPA ≤ 10.", tone: "danger" };
  }
  if (rows.some((r) => r.c > 0 && r.g === 0)) {
    return { value: null, message: "A semester has credits but no GPA entered.", tone: "danger" };
  }
  if (rows.some((r) => r.c === 0 && r.g > 0)) {
    return { value: null, message: "A semester has a GPA but no credits entered.", tone: "danger" };
  }

  const num = rows.reduce((a, r) => a + r.c * r.g, 0);
  const den = rows.reduce((a, r) => a + r.c, 0);
  const cgpa = den > 0 ? num / den : 0;
  if (cgpa === 0) {
    return { value: null, message: "Kindly enter your semester-wise credits and GPA.", tone: "neutral" };
  }
  return gpaMessage(cgpa, "CGPA");
}

// ── Instant CGPA (project next CGPA after this sem) ────────────────────────────
export function instantCGPA(input: {
  target: number; current: number; creditsCompleted: number; creditsThisSem: number;
}): CalcResult {
  const { target: x, current: gpa, creditsCompleted: cc, creditsThisSem: nc } = input;
  if (x <= 0 || gpa <= 0 || cc <= 0 || nc <= 0) {
    return { value: null, message: "Kindly check your entries.", detail: "Values can't be zero, negative or empty.", tone: "danger" };
  }
  if (x > 10 || gpa > 10) {
    return { value: null, message: "Kindly check your entries.", detail: "GPA/CGPA must be within 0 < x ≤ 10.", tone: "danger" };
  }
  if (cc > 300 || nc > 50) {
    return { value: null, message: "Kindly check your entries.", detail: "1 ≤ credits completed ≤ 300 and 1 ≤ credits this sem ≤ 50.", tone: "danger" };
  }
  const est = (x * nc + gpa * cc) / (nc + cc);
  if (est <= 0 || est > 10) {
    return { value: null, message: "Oops! Your entries are incorrect.", tone: "danger" };
  }
  return {
    value: round(est, 3),
    message: `Your CGPA is ${est.toFixed(3)}`,
    detail: est >= 9 ? "You are Terrific! Happy Learning!" : "Happy Learning!",
    tone: est >= 9 ? "success" : "neutral",
  };
}

// ── CGPA Estimator (min GPA needed next sem) ──────────────────────────────────
export function estimateCGPA(input: {
  target: number; current: number; creditsCompleted: number; creditsTaken: number;
}): CalcResult {
  const { target: x, current: gpa, creditsCompleted: cc, creditsTaken: nc } = input;
  if (x <= 0 || gpa <= 0 || cc <= 0 || nc <= 0) {
    return { value: null, message: "Kindly check your entries.", detail: "Values can't be zero or empty.", tone: "danger" };
  }
  if (x > 10 || gpa > 10) {
    return { value: null, message: "Kindly check your entries.", detail: "GPA/CGPA must be within 0 < x ≤ 10.", tone: "danger" };
  }
  if (cc > 300 || nc > 50) {
    return { value: null, message: "Kindly check your entries.", detail: "1 ≤ credits completed ≤ 300 and 1 ≤ credits taken ≤ 50.", tone: "danger" };
  }
  const est = (x * (cc + nc) - gpa * cc) / nc;
  if (est <= 0 || Number.isNaN(est)) {
    return { value: null, message: "Oops! Your entries are incorrect.", tone: "danger" };
  }
  if (est > 10) {
    return {
      value: null,
      message: `${nc} credit(s) aren't enough to reach a ${x} CGPA.`,
      detail: "Just missed it — excel in the upcoming semesters. Best of luck!",
      tone: "warning",
    };
  }
  return {
    value: round(est, 3),
    message: `Your minimum GPA next semester should be ${est.toFixed(3)}.`,
    detail: est >= 9 ? "You are Terrific! Happy Learning!" : "Happy Learning!",
    tone: est >= 9 ? "success" : "neutral",
  };
}

// ── Attendance ────────────────────────────────────────────────────────────────
function attendanceResult(pct: number): CalcResult {
  if (pct < 0 || pct > 100) {
    return { value: null, message: "Kindly check your entries.", tone: "danger" };
  }
  const tone: Tone = pct >= 75 ? "success" : pct >= 50 ? "warning" : "danger";
  return { value: round(pct, 2), message: `Your attendance is ${pct.toFixed(2)}%`, tone };
}

/** Format 1: classes present + classes absent. */
export function attendanceFmt1(present: number, absent: number): CalcResult {
  const p = Number(present) || 0;
  const a = Number(absent) || 0;
  if (p < 0 || a < 0) return { value: null, message: "Entries can't be negative.", tone: "danger" };
  if (p + a === 0) return { value: 0, message: "Your attendance is 0%", tone: "danger" };
  return attendanceResult((p / (p + a)) * 100);
}

/** Format 2: total classes + EITHER present OR absent (not both). */
export function attendanceFmt2(total: number, present: number | "", absent: number | ""): CalcResult {
  const t = Number(total);
  const p = present === "" ? null : Number(present);
  const a = absent === "" ? null : Number(absent);

  if (!t || t < 1) return { value: null, message: "Enter a valid number of total classes.", tone: "danger" };
  if ((p ?? 0) < 0 || (a ?? 0) < 0) return { value: null, message: "Entries can't be negative.", tone: "danger" };
  if (p !== null && a !== null && p > 0 && a > 0) {
    return { value: null, message: "Enter either classes present OR classes absent — not both.", tone: "danger" };
  }
  if ((p === null || p === 0) && (a === null || a === 0)) {
    return { value: 0, message: "Your attendance is 0%", tone: "danger" };
  }
  const attended = a !== null && a > 0 ? t - a : (p ?? 0);
  return attendanceResult((attended / t) * 100);
}

// ── Weightage converter ────────────────────────────────────────────────────────
export function convertWeightage(maxOriginal: number, maxWeightage: number, obtained: number): CalcResult {
  const mo = Number(maxOriginal) || 0;
  const mw = Number(maxWeightage) || 0;
  const ob = Number(obtained) || 0;
  if (mo === 0 || mw === 0 || ob === 0) {
    return { value: null, message: "All entries must be valid and non-zero.", tone: "danger" };
  }
  if (ob > mo) {
    return { value: null, message: "Obtained marks can't exceed the maximum original marks.", tone: "danger" };
  }
  const w = (ob / mo) * mw;
  return {
    value: round(w, 2),
    message: `Your obtained weightage mark is ${w.toFixed(2)} out of ${mw}.`,
    tone: "neutral",
  };
}

// ── Grade Predictor ───────────────────────────────────────────────────────────
export interface GradePredictorInput {
  courseCredits: number;
  theoryCredits: number;
  labCredits: number;
  jcompCredits: number;
  // theory
  cat1: number | ""; cat2: number | ""; da1: number | ""; da2: number | ""; da3: number | "";
  fat: number | ""; additionalLearning: number | "";
  // lab
  labInternal: number | ""; labFat: number | "";
  // j-component reviews
  review1: number | ""; review2: number | ""; review3: number | "";
}

function marksToGrade(m: number): string {
  if (m >= 90) return "S";
  if (m >= 80) return "A";
  if (m >= 70) return "B";
  if (m >= 60) return "C";
  if (m >= 55) return "D";
  if (m >= 50) return "E";
  return "F";
}

export function predictGrade(i: GradePredictorInput): CalcResult {
  const cc = Number(i.courseCredits);
  const tc = Number(i.theoryCredits) || 0;
  const lc = Number(i.labCredits) || 0;
  const jc = Number(i.jcompCredits) || 0;

  if (!cc) return { value: null, message: "Please select the total course credits.", tone: "danger" };
  if (tc + lc + jc === 0) {
    return { value: null, message: "Select the component credits (Theory, Lab or J-comp).", tone: "danger" };
  }
  if (tc + lc + jc !== cc) {
    return { value: null, message: "Component credits (Theory + Lab + J-comp) must equal the total course credits.", tone: "danger" };
  }

  const isNum = (v: number | "") => v !== "" && !Number.isNaN(Number(v));

  // ── Theory ──
  let theoryWeighted = 0;
  if (tc > 0) {
    if (![i.cat1, i.cat2, i.da1, i.da2, i.da3, i.fat].every(isNum)) {
      return { value: null, message: "All Theory component entries must be filled.", tone: "danger" };
    }
    const fat = Number(i.fat);
    if (fat < 40) {
      return failResult("You scored less than 40 in the Theory FAT.");
    }
    const cat1c = (Number(i.cat1) / 50) * 15;
    const cat2c = (Number(i.cat2) / 50) * 15;
    const da = Number(i.da1) + Number(i.da2) + Number(i.da3);
    const fatc = (fat * 40) / 100;
    const addl = Number(i.additionalLearning) || 0;
    const internalPlusFat = cat1c + cat2c + da + fatc;
    // internal portion (everything but FAT) capped at 60
    theoryWeighted = (internalPlusFat + addl - fatc >= 60)
      ? ((60 + fatc) * (cc - lc - jc)) / cc
      : ((internalPlusFat + addl) * (cc - lc - jc)) / cc;
  }

  // ── Lab ──
  let labWeighted = 0;
  if (lc > 0) {
    if (![i.labInternal, i.labFat].every(isNum)) {
      return { value: null, message: "All Lab component entries must be filled.", tone: "danger" };
    }
    const labTotal = Number(i.labInternal) + (Number(i.labFat) * 40) / 50;
    if (labTotal < 50) {
      return failResult("You scored less than 50 in the Lab component (Internals + FAT).");
    }
    labWeighted = (labTotal * (cc - tc - jc)) / cc;
  }

  // ── J-component ──
  let jcompWeighted = 0;
  if (jc > 0) {
    if (![i.review1, i.review2, i.review3].every(isNum)) {
      return { value: null, message: "All J-component entries must be filled.", tone: "danger" };
    }
    const reviews = Number(i.review1) + Number(i.review2) + Number(i.review3);
    if (reviews < 50) {
      return failResult("You scored less than 50 in the J-component (Review 1 + 2 + 3).");
    }
    jcompWeighted = (reviews * (cc - tc - lc)) / cc;
  }

  const total = theoryWeighted + labWeighted + jcompWeighted;
  if (total < 50) {
    return failResult("Your total final marks across components are below 50%.");
  }
  const grade = marksToGrade(total);
  return {
    value: round(total, 4),
    message: `Your total final marks are ${total.toFixed(4)} ~ ${Math.ceil(total)}`,
    detail: `Under absolute grading, your grade is '${grade}'.`,
    tone: grade === "S" || grade === "A" ? "success" : "neutral",
  };
}

function failResult(reason: string): CalcResult {
  return {
    value: null,
    message: "Oops! You failed this course.",
    detail: `${reason} Under absolute grading, your grade is 'F'.`,
    tone: "danger",
  };
}

// ── shared helpers ──────────────────────────────────────────────────────────
function round(n: number, dp: number): number {
  return Number(n.toFixed(dp));
}

function gpaMessage(value: number, label: "GPA" | "CGPA"): CalcResult {
  const v = round(value, 4);
  let detail: string;
  let tone: Tone = "neutral";
  if (value >= 9) {
    detail = "You are awesome! Keep it up and Happy Learning!";
    tone = "success";
  } else if (value >= 8) {
    detail = "You're getting there — excel next semester and aim for a 9 pointer!";
    tone = "success";
  } else {
    detail = "Happy Learning!";
  }
  return { value: v, message: `Your ${label} is ${value.toFixed(4)}`, detail, tone };
}

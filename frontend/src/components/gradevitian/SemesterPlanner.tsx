"use client";

import { computeGPA, GRADE_OPTIONS, type GpaCourse } from "@/lib/gradevitian/calc";
import { regulations } from "@/lib/gradevitian/regulations";
import { Button, Card, Input, Select } from "@/components/gradevitian/ui";
import GVLink from "@/components/gradevitian/GVLink";
import SaveCalcButton from "@/components/gradevitian/SaveCalcButton";
import { usePersistentCalc } from "@/lib/gradevitian/usePersistentCalc";

export interface PlanCourse {
  name: string;
  credits: number | "";
  grade: GpaCourse["grade"];
  attended: number | "";
  total: number | "";
}

const emptyRow = (): PlanCourse => ({ name: "", credits: "", grade: "", attended: "", total: "" });
const initialPlan = (): PlanCourse[] => Array.from({ length: 5 }, emptyRow);

const ATT_MIN = regulations.attendance.minimum_percent;
// Shared column template — keeps the desktop header and every row in lockstep.
const COLS = "sm:grid-cols-[1fr_5rem_6rem_9.5rem_2rem]";

function num(v: number | ""): number | null {
  return v === "" || Number.isNaN(Number(v)) ? null : Number(v);
}

// Tiny field label, shown only on the stacked mobile layout.
function RowLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-1 block text-[11px] font-medium text-fg-subtle sm:hidden">{children}</span>;
}

const DeleteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
);

export default function SemesterPlanner() {
  const [courses, setCourses] = usePersistentCalc<PlanCourse[]>("semester-plan", initialPlan());

  function update(i: number, patch: Partial<PlanCourse>) {
    setCourses((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }
  function addRow() { setCourses((prev) => [...prev, emptyRow()]); }
  function removeRow(i: number) { setCourses((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev)); }
  function reset() { setCourses(initialPlan()); }

  // Live GPA from the filled rows
  const gpaRows: GpaCourse[] = courses.map((c) => ({ grade: c.grade, credits: c.credits }));
  const gpa = computeGPA(gpaRows);

  // Live credits + overall attendance
  const totalCredits = courses.reduce((s, c) => s + (num(c.credits) ?? 0), 0);
  let att = 0, attTotal = 0;
  for (const c of courses) {
    const a = num(c.attended), t = num(c.total);
    if (a !== null && t !== null && t > 0) { att += a; attTotal += t; }
  }
  const attPct = attTotal > 0 ? (att / attTotal) * 100 : null;
  const filled = courses.filter((c) => c.name.trim() || c.credits !== "" || c.grade);

  return (
    <div className="space-y-5">
      {/* Summary band */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-fg-subtle">Live GPA</p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-fg sm:text-3xl">
            {gpa.value != null ? gpa.value.toFixed(2) : "—"}
          </p>
        </Card>
        <Card className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-fg-subtle">Credits</p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-fg sm:text-3xl">{totalCredits || "—"}</p>
        </Card>
        <Card className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-fg-subtle">Attendance</p>
          <p className={`mt-1 font-mono text-2xl font-bold tabular-nums sm:text-3xl ${
            attPct == null ? "text-fg" : attPct >= ATT_MIN ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
          }`}>
            {attPct != null ? `${attPct.toFixed(0)}%` : "—"}
          </p>
        </Card>
      </div>
      {attPct != null && attPct < ATT_MIN && (
        <p className="text-center text-xs font-medium text-rose-600 dark:text-rose-400">
          Below the {ATT_MIN}% line — you risk being debarred. <GVLink href="/rules" className="font-semibold underline underline-offset-2 hover:text-rose-700 dark:hover:text-rose-300">See the rule →</GVLink>
        </p>
      )}

      {/* Course rows */}
      <Card>
        <p className="mb-5 text-sm leading-relaxed text-fg-muted">
          List your courses once — credits, expected grade, and attendance. Your GPA, total credits,
          and overall attendance update live, and everything saves to your account.
        </p>

        {/* Desktop column header */}
        <div className={`mb-2 hidden px-1 sm:grid ${COLS} sm:gap-3 sm:items-end`}>
          {["Course", "Credits", "Grade", "Attendance"].map((h) => (
            <span key={h} className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">{h}</span>
          ))}
          <span className="sr-only">Remove</span>
        </div>

        <div className="space-y-3 sm:space-y-1.5">
          {courses.map((c, i) => (
            <div
              key={i}
              className={`grid grid-cols-2 gap-x-3 gap-y-3 rounded-2xl border border-border-subtle bg-surface-raised/30 p-4 transition-colors ${COLS} sm:items-center sm:gap-y-0 sm:rounded-xl sm:border-transparent sm:bg-transparent sm:p-1`}
            >
              {/* Course name (+ inline remove on mobile) */}
              <div className="col-span-2 sm:col-span-1">
                <RowLabel>Course {i + 1}</RowLabel>
                <div className="flex items-center gap-2">
                  <Input
                    aria-label={`Course ${i + 1} name`}
                    placeholder="e.g. Engineering Calculus"
                    value={c.name}
                    onChange={(e) => update(i, { name: e.target.value })}
                    className="flex-1"
                  />
                  <button
                    onClick={() => removeRow(i)}
                    aria-label={`Remove course ${i + 1}`}
                    className="shrink-0 rounded-lg p-2 text-fg-subtle transition hover:bg-rose-500/10 hover:text-rose-500 sm:hidden"
                  >
                    <DeleteIcon />
                  </button>
                </div>
              </div>

              {/* Credits */}
              <div>
                <RowLabel>Credits</RowLabel>
                <Select aria-label={`Course ${i + 1} credits`} value={c.credits} onChange={(e) => update(i, { credits: e.target.value === "" ? "" : Number(e.target.value) })} className="text-center">
                  <option value="">—</option>
                  {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
                </Select>
              </div>

              {/* Grade */}
              <div>
                <RowLabel>Grade</RowLabel>
                <Select aria-label={`Course ${i + 1} grade`} value={c.grade} onChange={(e) => update(i, { grade: e.target.value as GpaCourse["grade"] })} className="text-center">
                  <option value="">—</option>
                  {GRADE_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
                </Select>
              </div>

              {/* Attendance */}
              <div className="col-span-2 sm:col-span-1">
                <RowLabel>Classes attended / total</RowLabel>
                <div className="flex items-center gap-1.5">
                  <Input aria-label={`Course ${i + 1} classes attended`} type="number" min={0} placeholder="0" value={c.attended} onChange={(e) => update(i, { attended: e.target.value === "" ? "" : Number(e.target.value) })} className="text-center" />
                  <span className="text-sm text-fg-subtle">/</span>
                  <Input aria-label={`Course ${i + 1} total classes`} type="number" min={0} placeholder="0" value={c.total} onChange={(e) => update(i, { total: e.target.value === "" ? "" : Number(e.target.value) })} className="text-center" />
                </div>
              </div>

              {/* Remove (desktop column) */}
              <button
                onClick={() => removeRow(i)}
                aria-label={`Remove course ${i + 1}`}
                className="hidden items-center justify-center rounded-lg p-2 text-fg-subtle transition hover:bg-rose-500/10 hover:text-rose-500 sm:flex"
              >
                <DeleteIcon />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="ghost" onClick={addRow}>+ Add course</Button>
          <Button variant="ghost" onClick={reset}>Reset</Button>
          {filled.length > 0 && (
            <SaveCalcButton
              calcType="semester-plan"
              payload={{ courses: filled }}
              result={`${filled.length} courses · GPA ${gpa.value != null ? gpa.value.toFixed(2) : "—"}${attPct != null ? ` · ${attPct.toFixed(0)}% attendance` : ""}`}
            />
          )}
        </div>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import { computeGPA, GRADE_OPTIONS, type CalcResult, type GpaCourse } from "@/lib/gradevitian/calc";
import { Button, Card, ResultCard, Select } from "@/components/gradevitian/ui";
import SaveCalcButton from "@/components/gradevitian/SaveCalcButton";
import { usePersistentCalc } from "@/lib/gradevitian/usePersistentCalc";

const COUNT = 12;
const empty = (): GpaCourse[] => Array.from({ length: COUNT }, () => ({ grade: "", credits: "" }));

export default function GpaCalculator() {
  const [courses, setCourses] = usePersistentCalc<GpaCourse[]>("gpa", empty());
  const [result, setResult] = useState<CalcResult | null>(null);

  function update(i: number, patch: Partial<GpaCourse>) {
    setCourses((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }

  function reset() {
    setCourses(empty());
    setResult(null);
  }

  return (
    <Card>
      <p className="mb-4 text-sm text-fg-muted">
        Enter the grade and credits for each course this semester (up to {COUNT}).
        Leave unused rows blank.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {courses.map((c, i) => (
          <div key={i} className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-raised/40 p-2">
            <span className="w-6 shrink-0 text-center text-xs font-semibold text-fg-subtle">{i + 1}</span>
            <Select
              aria-label={`Course ${i + 1} grade`}
              value={c.grade}
              onChange={(e) => update(i, { grade: e.target.value as GpaCourse["grade"] })}
            >
              <option value="">Grade</option>
              {GRADE_OPTIONS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </Select>
            <Select
              aria-label={`Course ${i + 1} credits`}
              value={c.credits}
              onChange={(e) => update(i, { credits: e.target.value === "" ? "" : Number(e.target.value) })}
            >
              <option value="">Credits</option>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </Select>
          </div>
        ))}
      </div>

      <div className="mt-5 flex gap-3">
        <Button onClick={() => setResult(computeGPA(courses))}>Calculate GPA</Button>
        <Button variant="ghost" onClick={reset}>Reset</Button>
      </div>

      <ResultCard result={result}>
        {result?.value != null && (
          <SaveCalcButton
            calcType="gpa"
            payload={{ courses: courses.filter((c) => c.grade && c.credits) }}
            result={result.message}
          />
        )}
      </ResultCard>
    </Card>
  );
}

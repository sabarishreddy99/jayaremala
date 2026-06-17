"use client";

import { useState } from "react";
import { computeCGPA, instantCGPA, type CalcResult, type Semester } from "@/lib/gradevitian/calc";
import { Button, Card, Field, Input, Segmented } from "@/components/gradevitian/ui";
import GVResultModal from "@/components/gradevitian/GVResultModal";
import SaveCalcButton from "@/components/gradevitian/SaveCalcButton";
import { usePersistentCalc } from "@/lib/gradevitian/usePersistentCalc";

const COUNT = 12;
const emptySems = (): Semester[] => Array.from({ length: COUNT }, () => ({ credits: "", gpa: "" }));

export default function CgpaCalculator() {
  const [mode, setMode] = useState<"semwise" | "instant">("semwise");

  return (
    <Card>
      <div className="mb-6">
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: "semwise", label: "Semester-wise" },
            { value: "instant", label: "Instant CGPA" },
          ]}
        />
      </div>

      {mode === "semwise" ? <SemWise /> : <Instant />}
    </Card>
  );
}

function SemWise() {
  const [sems, setSems] = usePersistentCalc<Semester[]>("cgpa_semwise", emptySems());
  const [result, setResult] = useState<CalcResult | null>(null);

  const update = (i: number, patch: Partial<Semester>) =>
    setSems((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  return (
    <>
      <p className="mb-4 text-sm text-fg-muted">Enter each semester&apos;s total credits and the GPA you scored.</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {sems.map((s, i) => (
          <div key={i} className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-raised/40 p-2">
            <span className="w-14 shrink-0 text-xs font-semibold text-fg-subtle">Sem {i + 1}</span>
            <Input
              type="number" min={0} max={50} placeholder="Credits"
              value={s.credits}
              onChange={(e) => update(i, { credits: e.target.value === "" ? "" : Number(e.target.value) })}
            />
            <Input
              type="number" min={0} max={10} step="0.01" placeholder="GPA"
              value={s.gpa}
              onChange={(e) => update(i, { gpa: e.target.value === "" ? "" : Number(e.target.value) })}
            />
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button onClick={() => setResult(computeCGPA(sems))}>Calculate CGPA</Button>
        <Button variant="ghost" onClick={() => { setSems(emptySems()); setResult(null); }}>Reset</Button>
        {result?.value != null && (
          <SaveCalcButton calcType="cgpa" payload={{ sems: sems.filter((s) => s.credits || s.gpa) }} result={result.message} />
        )}
      </div>
      <GVResultModal result={result} onClose={() => setResult(null)}>
        {result?.value != null && (
          <SaveCalcButton calcType="cgpa" payload={{ sems: sems.filter((s) => s.credits || s.gpa) }} result={result.message} />
        )}
      </GVResultModal>
    </>
  );
}

function Instant() {
  const [v, setV] = usePersistentCalc("cgpa_instant", { target: "", current: "", creditsCompleted: "", creditsThisSem: "" });
  const [result, setResult] = useState<CalcResult | null>(null);
  const num = (k: keyof typeof v) => (v[k] === "" ? 0 : Number(v[k]));

  return (
    <>
      <p className="mb-4 text-sm text-fg-muted">
        Project your overall CGPA after this semester, given your current standing.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Target CGPA / this-sem GPA"><Input type="number" step="0.01" value={v.target} onChange={(e) => setV({ ...v, target: e.target.value })} /></Field>
        <Field label="Current CGPA"><Input type="number" step="0.01" value={v.current} onChange={(e) => setV({ ...v, current: e.target.value })} /></Field>
        <Field label="Credits completed so far"><Input type="number" value={v.creditsCompleted} onChange={(e) => setV({ ...v, creditsCompleted: e.target.value })} /></Field>
        <Field label="Credits this semester"><Input type="number" value={v.creditsThisSem} onChange={(e) => setV({ ...v, creditsThisSem: e.target.value })} /></Field>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button onClick={() => setResult(instantCGPA({ target: num("target"), current: num("current"), creditsCompleted: num("creditsCompleted"), creditsThisSem: num("creditsThisSem") }))}>
          Estimate
        </Button>
        <Button variant="ghost" onClick={() => { setV({ target: "", current: "", creditsCompleted: "", creditsThisSem: "" }); setResult(null); }}>Reset</Button>
        {result?.value != null && <SaveCalcButton calcType="instant_cgpa" payload={v} result={result.message} />}
      </div>
      <GVResultModal result={result} onClose={() => setResult(null)}>
        {result?.value != null && <SaveCalcButton calcType="instant_cgpa" payload={v} result={result.message} />}
      </GVResultModal>
    </>
  );
}

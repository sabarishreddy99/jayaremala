"use client";

import { useState } from "react";
import {
  convertWeightage,
  predictGrade,
  type CalcResult,
  type GradePredictorInput,
} from "@/lib/gradevitian/calc";
import { Button, Card, Field, Input, ResultCard, Segmented, Select } from "@/components/gradevitian/ui";
import SaveCalcButton from "@/components/gradevitian/SaveCalcButton";
import { usePersistentCalc } from "@/lib/gradevitian/usePersistentCalc";

type NumStr = number | "";
const numOpts = (n: number) => Array.from({ length: n + 1 }, (_, i) => i);

const blank: GradePredictorInput = {
  courseCredits: 0, theoryCredits: 0, labCredits: 0, jcompCredits: 0,
  cat1: "", cat2: "", da1: "", da2: "", da3: "", fat: "", additionalLearning: "",
  labInternal: "", labFat: "", review1: "", review2: "", review3: "",
};

export default function GradePredictor() {
  const [tab, setTab] = useState<"grade" | "weightage">("grade");
  return (
    <Card>
      <div className="mb-6">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "grade", label: "Grade Predictor" },
            { value: "weightage", label: "Weightage Converter" },
          ]}
        />
      </div>
      {tab === "grade" ? <Grade /> : <Weightage />}
    </Card>
  );
}

function Grade() {
  const [v, setV] = usePersistentCalc<GradePredictorInput>("grade_predictor", blank);
  const [result, setResult] = useState<CalcResult | null>(null);
  const set = (patch: Partial<GradePredictorInput>) => setV((p) => ({ ...p, ...patch }));
  const numField = (e: React.ChangeEvent<HTMLInputElement>): NumStr =>
    e.target.value === "" ? "" : Number(e.target.value);

  return (
    <>
      <p className="mb-4 text-sm text-fg-muted">
        Select your course credit split, then fill the components that apply. Marks follow
        VIT&apos;s absolute grading.
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label="Course credits">
          <Select value={v.courseCredits} onChange={(e) => set({ courseCredits: Number(e.target.value) })}>
            {numOpts(6).map((n) => <option key={n} value={n}>{n}</option>)}
          </Select>
        </Field>
        <Field label="Theory credits">
          <Select value={v.theoryCredits} onChange={(e) => set({ theoryCredits: Number(e.target.value) })}>
            {numOpts(6).map((n) => <option key={n} value={n}>{n}</option>)}
          </Select>
        </Field>
        <Field label="Lab credits">
          <Select value={v.labCredits} onChange={(e) => set({ labCredits: Number(e.target.value) })}>
            {numOpts(6).map((n) => <option key={n} value={n}>{n}</option>)}
          </Select>
        </Field>
        <Field label="J-comp credits">
          <Select value={v.jcompCredits} onChange={(e) => set({ jcompCredits: Number(e.target.value) })}>
            {numOpts(6).map((n) => <option key={n} value={n}>{n}</option>)}
          </Select>
        </Field>
      </div>

      {v.theoryCredits > 0 && (
        <Section title="Theory component">
          <Field label="CAT-1 (out of 50)"><Input type="number" value={v.cat1} onChange={(e) => set({ cat1: numField(e) })} /></Field>
          <Field label="CAT-2 (out of 50)"><Input type="number" value={v.cat2} onChange={(e) => set({ cat2: numField(e) })} /></Field>
          <Field label="Digital Assignment 1"><Input type="number" value={v.da1} onChange={(e) => set({ da1: numField(e) })} /></Field>
          <Field label="Digital Assignment 2"><Input type="number" value={v.da2} onChange={(e) => set({ da2: numField(e) })} /></Field>
          <Field label="Digital Assignment 3"><Input type="number" value={v.da3} onChange={(e) => set({ da3: numField(e) })} /></Field>
          <Field label="FAT (out of 100)"><Input type="number" value={v.fat} onChange={(e) => set({ fat: numField(e) })} /></Field>
          <Field label="Additional learning (optional)"><Input type="number" value={v.additionalLearning} onChange={(e) => set({ additionalLearning: numField(e) })} /></Field>
        </Section>
      )}

      {v.labCredits > 0 && (
        <Section title="Lab component">
          <Field label="Lab internals (out of 50)"><Input type="number" value={v.labInternal} onChange={(e) => set({ labInternal: numField(e) })} /></Field>
          <Field label="Lab FAT (out of 50)"><Input type="number" value={v.labFat} onChange={(e) => set({ labFat: numField(e) })} /></Field>
        </Section>
      )}

      {v.jcompCredits > 0 && (
        <Section title="J-component">
          <Field label="Review 1"><Input type="number" value={v.review1} onChange={(e) => set({ review1: numField(e) })} /></Field>
          <Field label="Review 2"><Input type="number" value={v.review2} onChange={(e) => set({ review2: numField(e) })} /></Field>
          <Field label="Review 3"><Input type="number" value={v.review3} onChange={(e) => set({ review3: numField(e) })} /></Field>
        </Section>
      )}

      <div className="mt-5 flex gap-3">
        <Button onClick={() => setResult(predictGrade(v))}>Predict grade</Button>
        <Button variant="ghost" onClick={() => { setV(blank); setResult(null); }}>Reset</Button>
      </div>
      <ResultCard result={result}>
        {result?.value != null && <SaveCalcButton calcType="grade_predictor" payload={{ ...v }} result={`${result.message} — ${result.detail ?? ""}`} />}
      </ResultCard>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5 rounded-xl border border-border-subtle bg-surface-raised/40 p-4">
      <h3 className="mb-3 text-sm font-semibold text-fg">{title}</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Weightage() {
  const [v, setV] = usePersistentCalc("weightage", { maxOriginal: "", maxWeightage: "", obtained: "" });
  const [result, setResult] = useState<CalcResult | null>(null);
  return (
    <>
      <p className="mb-4 text-sm text-fg-muted">Convert a raw score into its weighted marks.</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Max original marks"><Input type="number" value={v.maxOriginal} onChange={(e) => setV({ ...v, maxOriginal: e.target.value })} /></Field>
        <Field label="Max weightage"><Input type="number" value={v.maxWeightage} onChange={(e) => setV({ ...v, maxWeightage: e.target.value })} /></Field>
        <Field label="Marks obtained"><Input type="number" value={v.obtained} onChange={(e) => setV({ ...v, obtained: e.target.value })} /></Field>
      </div>
      <div className="mt-5 flex gap-3">
        <Button onClick={() => setResult(convertWeightage(Number(v.maxOriginal) || 0, Number(v.maxWeightage) || 0, Number(v.obtained) || 0))}>Convert</Button>
        <Button variant="ghost" onClick={() => { setV({ maxOriginal: "", maxWeightage: "", obtained: "" }); setResult(null); }}>Reset</Button>
      </div>
      <ResultCard result={result}>
        {result?.value != null && <SaveCalcButton calcType="weightage" payload={v} result={result.message} />}
      </ResultCard>
    </>
  );
}

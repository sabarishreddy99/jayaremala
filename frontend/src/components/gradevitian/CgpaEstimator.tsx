"use client";

import { useState } from "react";
import { estimateCGPA, type CalcResult } from "@/lib/gradevitian/calc";
import { Button, Card, Field, Input } from "@/components/gradevitian/ui";
import GVResultModal from "@/components/gradevitian/GVResultModal";
import SaveCalcButton from "@/components/gradevitian/SaveCalcButton";
import { usePersistentCalc } from "@/lib/gradevitian/usePersistentCalc";

export default function CgpaEstimator() {
  const [v, setV] = usePersistentCalc("cgpa_estimator", { target: "", current: "", creditsCompleted: "", creditsTaken: "" });
  const [result, setResult] = useState<CalcResult | null>(null);
  const num = (k: keyof typeof v) => (v[k] === "" ? 0 : Number(v[k]));

  return (
    <Card>
      <p className="mb-4 text-sm text-fg-muted">
        Find the minimum GPA you need next semester to reach your target CGPA.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Target CGPA"><Input type="number" step="0.01" value={v.target} onChange={(e) => setV({ ...v, target: e.target.value })} /></Field>
        <Field label="Current CGPA"><Input type="number" step="0.01" value={v.current} onChange={(e) => setV({ ...v, current: e.target.value })} /></Field>
        <Field label="Credits completed so far"><Input type="number" value={v.creditsCompleted} onChange={(e) => setV({ ...v, creditsCompleted: e.target.value })} /></Field>
        <Field label="Credits you'll take next sem"><Input type="number" value={v.creditsTaken} onChange={(e) => setV({ ...v, creditsTaken: e.target.value })} /></Field>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button onClick={() => setResult(estimateCGPA({ target: num("target"), current: num("current"), creditsCompleted: num("creditsCompleted"), creditsTaken: num("creditsTaken") }))}>
          Estimate
        </Button>
        <Button variant="ghost" onClick={() => { setV({ target: "", current: "", creditsCompleted: "", creditsTaken: "" }); setResult(null); }}>Reset</Button>
        {result?.value != null && <SaveCalcButton calcType="cgpa_estimator" payload={v} result={result.message} />}
      </div>
      <GVResultModal result={result} onClose={() => setResult(null)}>
        {result?.value != null && <SaveCalcButton calcType="cgpa_estimator" payload={v} result={result.message} />}
      </GVResultModal>
    </Card>
  );
}

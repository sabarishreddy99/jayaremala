"use client";

import { useState } from "react";
import { attendanceFmt1, attendanceFmt2, type CalcResult } from "@/lib/gradevitian/calc";
import { Button, Card, Field, Input, Segmented } from "@/components/gradevitian/ui";
import GVResultModal from "@/components/gradevitian/GVResultModal";
import AttendanceBar from "@/components/gradevitian/AttendanceBar";
import SaveCalcButton from "@/components/gradevitian/SaveCalcButton";
import { usePersistentCalc } from "@/lib/gradevitian/usePersistentCalc";

export default function AttendanceCalculator() {
  const [mode, setMode] = useState<"fmt1" | "fmt2">("fmt1");
  return (
    <Card>
      <div className="mb-6">
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: "fmt1", label: "Present & absent" },
            { value: "fmt2", label: "Total & one count" },
          ]}
        />
      </div>
      {mode === "fmt1" ? <Fmt1 /> : <Fmt2 />}
    </Card>
  );
}

function Fmt1() {
  const [v, setV] = usePersistentCalc("attendance_fmt1", { present: "", absent: "" });
  const [result, setResult] = useState<CalcResult | null>(null);

  return (
    <>
      <p className="mb-4 text-sm text-fg-muted">Enter how many classes you attended and how many you missed.</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Classes present"><Input type="number" min={0} value={v.present} onChange={(e) => setV({ ...v, present: e.target.value })} /></Field>
        <Field label="Classes absent"><Input type="number" min={0} value={v.absent} onChange={(e) => setV({ ...v, absent: e.target.value })} /></Field>
      </div>
      <div className="mt-5 flex gap-3">
        <Button onClick={() => setResult(attendanceFmt1(Number(v.present) || 0, Number(v.absent) || 0))}>Calculate</Button>
        <Button variant="ghost" onClick={() => { setV({ present: "", absent: "" }); setResult(null); }}>Reset</Button>
      </div>
      <GVResultModal result={result} onClose={() => setResult(null)}>
        {result?.value != null && <AttendanceBar pct={result.value} />}
        {result?.value != null && <SaveCalcButton calcType="attendance" payload={v} result={result.message} />}
      </GVResultModal>
    </>
  );
}

function Fmt2() {
  const [v, setV] = usePersistentCalc("attendance_fmt2", { total: "", present: "", absent: "" });
  const [result, setResult] = useState<CalcResult | null>(null);

  return (
    <>
      <p className="mb-4 text-sm text-fg-muted">
        Enter the total classes held, then fill in <em>either</em> classes present <em>or</em> classes absent — not both.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Total classes"><Input type="number" min={1} value={v.total} onChange={(e) => setV({ ...v, total: e.target.value })} /></Field>
        <Field label="Classes present"><Input type="number" min={0} value={v.present} disabled={v.absent !== ""} onChange={(e) => setV({ ...v, present: e.target.value })} /></Field>
        <Field label="Classes absent"><Input type="number" min={0} value={v.absent} disabled={v.present !== ""} onChange={(e) => setV({ ...v, absent: e.target.value })} /></Field>
      </div>
      <div className="mt-5 flex gap-3">
        <Button onClick={() => setResult(attendanceFmt2(Number(v.total), v.present === "" ? "" : Number(v.present), v.absent === "" ? "" : Number(v.absent)))}>Calculate</Button>
        <Button variant="ghost" onClick={() => { setV({ total: "", present: "", absent: "" }); setResult(null); }}>Reset</Button>
      </div>
      <GVResultModal result={result} onClose={() => setResult(null)}>
        {result?.value != null && <AttendanceBar pct={result.value} />}
        {result?.value != null && <SaveCalcButton calcType="attendance" payload={v} result={result.message} />}
      </GVResultModal>
    </>
  );
}

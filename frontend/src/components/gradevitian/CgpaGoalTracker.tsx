"use client";

import { useState } from "react";
import { projectTrajectory, type CalcResult } from "@/lib/gradevitian/calc";
import { Button, Card, Field, Input } from "@/components/gradevitian/ui";
import GVResultModal from "@/components/gradevitian/GVResultModal";
import SaveCalcButton from "@/components/gradevitian/SaveCalcButton";
import { usePersistentCalc } from "@/lib/gradevitian/usePersistentCalc";

interface GoalForm {
  current: number | "";
  creditsCompleted: number | "";
  target: number | "";
  semsRemaining: number | "";
  creditsPerSem: number | "";
}

const initial: GoalForm = { current: "", creditsCompleted: "", target: "", semsRemaining: "", creditsPerSem: 20 };

export default function CgpaGoalTracker() {
  const [form, setForm] = usePersistentCalc<GoalForm>("cgpa-goal", initial);
  const [result, setResult] = useState<CalcResult | null>(null);
  const [points, setPoints] = useState<number[]>([]);

  function set<K extends keyof GoalForm>(key: K, raw: string) {
    setForm((f) => ({ ...f, [key]: raw === "" ? "" : Number(raw) }));
  }

  function calculate() {
    const t = projectTrajectory({
      current: Number(form.current),
      creditsCompleted: Number(form.creditsCompleted),
      target: Number(form.target),
      semsRemaining: Number(form.semsRemaining),
      creditsPerSem: Number(form.creditsPerSem),
    });
    setResult(t.result);
    setPoints(t.points);
  }

  const target = Number(form.target) || 10;
  const maxY = 10;

  return (
    <Card>
      <p className="mb-4 text-sm text-fg-muted">
        Set your dream CGPA and see the GPA you&apos;ll need each remaining semester — and whether
        you&apos;re on track to get there.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Current CGPA">
          <Input type="number" min={0} max={10} step="0.01" value={form.current} onChange={(e) => set("current", e.target.value)} placeholder="e.g. 8.2" />
        </Field>
        <Field label="Credits completed">
          <Input type="number" min={0} value={form.creditsCompleted} onChange={(e) => set("creditsCompleted", e.target.value)} placeholder="e.g. 90" />
        </Field>
        <Field label="Target CGPA">
          <Input type="number" min={0} max={10} step="0.01" value={form.target} onChange={(e) => set("target", e.target.value)} placeholder="e.g. 9.0" />
        </Field>
        <Field label="Semesters remaining">
          <Input type="number" min={1} max={14} value={form.semsRemaining} onChange={(e) => set("semsRemaining", e.target.value)} placeholder="e.g. 4" />
        </Field>
        <Field label="Credits per semester" hint="Typical full load is ~18–22">
          <Input type="number" min={1} max={40} value={form.creditsPerSem} onChange={(e) => set("creditsPerSem", e.target.value)} placeholder="e.g. 20" />
        </Field>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Button onClick={calculate}>See my trajectory</Button>
        {result?.value != null && (
          <SaveCalcButton calcType="cgpa-goal" payload={{ ...form } as Record<string, number | "">} result={result.message} />
        )}
      </div>

      {/* Trajectory chart */}
      {points.length > 1 && (
        <div className="mt-6">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-fg-subtle">Projected CGPA by semester</p>
          <div className="flex items-end gap-1.5" style={{ height: 120 }}>
            {points.map((p, i) => (
              <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
                <span className="font-mono text-[10px] tabular-nums text-fg-muted">{p.toFixed(2)}</span>
                <div
                  className={`w-full rounded-t ${p >= target ? "bg-emerald-500/80" : "bg-accent/70"}`}
                  style={{ height: `${Math.max(4, (p / maxY) * 90)}px` }}
                  title={i === 0 ? "Now" : `After sem ${i}`}
                />
                <span className="text-[9px] text-fg-subtle">{i === 0 ? "Now" : `S${i}`}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 h-px w-full bg-border-subtle" />
          <p className="mt-1 text-center text-[10px] text-fg-subtle">Target: {target.toFixed(2)} CGPA</p>
        </div>
      )}

      <GVResultModal result={result} onClose={() => setResult(null)}>
        {result?.value != null && <SaveCalcButton calcType="cgpa-goal" payload={{ ...form } as Record<string, number | "">} result={result.message} />}
      </GVResultModal>
    </Card>
  );
}

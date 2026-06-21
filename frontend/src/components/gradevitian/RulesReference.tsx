import { Card } from "@/components/gradevitian/ui";
import GVLink from "@/components/gradevitian/GVLink";
import { regulations as r } from "@/lib/gradevitian/regulations";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[160px_1fr] sm:gap-4">
      <p className="text-[11px] font-bold uppercase tracking-widest text-fg-subtle">{label}</p>
      <div className="text-sm leading-relaxed text-fg-muted">{children}</div>
    </div>
  );
}

/** Authoritative VIT rules, rendered straight from the curated regulations.json
 *  (scraped from the official FFCS Academic Regulations). */
export default function RulesReference() {
  return (
    <div className="space-y-6">
      {/* Grade scale */}
      <Card>
        <h2 className="mb-3 text-base font-bold text-fg">Grade scale</h2>
        <div className="overflow-hidden rounded-xl border border-border-subtle">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface/60 text-left text-[11px] uppercase tracking-wider text-fg-subtle">
                <th className="px-3 py-2 font-semibold">Grade</th>
                <th className="px-3 py-2 font-semibold">Points</th>
                <th className="px-3 py-2 font-semibold">Marks</th>
                <th className="px-3 py-2 font-semibold">Meaning</th>
              </tr>
            </thead>
            <tbody>
              {r.grade_scale.map((g) => (
                <tr key={g.grade} className="border-t border-border-subtle">
                  <td className="px-3 py-2 font-bold text-accent">{g.grade}</td>
                  <td className="px-3 py-2 font-mono tabular-nums text-fg">{g.points}</td>
                  <td className="px-3 py-2 font-mono tabular-nums text-fg-muted">{g.min_marks === null ? "—" : `≥ ${g.min_marks}`}</td>
                  <td className="px-3 py-2 text-fg-muted">{g.remark}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-fg-subtle">
          Pass grades: {r.pass_grades.join(", ")}. Special: {r.special_grades.map((s) => `${s.grade} (${s.remark})`).join("; ")}.
        </p>
      </Card>

      {/* Attendance */}
      <Card>
        <h2 className="mb-1 text-base font-bold text-fg">Attendance</h2>
        <Row label="Minimum">{r.attendance.minimum_percent}% per course ({r.attendance.expected_percent}% expected)</Row>
        <Row label="If you fall short">{r.attendance.consequence}</Row>
        <Row label="Relaxation">{r.attendance.relaxation}</Row>
      </Card>

      {/* GPA / CGPA */}
      <Card>
        <h2 className="mb-1 text-base font-bold text-fg">GPA &amp; CGPA</h2>
        <Row label="GPA"><span className="font-mono text-fg">{r.gpa.formula}</span><br />{r.gpa.description}</Row>
        <Row label="CGPA"><span className="font-mono text-fg">{r.cgpa.formula}</span><br />{r.cgpa.rounding}</Row>
        <Row label="Percentage">{r.cgpa.percentage_equivalent}</Row>
      </Card>

      {/* Academic standing + credits */}
      <Card>
        <h2 className="mb-1 text-base font-bold text-fg">Academic standing &amp; credits</h2>
        <Row label={`CGPA < ${r.academic_standing.probation_cgpa_below}`}>{r.academic_standing.rule}</Row>
        <Row label="Credit limits">{r.credit_limits.note}</Row>
      </Card>

      {/* Re-exams */}
      <Card>
        <h2 className="mb-1 text-base font-bold text-fg">Missing an exam</h2>
        <Row label="Re-CAT">{r.reexam.re_cat}</Row>
        <Row label="Re-FAT">{r.reexam.re_fat}</Row>
      </Card>

      {/* FFCS + Honours */}
      <Card>
        <h2 className="mb-1 text-base font-bold text-fg">FFCS &amp; Honours</h2>
        <Row label="FFCS">{r.ffcs.description}<div className="mt-2 flex flex-wrap gap-1.5">{r.ffcs.categories.map((c) => (<span key={c} className="rounded-full bg-surface/60 px-2.5 py-1 text-[11px] text-fg-muted">{c}</span>))}</div></Row>
        <Row label="Honours">{r.honours.description}</Row>
      </Card>

      <p className="text-center text-xs text-fg-subtle">
        Sourced from the{" "}
        <a href={r.source.url} target="_blank" rel="noopener noreferrer" className="text-accent underline">
          {r.source.title}
        </a>{" "}
        ({r.version}). Always confirm critical decisions with your school office.{" "}
        <GVLink href="/ask" className="text-accent underline">Ask the Rulebook →</GVLink>
      </p>
    </div>
  );
}

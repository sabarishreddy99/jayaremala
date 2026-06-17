"use client";

import { useGVAuth } from "@/components/gradevitian/GVAuthProvider";
import { usePersistentCalc } from "@/lib/gradevitian/usePersistentCalc";
import { Field } from "@/components/gradevitian/ui";

const QUOTES = [
  "Small steps every day add up to big results.",
  "Your only competition is who you were last semester.",
  "Discipline beats motivation — just show up.",
  "Aim for progress, not perfection.",
  "The best time to start was yesterday. The next best is now.",
  "Dream big, study smart, stay consistent.",
  "A 9-pointer is built one assignment at a time.",
];

const textareaCls =
  "w-full rounded-xl border border-border bg-surface-raised/60 px-3.5 py-2.5 text-fg outline-none transition-all duration-200 focus:border-accent focus:bg-surface-raised focus:ring-4 focus:ring-accent/15 placeholder:text-fg-faint";

/** Per-user inspirational notes + semester goals. Auto-saves to the account on edit
 *  (reuses the calc-state store under the "notes" key). Logged-in users only. */
export default function GVNotes() {
  const { user } = useGVAuth();
  const [v, setV] = usePersistentCalc("notes", { goal: "", notes: "" });

  if (!user) return null;
  const firstName = user.name.split(" ")[0];
  const quote = QUOTES[new Date().getDate() % QUOTES.length];

  return (
    <div className="overflow-hidden rounded-3xl border border-border-subtle bg-gradient-to-br from-accent/[0.1] to-transparent p-6 sm:p-8">
      <div className="flex items-center gap-3.5">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent text-accent-fg shadow-sm shadow-accent/30">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" />
          </svg>
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-bold tracking-tight text-fg">Your space, {firstName}</h2>
          <p className="truncate text-sm italic text-fg-muted">&ldquo;{quote}&rdquo;</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field
          label={
            <span className="inline-flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className="text-accent"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></svg>
              Target for next semester
            </span>
          }
        >
          <textarea
            value={v.goal}
            onChange={(e) => setV({ ...v, goal: e.target.value })}
            rows={4}
            maxLength={1000}
            placeholder="e.g. Hit a 9.0 CGPA, ace DSA, stay above 85% attendance…"
            className={textareaCls}
          />
        </Field>
        <Field
          label={
            <span className="inline-flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="text-accent"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
              Notes to self
            </span>
          }
        >
          <textarea
            value={v.notes}
            onChange={(e) => setV({ ...v, notes: e.target.value })}
            rows={4}
            maxLength={2000}
            placeholder="Reminders, reflections, plans…"
            className={textareaCls}
          />
        </Field>
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-micro text-fg-subtle">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M20 6 9 17l-5-5" />
        </svg>
        Auto-saved to your account as you type.
      </p>
    </div>
  );
}

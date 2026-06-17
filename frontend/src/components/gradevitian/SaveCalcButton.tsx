"use client";

import { useState } from "react";
import { useGVAuth } from "@/components/gradevitian/GVAuthProvider";
import { apiSaveCalc } from "@/lib/gradevitian/auth";

/** Prominent "Save result" button shown to logged-in users — both inside the result
 *  popup and beside each calculator's Calculate/Reset. Persists the calculation to the
 *  account dashboard. Resets itself when a fresh result is computed. */
export default function SaveCalcButton({
  calcType,
  payload,
  result,
}: {
  calcType: string;
  payload: Record<string, unknown>;
  result: string;
}) {
  const { user, token } = useGVAuth();
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastResult, setLastResult] = useState(result);

  // Re-enable when a new result is computed (adjust-state-during-render pattern).
  if (result !== lastResult) {
    setLastResult(result);
    setState("idle");
  }

  if (!user || !token) return null;

  async function save() {
    setState("saving");
    try {
      await apiSaveCalc(token!, { calc_type: calcType, payload, result });
      setState("saved");
    } catch {
      setState("error");
    }
  }

  const label =
    state === "saved" ? "Saved" : state === "saving" ? "Saving…" : state === "error" ? "Retry save" : "Save result";

  return (
    <button
      onClick={save}
      disabled={state === "saving" || state === "saved"}
      className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-accent-fg shadow-sm shadow-accent/25 transition-all duration-200 hover:bg-accent-hover active:scale-[0.97] disabled:opacity-60 disabled:active:scale-100"
    >
      {state === "saved" ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20 6 9 17l-5-5" /></svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><path d="M17 21v-8H7v8M7 3v5h8" /></svg>
      )}
      {label}
    </button>
  );
}

"use client";

import { useState } from "react";
import { useGVAuth } from "@/components/gradevitian/GVAuthProvider";
import { apiSaveCalc } from "@/lib/gradevitian/auth";

/** Appears inside the result popup when the user is logged in. Persists the calculation
 *  so it shows up on their account dashboard. */
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

  return (
    <button
      onClick={save}
      disabled={state === "saving" || state === "saved"}
      className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-current/30 px-3 py-1 text-xs font-medium opacity-80 transition hover:opacity-100 disabled:opacity-60"
    >
      {state === "saved" ? "✓ Saved to your account" : state === "saving" ? "Saving…" : state === "error" ? "Couldn't save — retry" : "Save this result"}
    </button>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useGVAuth } from "@/components/gradevitian/GVAuthProvider";
import { apiGetCalcState, apiPutCalcState } from "@/lib/gradevitian/auth";

/**
 * A useState-like hook that, for logged-in users, autosaves a calculator's field
 * values to their account and restores them on next visit (any device).
 *
 * - Starts from `initial` (deterministic → no hydration mismatch in the static export).
 * - On mount, if signed in, loads the saved payload and applies it.
 * - On change, debounces and PUTs the latest payload. Saving is gated until the
 *   initial load completes so the empty default never clobbers stored values.
 * - Signed-out users get plain local state (nothing is persisted).
 */
export function usePersistentCalc<T>(calcType: string, initial: T) {
  const { token } = useGVAuth();
  const [state, setState] = useState<T>(initial);
  const loadedRef = useRef(false);

  // Load saved state once we know the auth token.
  useEffect(() => {
    if (!token) {
      loadedRef.current = true;
      return;
    }
    loadedRef.current = false;
    let cancelled = false;
    apiGetCalcState<T>(token, calcType)
      .then((res) => {
        if (!cancelled && res.payload != null) setState(res.payload);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) loadedRef.current = true;
      });
    return () => {
      cancelled = true;
    };
  }, [token, calcType]);

  // Debounced autosave after the initial load has settled.
  useEffect(() => {
    if (!token || !loadedRef.current) return;
    const id = setTimeout(() => {
      void apiPutCalcState(token, calcType, state).catch(() => {});
    }, 600);
    return () => clearTimeout(id);
  }, [state, token, calcType]);

  return [state, setState] as const;
}

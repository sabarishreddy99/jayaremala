"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "@/lib/api/client";

export type ReingestResult = {
  added: number;
  updated: number;
  unchanged: number;
  deleted: number;
  total: number;
  by_type?: Record<string, number>;
};

const POLL_MS = 1500;
const GIVE_UP_MS = 5 * 60 * 1000;

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("avocado_admin_token") ?? ""}` };
}

/**
 * Start a knowledge-base sync and follow it to the end.
 *
 * `run()` is incremental — only changed documents are re-embedded, usually in
 * under a second. `run({ full: true })` re-embeds everything in place (about a
 * minute; Avocado keeps answering from the existing index meanwhile).
 *
 * Polling is a timeout chain, so a slow response never overlaps the next poll;
 * it stops when the component unmounts and gives up after five minutes.
 */
export function useReingest(onDone?: () => void) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ReingestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [finishedAt, setFinishedAt] = useState<Date | null>(null);
  const alive = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const done = useRef(onDone);
  useEffect(() => { done.current = onDone; });

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const run = useCallback(async ({ full = false }: { full?: boolean } = {}) => {
    setRunning(true);
    setResult(null);
    setError(null);
    const fail = (msg: string) => { if (alive.current) { setError(msg); setRunning(false); } };
    try {
      const res = await fetch(`${API_BASE_URL}/admin/reingest${full ? "?force=true" : ""}`, {
        method: "POST",
        headers: authHeaders(),
      });
      if (!res.ok) return fail(res.status === 401 ? "Your session expired. Sign in again." : `Could not start (HTTP ${res.status}).`);
      // If another sync is already in flight ("already_running"), the polling
      // below simply follows that one to its result.
      await res.json();
    } catch {
      return fail("Could not reach the backend.");
    }

    const started = Date.now();
    const poll = async () => {
      if (!alive.current) return;
      if (Date.now() - started > GIVE_UP_MS) return fail("Still running after five minutes. Check the backend logs.");
      try {
        const sr = await fetch(`${API_BASE_URL}/admin/reingest/status`, { headers: authHeaders() });
        if (!sr.ok) return fail(`Status check failed (HTTP ${sr.status}).`);
        const s = await sr.json();
        if (!alive.current) return;
        if (s.running) {
          timer.current = setTimeout(poll, POLL_MS);
          return;
        }
        if (s.error) return fail(s.error);
        setResult(s.result ?? null);
        setFinishedAt(new Date());
        setRunning(false);
        done.current?.();
      } catch {
        fail("Lost contact with the backend while syncing.");
      }
    };
    timer.current = setTimeout(poll, 400);
  }, []);

  return { running, result, error, finishedAt, run };
}

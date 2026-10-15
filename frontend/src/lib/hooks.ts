"use client";

/**
 * Small hooks for reading browser-only state without a setState-in-effect.
 *
 * The site is a static export, so every client component is first rendered on
 * the server (or at build time) where `window`, storage and the clock are not
 * the visitor's. The old pattern — render a default, then `useEffect(() =>
 * setX(readBrowser()))` — costs an extra render and is what React's
 * set-state-in-effect rule flags. `useSyncExternalStore` is the supported way:
 * it renders the server value during hydration and the real value right after,
 * with no mismatch and no cascading effect.
 */
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/** False during SSR and hydration, true once running in the browser. */
export function useMounted(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

/**
 * A value read from the browser once (platform, feature support, the URL).
 * `read` must return a primitive or a stable reference.
 */
export function useClientValue<T>(read: () => T, serverValue: T): T {
  return useSyncExternalStore(noopSubscribe, read, () => serverValue);
}

// ── Storage-backed state ──────────────────────────────────────────────────────

type Area = "local" | "session";
const storageListeners = new Set<() => void>();

function subscribeStorage(cb: () => void) {
  storageListeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    storageListeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function area(which: Area): Storage | null {
  try {
    return which === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null; // blocked storage (private mode, sandboxed iframe)
  }
}

export function readStored(key: string, which: Area = "local"): string | null {
  try {
    return area(which)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeStored(key: string, value: string | null, which: Area = "local") {
  try {
    const s = area(which);
    if (value === null) s?.removeItem(key);
    else s?.setItem(key, value);
  } catch {
    /* storage blocked — the in-memory notify below still updates this tab */
  }
  storageListeners.forEach((l) => l());
}

/**
 * State persisted in local/session storage. Renders `fallback` on the server,
 * the stored value in the browser, and stays in sync across tabs.
 */
export function useStoredState(key: string, fallback: string, which: Area = "local"): [string, (v: string | null) => void] {
  const raw = useSyncExternalStore(subscribeStorage, () => readStored(key, which), () => null);
  const set = useCallback((v: string | null) => writeStored(key, v, which), [key, which]);
  return [raw ?? fallback, set];
}

// ── A ticking clock ───────────────────────────────────────────────────────────

/** Current time in ms, updated every `everyMs`; null during SSR/hydration. */
export function useNow(everyMs = 1000): number | null {
  return useSyncExternalStore(
    useCallback((cb: () => void) => {
      const t = setInterval(cb, everyMs);
      return () => clearInterval(t);
    }, [everyMs]),
    () => Math.floor(Date.now() / everyMs) * everyMs,
    () => null,
  );
}

// ── Load on mount ─────────────────────────────────────────────────────────────

/**
 * Run `load` once when the component mounts (the admin editors' "fetch my file
 * on arrival"). It runs on the next frame, so the loader's own `setLoading(true)`
 * is not a synchronous setState inside the effect, and the first paint is not
 * held up by the request. Always calls the latest `load`.
 */
export function useLoadOnMount(load: () => unknown, enabled = true): void {
  const latest = useRef(load);
  useEffect(() => {
    latest.current = load;
  });
  const enabledAtMount = useRef(enabled);
  useEffect(() => {
    if (!enabledAtMount.current) return;
    const id = requestAnimationFrame(() => { void latest.current(); });
    return () => cancelAnimationFrame(id);
  }, []);
}

import type Lenis from "lenis";

// Module-level singleton so any client component can access the Lenis instance
// without React context (avoids re-render on init and ordering issues).
let instance: Lenis | null = null;

export function setLenisInstance(lenis: Lenis | null) {
  instance = lenis;
}

export function getLenisInstance() {
  return instance;
}

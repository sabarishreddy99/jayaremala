"use client";

import { useEffect, useState } from "react";

/**
 * The gradeVITian app is served at two mount points from the SAME static export:
 *   - subdomain  gradevitian.jayaremala.com/…        → clean paths ("/gpa")
 *   - path form  jayaremala.com/gradevitian/…        → prefixed paths ("/gradevitian/gpa")
 *
 * Links therefore can't be hard-coded. This hook returns the prefix to prepend to an
 * internal href based on where the page is actually mounted. It starts as "" (clean,
 * matching the prerendered HTML so there's no hydration mismatch) and, after mount,
 * switches to "/gradevitian" only when the browser is under that path.
 */
export function useGvBase(): string {
  const [base, setBase] = useState("");
  useEffect(() => {
    // Defer the read off the synchronous effect body. The prefix only affects link
    // hrefs, so a microtask delay is invisible — and it keeps this out of the
    // set-state-in-effect cascade the linter (rightly) warns about elsewhere.
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled && window.location.pathname.startsWith("/gradevitian")) {
        setBase("/gradevitian");
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return base;
}

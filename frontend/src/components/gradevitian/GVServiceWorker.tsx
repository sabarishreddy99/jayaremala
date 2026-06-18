"use client";

import { useEffect } from "react";

/**
 * Registers the gradeVITian service worker so the site is installable as a PWA.
 *
 * Scope-aware: on the production subdomain the app lives at the root ("/cgpa",
 * "/gpa", …) and nginx also exposes the worker at "/sw.js", so we register there
 * with root scope. On the path-form mount (/gradevitian/…) we register the worker
 * from its real public path with that narrower scope. Skipped on localhost so the
 * dev server's HMR is never shadowed by a cache.
 */
export default function GVServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const host = location.hostname;
    if (host === "localhost" || host === "127.0.0.1") return;

    const pathForm = location.pathname.startsWith("/gradevitian");
    const url = pathForm ? "/gradevitian/sw.js" : "/sw.js";
    const scope = pathForm ? "/gradevitian/" : "/";

    navigator.serviceWorker.register(url, { scope }).catch(() => {
      /* Non-fatal: install prompt simply won't be offered. */
    });
  }, []);

  return null;
}

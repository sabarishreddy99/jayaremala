"use client";

import { useEffect } from "react";

/**
 * Canonicalize to the subdomain: if the path-form is opened on the main domain
 * (jayaremala.com/gradevitian/…), bounce to gradevitian.jayaremala.com/… .
 * Never fires on the subdomain or localhost. Runs as a client effect rather than
 * a raw <script> tag — React doesn't execute inline scripts on the client, and the
 * `alternates.canonical` metadata already advertises the canonical URL to crawlers.
 */
export default function GVCanonicalRedirect() {
  useEffect(() => {
    const h = location.hostname;
    if (h !== "jayaremala.com" && h !== "www.jayaremala.com") return;
    const p = location.pathname.replace(/^\/gradevitian/, "") || "/";
    location.replace(`https://gradevitian.jayaremala.com${p}${location.search}${location.hash}`);
  }, []);

  return null;
}

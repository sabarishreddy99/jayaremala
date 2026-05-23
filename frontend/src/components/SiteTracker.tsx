"use client";

import { useEffect } from "react";
import { API_BASE_URL } from "@/lib/api/client";

// Server applies 10-min session dedup — no need for client-side guard.
// Fires on every hard page load; client-side navigations don't remount the root layout.
export default function SiteTracker() {
  useEffect(() => {
    fetch(`${API_BASE_URL}/stats/visit`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ page: window.location.pathname }),
    }).catch(() => {});
  }, []);
  return null;
}

"use client";

import { useEffect } from "react";
import { API_BASE_URL } from "@/lib/api/client";

// Fire once per browser session (tab). sessionStorage clears on tab close.
const SESSION_KEY = "itsjaya_visited";

export default function SiteTracker() {
  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;
    sessionStorage.setItem(SESSION_KEY, "1");
    fetch(`${API_BASE_URL}/stats/visit`, { method: "POST" }).catch(() => {});
  }, []);
  return null;
}

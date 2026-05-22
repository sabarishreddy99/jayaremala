"use client";

import { useEffect } from "react";
import { API_BASE_URL } from "@/lib/api/client";

export default function SiteTracker() {
  useEffect(() => {
    fetch(`${API_BASE_URL}/stats/visit`, { method: "POST" }).catch(() => {});
  }, []);
  return null;
}

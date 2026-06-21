"use client";

import { useEffect, useState } from "react";
import { useGVAuth } from "@/components/gradevitian/GVAuthProvider";
import { apiListAchievements } from "@/lib/gradevitian/auth";
import { badgeMeta, ALL_BADGES } from "@/lib/gradevitian/badges";
import { Card } from "@/components/gradevitian/ui";

export default function Badges() {
  const { token } = useGVAuth();
  const [earned, setEarned] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    apiListAchievements(token)
      .then((r) => { if (!cancelled) setEarned(new Set(r.badges.map((b) => b.badge))); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [token]);

  // Earned first, then locked catalog badges.
  const ids = [...earned, ...ALL_BADGES.filter((b) => !earned.has(b))];

  return (
    <Card>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-base font-bold text-fg">Milestones</h2>
        <span className="text-xs text-fg-subtle">{earned.size}/{ids.length} earned</span>
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {ids.map((id) => {
          const meta = badgeMeta(id);
          const got = earned.has(id);
          return (
            <div
              key={id}
              title={meta.description}
              className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition ${
                got ? "border-accent/30 bg-accent-light" : "border-border-subtle bg-surface/40 opacity-55 grayscale"
              }`}
            >
              <span className={`grid h-8 w-8 place-items-center [&>svg]:h-6 [&>svg]:w-6 ${got ? "text-accent" : "text-fg-muted"}`}>{meta.icon}</span>
              <span className={`text-[11px] font-semibold leading-tight ${got ? "text-fg" : "text-fg-muted"}`}>
                {meta.label}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] text-fg-subtle">
        Use the tools and visit daily to unlock more — your streak counts.
      </p>
    </Card>
  );
}

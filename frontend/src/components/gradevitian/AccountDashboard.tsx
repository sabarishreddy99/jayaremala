"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import GVLink from "@/components/gradevitian/GVLink";
import { useGVAuth } from "@/components/gradevitian/GVAuthProvider";
import { useGvBase } from "@/lib/gradevitian/useGvBase";
import {
  apiDeleteCalc,
  apiListCalcs,
  apiListNotifications,
  apiReadNotification,
  type GVNotification,
  type SavedCalc,
} from "@/lib/gradevitian/auth";
import { Card } from "@/components/gradevitian/ui";
import GVNotes from "@/components/gradevitian/GVNotes";
import Badges from "@/components/gradevitian/Badges";
import ScrollReveal from "@/components/ScrollReveal";

const CALC_LABELS: Record<string, string> = {
  gpa: "GPA", cgpa: "CGPA", instant_cgpa: "Instant CGPA", cgpa_estimator: "CGPA Estimator",
  attendance: "Attendance", grade_predictor: "Grade Predictor", weightage: "Weightage",
};

export default function AccountDashboard() {
  const { user, token, loading, logout } = useGVAuth();
  const router = useRouter();
  const base = useGvBase();
  const [calcs, setCalcs] = useState<SavedCalc[]>([]);
  const [notes, setNotes] = useState<GVNotification[]>([]);
  const [ready, setReady] = useState(false);

  // Redirect to login once we know there's no session.
  useEffect(() => {
    if (!loading && !user) router.replace(`${base}/login`);
  }, [loading, user, router, base]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void (async () => {
      const [c, n] = await Promise.all([
        apiListCalcs(token).catch(() => ({ calcs: [] })),
        apiListNotifications(token).catch(() => ({ notifications: [] })),
      ]);
      if (cancelled) return;
      setCalcs(c.calcs);
      setNotes(n.notifications);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function remove(id: number) {
    if (!token) return;
    await apiDeleteCalc(token, id).catch(() => {});
    setCalcs((prev) => prev.filter((c) => c.id !== id));
  }

  async function markRead(id: number) {
    if (!token) return;
    await apiReadNotification(token, id).catch(() => {});
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  }

  if (loading || !user) {
    return (
      <section className="mx-auto grid min-h-[60vh] max-w-3xl place-items-center px-4 text-fg-muted">
        <span className="animate-pulse">Loading your space…</span>
      </section>
    );
  }

  const initials = (user.name[0] ?? user.username[0] ?? "?").toUpperCase();
  const unread = notes.filter((n) => !n.is_read).length;
  const memberSince = new Date(user.created_at).toLocaleDateString(undefined, { month: "short", year: "2-digit" });

  return (
    <section className="relative mx-auto max-w-4xl px-4 py-12">
      <div className="gv-aurora opacity-70" aria-hidden />

      {/* Identity header */}
      <ScrollReveal>
        <div className="relative overflow-hidden rounded-3xl border border-border-subtle bg-gradient-to-br from-accent/[0.1] to-transparent p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-accent text-2xl font-bold text-accent-fg shadow-md shadow-accent/30">
                {initials}
              </div>
              <div>
                <h1 className="text-balance text-2xl font-bold tracking-[-0.02em] text-fg sm:text-3xl">Hi, {user.name.split(" ")[0]}.</h1>
                <p className="mt-0.5 text-fg-muted">@{user.username} · {user.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="rounded-full border border-border bg-surface/60 px-4 py-2 text-sm font-semibold text-fg backdrop-blur transition-all duration-200 hover:bg-surface-raised active:scale-[0.97]"
            >
              Log out
            </button>
          </div>

          {/* Stat tiles */}
          <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { label: "Saved", value: calcs.length },
              { label: "Unread", value: unread },
              { label: "Since", value: memberSince },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-border-subtle bg-surface/60 px-3 py-3 backdrop-blur sm:px-4">
                <p className="text-lg font-bold tabular-nums text-fg sm:text-2xl">{s.value}</p>
                <p className="mt-0.5 text-micro uppercase tracking-wide text-fg-subtle">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* Personal notes & goals */}
      <div className="mt-8">
        <GVNotes />
      </div>

      {/* Milestones */}
      <div className="mt-8">
        <Badges />
      </div>

      {/* Notifications */}
      <h2 className="mt-12 text-xl font-bold tracking-tight text-fg">Notifications</h2>
      <div className="mt-4 flex flex-col gap-3">
        {ready && notes.length === 0 && <p className="text-sm text-fg-muted">You&apos;re all caught up.</p>}
        {notes.map((n) => (
          <Card key={n.id} className={n.is_read ? "opacity-60" : ""}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-fg">{n.title}</p>
                {n.body ? <p className="mt-1 text-sm text-fg-muted">{n.body}</p> : null}
                <p className="mt-1 text-xs text-fg-subtle">{new Date(n.created_at).toLocaleString()}</p>
              </div>
              {!n.is_read && (
                <button onClick={() => markRead(n.id)} className="shrink-0 text-xs font-medium text-accent hover:underline">
                  Mark read
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Saved calculations */}
      <h2 className="mt-10 text-xl font-bold tracking-tight text-fg">Saved calculations</h2>
      <div className="mt-4 flex flex-col gap-3">
        {ready && calcs.length === 0 && (
          <p className="text-sm text-fg-muted">
            Nothing saved yet. Run a calculation and hit <em>Save this result</em> —
            try the <GVLink href="/cgpa" className="text-accent hover:underline">CGPA calculator</GVLink>.
          </p>
        )}
        {calcs.map((c) => (
          <Card key={c.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-block rounded-full bg-accent-light px-2.5 py-0.5 text-xs font-semibold text-accent">
                  {CALC_LABELS[c.calc_type] ?? c.calc_type}
                </span>
                <p className="mt-2 text-fg">{c.result}</p>
                <p className="mt-1 text-xs text-fg-subtle">{new Date(c.created_at).toLocaleString()}</p>
              </div>
              <button onClick={() => remove(c.id)} className="shrink-0 text-xs font-medium text-rose-600 hover:underline dark:text-rose-400">
                Delete
              </button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

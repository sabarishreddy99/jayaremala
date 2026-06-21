"use client";

import { useState } from "react";
import { Button, Card } from "@/components/gradevitian/ui";
import GVLink from "@/components/gradevitian/GVLink";
import { apiAskRulebook, type RulebookAnswer } from "@/lib/gradevitian/auth";
import { useGVAuth } from "@/components/gradevitian/GVAuthProvider";

const SUGGESTIONS = [
  "What is the minimum attendance requirement?",
  "How is CGPA converted to a percentage?",
  "When can I apply for a Re-FAT?",
  "What does an 'N' grade mean?",
  "What does the code of conduct say about ragging?",
  "What counts as malpractice in an exam?",
];

const LockIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export default function AskRulebook() {
  const { token, loading: authLoading } = useGVAuth();
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<RulebookAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  async function ask(question: string) {
    const text = question.trim();
    if (!token || text.length < 3 || loading) return;
    setLoading(true);
    setError(null);
    setRes(null);
    try {
      const r = await apiAskRulebook(token, text);
      setRes(r);
      if (typeof r.remaining === "number") setRemaining(r.remaining);
    } catch (e) {
      // The API surfaces FastAPI's `detail` — incl. the friendly 5/hour limit message.
      setError(e instanceof Error ? e.message : "Couldn't reach the rulebook just now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Locked state — premium, signed-in only ──────────────────────────────────
  if (!authLoading && !token) {
    return (
      <Card className="text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-accent-light text-accent">
          <LockIcon />
        </div>
        <p className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent-light px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-accent">
          Members-only feature
        </p>
        <h2 className="mt-3 text-lg font-bold text-fg">Ask the Rulebook is for account holders.</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-fg-muted">
          It runs a real AI over VIT&apos;s official regulations to answer your question in seconds —
          so it&apos;s reserved for signed-in students (5 questions an hour). Creating an account is
          free and takes a moment.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <GVLink href="/signup" className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-fg shadow-sm shadow-accent/25 transition-all duration-200 hover:bg-accent-hover active:scale-[0.97]">
            Create a free account
          </GVLink>
          <GVLink href="/login" className="rounded-full border border-border bg-surface/60 px-6 py-3 text-sm font-semibold text-fg transition-all duration-200 hover:bg-surface-raised active:scale-[0.97]">
            Log in
          </GVLink>
        </div>
      </Card>
    );
  }

  // ── Signed-in: the assistant ────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent-light px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-accent">
          <span className="text-accent"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M12 3l1.6 4.6L18 9.2l-4.4 1.6L12 15l-1.6-4.2L6 9.2l4.4-1.6z" /></svg></span>
          Premium · enabled
        </span>
        {remaining !== null && (
          <span className="text-[11px] text-fg-subtle">{remaining} of 5 questions left this hour</span>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); ask(q); }} className="flex flex-col gap-2.5 sm:flex-row">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ask anything about VIT's academic rules…"
          className="flex-1 rounded-xl border border-border bg-surface/60 px-4 py-3 text-sm text-fg outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <Button type="submit" disabled={loading || q.trim().length < 3}>
          {loading ? "Looking it up…" : "Ask"}
        </Button>
      </form>

      {!res && !loading && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => { setQ(s); ask(s); }}
              className="rounded-full border border-border-subtle bg-surface/60 px-3 py-1.5 text-xs font-medium text-fg-muted transition hover:border-accent/40 hover:text-fg"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

      {res && (
        <Card className="space-y-4">
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-fg">{res.answer}</p>
          {res.sources.length > 0 && (
            <div className="border-t border-border-subtle pt-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-fg-subtle">From the regulations</p>
              <div className="flex flex-wrap gap-1.5">
                {res.sources.map((s, i) => (
                  <span key={`${s.section}-${i}`} className="inline-flex items-center gap-1.5 rounded-full bg-accent-light px-2.5 py-1 text-[11px] font-medium text-accent">
                    {s.source && <span className="rounded bg-accent/15 px-1 text-[8px] font-bold uppercase tracking-wide">{s.source === "Student Code of Conduct" ? "Conduct" : "Regs"}</span>}
                    {s.section && <span className="font-mono opacity-70">{s.section}</span>}
                    {s.heading}
                  </span>
                ))}
              </div>
            </div>
          )}
          <p className="text-[11px] text-fg-subtle">
            Grounded in VIT&apos;s official Academic Regulations &amp; Student Code of Conduct. Always confirm anything critical with your school office.
          </p>
        </Card>
      )}
    </div>
  );
}

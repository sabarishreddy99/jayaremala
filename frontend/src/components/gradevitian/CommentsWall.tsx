"use client";

import { useEffect, useState } from "react";
import { useGVAuth } from "@/components/gradevitian/GVAuthProvider";
import { apiAddComment, apiListComments, type GVComment } from "@/lib/gradevitian/auth";
import { Button, Card, Field, Input } from "@/components/gradevitian/ui";

export default function CommentsWall() {
  const { user, token } = useGVAuth();
  const [comments, setComments] = useState<GVComment[]>([]);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiListComments().then((r) => setComments(r.comments)).catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const res = await apiAddComment({ name: user?.name ?? name, body }, token);
      if (res.published && res.comment) {
        setComments((prev) => [res.comment as GVComment, ...prev]);
        setNotice("Posted — thanks for the feedback!");
      } else {
        // Held by moderation (abuse/spam/borderline) — don't reveal specifics.
        setNotice("Thanks! Your comment was submitted and is awaiting review.");
      }
      setBody("");
      if (!user) setName("");
    } catch (err) {
      setError((err as Error).message || "Couldn't post your comment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card>
        <h2 className="text-lg font-bold text-fg">Leave feedback</h2>
        <p className="mt-1 text-sm text-fg-muted">
          {user ? `Posting as ${user.name}.` : "Tell us what you think — no account needed."}
        </p>
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-accent/30 bg-accent/[0.07] px-3 py-2 text-sm text-fg">
          <span aria-hidden>✨</span>
          <span>Share your feedback — you could be the one featured in our testimonials soon!</span>
        </p>
        <form onSubmit={submit} className="mt-4 flex flex-col gap-4">
          {error && <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">{error}</p>}
          {notice && <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">{notice}</p>}
          {!user && <Field label="Your name"><Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} /></Field>}
          <Field label="Comment">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              maxLength={1000}
              rows={4}
              className="w-full rounded-xl border border-border bg-surface-raised/60 px-3.5 py-2.5 text-fg outline-none transition-all duration-200 focus:border-accent focus:bg-surface-raised focus:ring-4 focus:ring-accent/15"
            />
          </Field>
          <Button type="submit" disabled={busy}>{busy ? "Posting…" : "Post comment"}</Button>
        </form>
      </Card>

      <div>
        <h2 className="text-lg font-bold text-fg">What people say</h2>
        <div className="mt-4 flex flex-col gap-3">
          {comments.length === 0 && <p className="text-sm text-fg-muted">Be the first to leave a comment.</p>}
          {comments.map((c) => (
            <Card key={c.id} className="p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-fg">{c.name}</p>
                <p className="text-xs text-fg-subtle">{new Date(c.created_at).toLocaleDateString()}</p>
              </div>
              <p className="mt-1 text-sm text-fg-muted">{c.body}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

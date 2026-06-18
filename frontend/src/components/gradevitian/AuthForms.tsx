"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import GVLink from "@/components/gradevitian/GVLink";
import { useGVAuth } from "@/components/gradevitian/GVAuthProvider";
import { useGvBase } from "@/lib/gradevitian/useGvBase";
import { apiForgotPassword, apiResetPassword } from "@/lib/gradevitian/auth";
import { Button, Card, Field, Input } from "@/components/gradevitian/ui";

function ErrorNote({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <p
      key={msg}
      role="alert"
      className="animate-gv-shake flex items-start gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2.5 text-sm font-medium text-rose-700 dark:text-rose-300"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0" aria-hidden>
        <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
      </svg>
      <span>{msg}</span>
    </p>
  );
}

function FormShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="relative grid min-h-[calc(100vh-8rem)] place-items-center overflow-hidden px-4 py-14">
      <div className="gv-aurora" aria-hidden />
      <div className="hero-dot-grid pointer-events-none absolute inset-0 opacity-[0.35]" aria-hidden />
      <div className="relative w-full max-w-md animate-gv-pop">
        <div
          className="mb-6 text-center text-xl font-normal tracking-widest text-fg"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
        >
          grade<span className="text-accent">VIT</span>ian
        </div>
        <Card>
          <h1 className="text-2xl font-bold tracking-[-0.02em] text-fg">{title}</h1>
          {subtitle ? <p className="mt-1.5 text-balance text-sm leading-relaxed text-fg-muted">{subtitle}</p> : null}
          <div className="mt-6 flex flex-col gap-4">{children}</div>
        </Card>
      </div>
    </section>
  );
}

export function LoginForm() {
  const { login } = useGVAuth();
  const router = useRouter();
  const base = useGvBase();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(identifier, password);
      router.push(`${base}/account`);
    } catch (err) {
      setError((err as Error).message || "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormShell title="Log in" subtitle="Welcome back, VITian — your saved work is right where you left it.">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <ErrorNote msg={error} />
        <Field label="Email or username"><Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" required /></Field>
        <Field label="Password"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></Field>
        <Button type="submit" disabled={busy}>{busy ? "Logging in…" : "Log in"}</Button>
      </form>
      <div className="flex justify-between text-sm text-fg-muted">
        <GVLink href="/forgot-password" className="hover:text-fg">Forgot password?</GVLink>
        <GVLink href="/signup" className="hover:text-fg">Create account</GVLink>
      </div>
    </FormShell>
  );
}

export function SignupForm() {
  const { signup } = useGVAuth();
  const router = useRouter();
  const base = useGvBase();
  const [v, setV] = useState({ name: "", email: "", username: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (v.password !== v.confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      await signup({ name: v.name, email: v.email, username: v.username, password: v.password });
      router.push(`${base}/account`);
    } catch (err) {
      setError((err as Error).message || "Sign up failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormShell title="Make it yours" subtitle="Free forever. Join 20K+ VITians and keep your calculations, goals and grades on every device.">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <ErrorNote msg={error} />
        <Field label="Name"><Input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} required /></Field>
        <Field label="Email"><Input type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} autoComplete="email" required /></Field>
        <Field label="Username" hint="Letters, numbers, . _ @"><Input value={v.username} onChange={(e) => setV({ ...v, username: e.target.value })} autoComplete="username" required minLength={3} /></Field>
        <Field label="Password"><Input type="password" value={v.password} onChange={(e) => setV({ ...v, password: e.target.value })} autoComplete="new-password" required minLength={6} /></Field>
        <Field label="Confirm password"><Input type="password" value={v.confirm} onChange={(e) => setV({ ...v, confirm: e.target.value })} autoComplete="new-password" required /></Field>
        <Button type="submit" disabled={busy}>{busy ? "Creating…" : "Sign up"}</Button>
      </form>
      <p className="text-sm text-fg-muted">Already have an account? <GVLink href="/login" className="text-accent hover:underline">Log in</GVLink></p>
    </FormShell>
  );
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await apiForgotPassword(email);
    } catch {
      /* always show the same confirmation — no account enumeration */
    } finally {
      setBusy(false);
      setSent(true);
    }
  }

  return (
    <FormShell title="Reset your password" subtitle="We'll email you a reset link if the account exists.">
      {sent ? (
        <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
          If that email is registered, a reset link is on its way. Check your inbox.
        </p>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
          <Button type="submit" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</Button>
        </form>
      )}
      <GVLink href="/login" className="text-sm text-fg-muted hover:text-fg">Back to log in</GVLink>
    </FormShell>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const base = useGvBase();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      await apiResetPassword(token, password);
      setDone(true);
      setTimeout(() => router.push(`${base}/login`), 1800);
    } catch (err) {
      setError((err as Error).message || "This reset link is invalid or expired.");
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return <FormShell title="Reset link missing"><ErrorNote msg="This link is incomplete. Request a new reset email." /><GVLink href="/forgot-password" className="text-sm text-accent hover:underline">Request a new link</GVLink></FormShell>;
  }

  return (
    <FormShell title="Choose a new password">
      {done ? (
        <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
          Password updated! Redirecting you to log in…
        </p>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <ErrorNote msg={error} />
          <Field label="New password"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} /></Field>
          <Field label="Confirm new password"><Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required /></Field>
          <Button type="submit" disabled={busy}>{busy ? "Updating…" : "Update password"}</Button>
        </form>
      )}
    </FormShell>
  );
}

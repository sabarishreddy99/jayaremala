"use client";

import { useState, useEffect, useCallback } from "react";
import emailjs from "@emailjs/browser";
import Link from "next/link";
import { profile } from "@/data/profile";
import BookingRail from "@/components/portfolio/BookingRail";

type ToastType = "success" | "warning" | "error";

interface Toast {
  id: number;
  type: ToastType;
  title: string;
  body: string;
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 10);
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(toast.id), 300);
    }, 4000);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [toast.id, onDismiss]);

  const styles: Record<ToastType, { wrapper: string; icon: string; iconPath: string }> = {
    success: {
      wrapper: "border-accent/30 bg-surface",
      icon: "text-accent bg-accent-light",
      iconPath: "M20 6L9 17l-5-5",
    },
    warning: {
      wrapper: "border-amber-200 dark:border-amber-800 bg-surface",
      icon: "text-amber-600 bg-amber-50 dark:bg-amber-950",
      iconPath: "M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z",
    },
    error: {
      wrapper: "border-red-200 dark:border-red-800 bg-surface",
      icon: "text-red-500 bg-red-50 dark:bg-red-950",
      iconPath: "M18 6L6 18M6 6l12 12",
    },
  };

  const s = styles[toast.type];

  return (
    <div
      className={`flex items-start gap-3 rounded border px-4 py-3.5 shadow-lg transition-all duration-300 ${s.wrapper} ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${s.icon}`}>
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d={s.iconPath} />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-fg">{toast.title}</p>
        <p className="text-xs text-fg-subtle mt-0.5">{toast.body}</p>
      </div>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onDismiss(toast.id), 300); }}
        aria-label="Dismiss notification"
        className="ml-1 shrink-0 text-fg-faint hover:text-fg-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [nextId, setNextId] = useState(0);

  const pushToast = useCallback((type: ToastType, title: string, body: string) => {
    setToasts((prev) => [...prev, { id: nextId, type, title, body }]);
    setNextId((n) => n + 1);
  }, [nextId]);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (sessionStorage.getItem("contact_sent") === "1") {
      pushToast("warning", "Already sent!", "Your message has already been sent this session. I'll get back to you soon.");
      return;
    }

    setSending(true);
    try {
      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
        { from_name: name, from_email: email, message },
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
      );
      sessionStorage.setItem("contact_sent", "1");
      pushToast("success", "Message sent!", "Thanks for reaching out, I'll get back to you soon.");
      setName("");
      setEmail("");
      setMessage("");
      setSubmitted(true);
    } catch {
      pushToast("error", "Something went wrong", "Please try again or email me directly.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Toast portal */}
      <div className="fixed bottom-6 right-4 z-50 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismissToast} />
        ))}
      </div>

      <section aria-label="Contact">
        {/* Two rails of equal standing, split by a column rule. Booking leads on
            mobile: it is the shorter thing to read, and the form's four fields
            would otherwise push the calendar below the fold. */}
        <div className="grid gap-10 md:grid-cols-2 md:gap-0">
          <div className="md:pr-10 lg:pr-14">
            <BookingRail />
          </div>

          <div aria-hidden className="chapter-rule md:hidden" />

          <div className="relative md:pl-10 lg:pl-14">
            <span
              aria-hidden
              className="absolute left-0 top-0 hidden h-full w-px bg-linear-to-b from-border-strong via-border to-transparent md:block"
            />
            {submitted ? (
              /* Confirmation lands inside this rail only. The booking rail
                 beside it stays live — someone who just wrote to me can still
                 take a slot in the same breath. */
              <div className="flex h-full flex-col">
                <h3 className="text-base font-semibold text-fg">Message sent</h3>
                <p className="mt-1.5 max-w-[46ch] text-sm leading-relaxed text-fg-subtle">
                  Thanks for reaching out — I&apos;ll get back to you soon. If you
                  would rather just talk, the calendar on the left is open.
                </p>
                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
                  <Link
                    href="/blog"
                    className="text-[13px] font-medium text-accent transition-colors hover:text-accent-hover"
                  >
                    Read the blog →
                  </Link>
                  <Link
                    href="/projects"
                    className="text-[13px] font-medium text-accent transition-colors hover:text-accent-hover"
                  >
                    See projects →
                  </Link>
                </div>
              </div>
            ) : (
          <>
        <h3 className="text-base font-semibold text-fg">Send a message</h3>
        <p className="mt-1.5 max-w-[46ch] text-sm leading-relaxed text-fg-subtle">
          Not ready for a call, or have a question first? This goes straight to
          my inbox.
        </p>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="contact-name" className="mb-1.5 block text-xs font-medium text-fg-subtle">Name</label>
              <div className="rounded-chip border border-border bg-bg px-3.5 py-2.5 transition-colors focus-within:border-accent">
                <input
                  id="contact-name"
                  required
                  type="text"
                  autoComplete="name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent text-base text-fg placeholder:text-fg-faint focus:outline-none sm:text-sm"
                />
              </div>
            </div>
            <div>
              <label htmlFor="contact-email" className="mb-1.5 block text-xs font-medium text-fg-subtle">Email</label>
              <div className="rounded-chip border border-border bg-bg px-3.5 py-2.5 transition-colors focus-within:border-accent">
                <input
                  id="contact-email"
                  required
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-base text-fg placeholder:text-fg-faint focus:outline-none sm:text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="contact-message" className="mb-1.5 block text-xs font-medium text-fg-subtle">Message</label>
            <div className="rounded-chip border border-border bg-bg px-3.5 py-2.5 transition-colors focus-within:border-accent">
              <textarea
                id="contact-message"
                required
                rows={4}
                placeholder="What's on your mind?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full resize-none bg-transparent text-base leading-relaxed text-fg placeholder:text-fg-faint focus:outline-none sm:text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={sending}
            className="btn-avo inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? (
              <>
                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
                </svg>
                Sending…
              </>
            ) : (
              "Send message"
            )}
          </button>
        </form>

          </>
            )}
          </div>
        </div>

        {/* Everything else that counts as reaching me. Spans both rails, so it
            survives either rail's success state. */}
        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-border-subtle pt-5">
          <a
            href={`mailto:${profile.email}`}
            className="text-[13px] font-medium text-fg-muted underline decoration-border underline-offset-4 transition-colors hover:text-fg hover:decoration-accent"
          >
            {profile.email}
          </a>
          {profile.linkedin && (
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] font-medium text-fg-muted transition-colors hover:text-fg"
            >
              LinkedIn
            </a>
          )}
          {profile.github && (
            <a
              href={profile.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] font-medium text-fg-muted transition-colors hover:text-fg"
            >
              GitHub
            </a>
          )}
          <a
            href={profile.resume}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-accent transition-colors hover:text-accent-hover"
          >
            Resume
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
              <path d="M7 17L17 7M17 7H7M17 7v10" />
            </svg>
          </a>
        </div>
      </section>
    </>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import emailjs from "@emailjs/browser";
import { profile } from "@/data/profile";

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
      wrapper: "border-indigo-200 bg-white",
      icon: "text-indigo-600 bg-indigo-50",
      iconPath: "M20 6L9 17l-5-5",
    },
    warning: {
      wrapper: "border-amber-200 bg-white",
      icon: "text-amber-600 bg-amber-50",
      iconPath: "M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z",
    },
    error: {
      wrapper: "border-red-200 bg-white",
      icon: "text-red-500 bg-red-50",
      iconPath: "M18 6L6 18M6 6l12 12",
    },
  };

  const s = styles[toast.type];

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-lg transition-all duration-300 ${s.wrapper} ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${s.icon}`}>
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d={s.iconPath} />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-zinc-900">{toast.title}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{toast.body}</p>
      </div>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onDismiss(toast.id), 300); }}
        className="ml-1 shrink-0 text-zinc-300 hover:text-zinc-500 transition-colors"
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
      pushToast("success", "Message sent!", "Thanks for reaching out — I'll get back to you soon.");
      setName("");
      setEmail("");
      setMessage("");
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

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8">
        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Get in Touch</h2>
        {profile.contact_description && (
          <p className="text-sm text-zinc-600 mb-6 max-w-md">{profile.contact_description}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Name</label>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 focus-within:border-indigo-300 focus-within:bg-white focus-within:shadow-sm transition-all">
                <input
                  required
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Email</label>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 focus-within:border-indigo-300 focus-within:bg-white focus-within:shadow-sm transition-all">
                <input
                  required
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Message</label>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 focus-within:border-indigo-300 focus-within:bg-white focus-within:shadow-sm transition-all">
              <textarea
                required
                rows={4}
                placeholder="What's on your mind?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full resize-none bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none leading-relaxed"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={sending}
            className="rounded-full bg-zinc-950 text-white px-6 py-2.5 text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {sending ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
                </svg>
                Sending…
              </>
            ) : (
              "Send Message"
            )}
          </button>
        </form>

        <div className="border-t border-zinc-100 pt-5 flex flex-wrap gap-3">
          <a
            href={`mailto:${profile.email}`}
            className="rounded-full border-2 border-zinc-950 bg-zinc-950 px-5 py-2 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors"
          >
            {profile.email}
          </a>
          {profile.linkedin && (
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border-2 border-zinc-300 px-5 py-2 text-sm font-semibold text-zinc-700 hover:border-zinc-950 hover:text-zinc-950 transition-colors"
            >
              LinkedIn
            </a>
          )}
          {profile.github && (
            <a
              href={profile.github}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border-2 border-zinc-300 px-5 py-2 text-sm font-semibold text-zinc-700 hover:border-zinc-950 hover:text-zinc-950 transition-colors"
            >
              GitHub
            </a>
          )}
          <a
            href={profile.resume}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border-2 border-indigo-200 bg-indigo-50 px-5 py-2 text-sm font-semibold text-indigo-700 hover:border-indigo-600 hover:bg-indigo-100 transition-colors inline-flex items-center gap-1.5"
          >
            Download Resume
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M7 17L17 7M17 7H7M17 7v10" />
            </svg>
          </a>
        </div>
      </section>
    </>
  );
}

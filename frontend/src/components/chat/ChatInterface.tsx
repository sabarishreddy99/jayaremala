"use client";

import { useEffect, useRef, useState, startTransition } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api/client";
import { saveMessages, loadMessages, clearSession } from "@/lib/session";
import { profile } from "@/data/profile";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import LoadingGame from "./LoadingGame";
import NavSuggestions, { detectNavLinks, NavLink } from "./NavSuggestions";

export interface Message {
  role: "user" | "assistant";
  content: string;
  navLinks?: NavLink[];
}

const WELCOME: Message = {
  role: "assistant",
  content:
    "Hi! I'm Avocado, Jaya's AI assistant. Ask me anything about his background, work experience, projects, or skills.",
};

const SUGGESTIONS = [
  { label: "Most impressive project?", full: "What's your most impressive project?" },
  { label: "AI & ML experience?", full: "Tell me about your AI and machine learning experience." },
  { label: "Education background?", full: "Walk me through your educational background." },
  { label: "Strongest tech stack?", full: "What's your strongest tech stack and languages?" },
  { label: "Can I see your resume?", full: "Can I see your resume?" },
];

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);

  // Load persisted messages after hydration to avoid SSR mismatch
  useEffect(() => {
    const saved = loadMessages();
    if (saved && saved.length > 0) {
      startTransition(() => setMessages([WELCOME, ...saved]));
    }
  }, []);
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [prefill, setPrefill] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  async function handleSend(text: string) {
    const userMsg: Message = { role: "user", content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setStreaming(true);
    setStreamingContent("");
    abortRef.current = new AbortController();

    try {
      const res = await fetch(`${API_BASE_URL}/ai/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages
            .filter((m) => m !== WELCOME)
            .slice(-10)
            .map((m) => ({ role: m.role, content: m.content })),
          message: text,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value, { stream: true }).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.token) { accumulated += data.token; setStreamingContent(accumulated); }
            if (data.done) break;
          } catch { /* partial chunk */ }
        }
      }

      const navLinks = detectNavLinks(text, accumulated);
      const content = accumulated.trim() || "Sorry, I couldn't generate a response. Please try again or reach Jaya directly at jr6421@nyu.edu.";
      const assistantMsg: Message = { role: "assistant", content, navLinks };
      const finalMessages = [...nextMessages, assistantMsg];
      setMessages(finalMessages);
      saveMessages(finalMessages.filter((m) => m !== WELCOME));
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setStreaming(false);
      setStreamingContent("");
    }
  }

  function handleClear() {
    clearSession();
    setMessages([WELCOME]);
  }

  const isInitial = messages.length === 1 && !streaming;

  return (
    <div className="flex flex-col h-full">

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-10 py-3 sm:py-4">
        <div className="mx-auto max-w-2xl space-y-4 sm:space-y-5">
          {messages.map((m, i) => (
            <div key={i}>
              <ChatMessage message={m} />
              {m.role === "assistant" && m.navLinks && m.navLinks.length > 0 && m !== WELCOME && (
                <div className="ml-10">
                  <NavSuggestions links={m.navLinks} />
                </div>
              )}
            </div>
          ))}

          {/* Suggestion chips — only on initial state */}
          {isInitial && (
            <div className="pt-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400 mb-3">
                Suggested
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.full}
                    onClick={() => setPrefill(s.full)}
                    className="group text-left rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md"
                  >
                    <span className="flex items-start gap-2">
                      <svg
                        className="mt-0.5 shrink-0 text-zinc-300 group-hover:text-indigo-400 transition-colors"
                        width="12" height="12" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5"
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                      <span className="text-xs text-zinc-600 group-hover:text-indigo-700 transition-colors leading-relaxed">
                        {s.label}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {streaming && !streamingContent && <LoadingGame />}

          {streaming && streamingContent && (
            <ChatMessage
              message={{ role: "assistant", content: streamingContent }}
              streaming
            />
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Bottom — input + footer */}
      <div className="shrink-0 px-3 sm:px-10 pt-2 pb-3 sm:pb-5">
        <div className="mx-auto max-w-2xl space-y-2">

          <ChatInput
            onSend={handleSend}
            disabled={streaming}
            prefill={prefill}
            onPrefillConsumed={() => setPrefill("")}
          />

          <div className="flex items-center justify-between px-1">
            <p className="text-[11px] text-zinc-400">
              Avocado answers from Jaya&apos;s profile.{" "}
              <Link href="/" className="text-indigo-500 hover:text-indigo-700 font-medium">
                View portfolio →
              </Link>
            </p>
            {messages.length > 1 && (
              <button
                onClick={handleClear}
                className="text-[11px] text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Footer */}
          <div className="pt-2 sm:pt-3 border-t border-zinc-200">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] sm:text-[11px] text-zinc-400 hidden sm:block">
                © {new Date().getFullYear()} Jaya Sabarish Reddy Remala
              </span>
              <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                <Link href="/blog" className="text-[10px] sm:text-[11px] text-zinc-400 hover:text-zinc-700 transition-colors">Blog</Link>
                <a href={profile.github} target="_blank" rel="noopener noreferrer"
                  className="text-[10px] sm:text-[11px] text-zinc-400 hover:text-zinc-700 transition-colors">GitHub</a>
                <a href={profile.linkedin} target="_blank" rel="noopener noreferrer"
                  className="text-[10px] sm:text-[11px] text-zinc-400 hover:text-zinc-700 transition-colors">LinkedIn</a>
                <a href={`mailto:${profile.email}`}
                  className="text-[10px] sm:text-[11px] text-zinc-400 hover:text-zinc-700 transition-colors">Email</a>
                <a href={profile.resume} target="_blank" rel="noopener noreferrer"
                  className="text-[10px] sm:text-[11px] text-zinc-400 hover:text-zinc-700 transition-colors">Resume</a>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

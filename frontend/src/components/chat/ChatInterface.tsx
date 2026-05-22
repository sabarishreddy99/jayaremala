"use client";

import { useEffect, useRef, useState, startTransition } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api/client";
import { saveMessages, loadMessages, clearSession } from "@/lib/session";
import { profile } from "@/data/profile";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import LoadingGame from "./LoadingGame";
import NavSuggestions, { detectNavLinks, sourcesToNavLinks, mergeNavLinks, NavLink } from "./NavSuggestions";

export interface Message {
  role: "user" | "assistant";
  content: string;
  navLinks?: NavLink[];
  followUps?: string[];
}

const FOLLOW_UP_POOL: Record<string, string[]> = {
  experience: [
    "What companies has Jaya worked at?",
    "What were Jaya's key responsibilities at each role?",
    "How long has Jaya been working in the industry?",
  ],
  project: [
    "What's the most technically challenging project Jaya built?",
    "What tech stack did Jaya use across his projects?",
    "Does Jaya have any open-source or side projects?",
  ],
  faq: [
    "What sets Jaya apart from other candidates?",
    "What kind of problems does Jaya enjoy solving?",
    "What are Jaya's biggest career achievements?",
  ],
  profile: [
    "What is Jaya currently working on?",
    "What domains is Jaya most passionate about?",
    "Is Jaya open to new roles and where is he based?",
  ],
  education: [
    "What did Jaya study at NYU?",
    "What was Jaya's undergraduate background?",
    "Did Jaya do any research or coursework in AI?",
  ],
  skills: [
    "What AI and ML frameworks does Jaya know?",
    "What cloud platforms has Jaya worked with?",
    "What databases and data systems has Jaya used?",
  ],
  testimonial: [
    "What do colleagues say about working with Jaya?",
    "How does Jaya collaborate with engineering teams?",
  ],
  blog: [
    "Has Jaya written about AI or system design?",
    "What technical topics does Jaya write about?",
  ],
  lab: [
    "Does Jaya have system design deep-dives I can read?",
    "What architectural problems has Jaya documented?",
  ],
};

function deriveFollowUps(sources: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const src of sources) {
    const type = src.split(":")[0];
    if (seen.has(type) || !FOLLOW_UP_POOL[type]) continue;
    seen.add(type);
    const pool = FOLLOW_UP_POOL[type];
    result.push(pool[Math.floor(Math.random() * pool.length)]);
    if (result.length >= 3) break;
  }
  return result;
}

const WELCOME: Message = {
  role: "assistant",
  content:
    "Hi! I'm Avocado, Jaya's AI assistant. Ask me anything about his background, work experience, projects, or skills.",
};

const SUGGESTIONS = [
  { label: "Open to new roles?",       hint: "Availability & location",    full: "Is Jaya currently open to new job opportunities? Where is he based?" },
  { label: "Most impressive project",  hint: "Standout work",              full: "What is Jaya's most impressive project and what makes it stand out?" },
  { label: "AI & ML expertise",        hint: "RAG, LLMs, Edge AI",         full: "Tell me about Jaya's AI and machine learning expertise." },
  { label: "Current work at NYU",      hint: "What he's building now",     full: "What is Jaya currently working on at NYU?" },
  { label: "Distributed systems",      hint: "Scale & reliability",        full: "Tell me about Jaya's distributed systems and backend engineering experience." },
  { label: "Experience at Shell",      hint: "Industry background",        full: "What did Jaya build at Wipro and Shell PLC?" },
  { label: "How Avocado works",        hint: "This chatbot's tech",        full: "How does this AI portfolio chatbot work? What powers Avocado?" },
  { label: "Resume & contact",         hint: "Get in touch",               full: "How can I contact Jaya or view his resume?" },
];

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [activeModel, setActiveModel] = useState<string | null>(null);
  const [stats, setStats] = useState<{ total_responses: number; unique_visitors: number } | null>(null);
  const [backendStatus, setBackendStatus] = useState<"checking" | "ready" | "warming">("checking");
  const [pendingRetry, setPendingRetry] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE_URL}/health`, { signal: controller.signal })
      .then((r) => { if (r.ok) setBackendStatus("ready"); else setBackendStatus("warming"); })
      .catch(() => setBackendStatus("warming"));
    fetch(`${API_BASE_URL}/stats`)
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
    return () => controller.abort();
  }, []);

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
  const [introVisible, setIntroVisible] = useState(true);
  const [rateLimitUntil, setRateLimitUntil] = useState<number | null>(null);
  const [rateLimitSecsLeft, setRateLimitSecsLeft] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!rateLimitUntil) return;
    const tick = () => {
      const left = Math.ceil((rateLimitUntil - Date.now()) / 1000);
      if (left <= 0) { setRateLimitUntil(null); setRateLimitSecsLeft(0); }
      else setRateLimitSecsLeft(left);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [rateLimitUntil]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  /* Collapse the intro banner as soon as the first real message is sent */
  useEffect(() => {
    if (messages.length > 1) setIntroVisible(false);
  }, [messages.length]);

  async function handleSend(text: string) {
    const userMsg: Message = { role: "user", content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setStreaming(true);
    setStreamingContent("");
    abortRef.current = new AbortController();

    setPendingRetry(null);
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

      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get("Retry-After") ?? "60", 10);
        setRateLimitUntil(Date.now() + retryAfter * 1000);
        setRateLimitSecsLeft(retryAfter);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `You've sent 10 messages this minute — that's the rate limit. The countdown below will show when you can ask again.` },
        ]);
        return;
      }
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let ragSources: string[] = [];
      let sseError: string | null = null;

      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value, { stream: true }).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.token) { accumulated += data.token; setStreamingContent(accumulated); }
            if (data.error) { sseError = data.error as string; break outer; }
            if (data.done) {
              if (data.model) setActiveModel(data.model);
              if (data.sources) ragSources = data.sources as string[];
              break outer;
            }
          } catch { /* partial chunk */ }
        }
      }

      if (sseError === "quota_exhausted") {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Avocado has hit its daily Gemini API quota — all AI models are temporarily unavailable. " +
              "Please try again later today or tomorrow, or reach Jaya directly at jr6421@nyu.edu.",
          },
        ]);
        return;
      }

      setBackendStatus("ready");
      const navLinks = mergeNavLinks(
        sourcesToNavLinks(ragSources),
        detectNavLinks(text, accumulated),
      );
      const followUps = deriveFollowUps(ragSources);
      const content = accumulated.trim() || "Sorry, I couldn't generate a response. Please try again or reach Jaya directly at jr6421@nyu.edu.";
      const assistantMsg: Message = { role: "assistant", content, navLinks, followUps };
      const finalMessages = [...nextMessages, assistantMsg];
      setMessages(finalMessages);
      saveMessages(finalMessages.filter((m) => m !== WELCOME));
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setPendingRetry(text);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            backendStatus === "warming"
              ? "Avocado is still warming up (usually takes ~30 seconds on first visit). Hit **Retry** below or try again in a moment."
              : "Sorry, something went wrong. Hit **Retry** or try again.",
        },
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

      {/* Intro — collapses to zero once the first message is sent */}
      <div
        className="shrink-0 px-4 sm:px-6 text-center overflow-hidden transition-all duration-500 ease-in-out"
        style={{
          maxHeight: introVisible ? "160px" : "0px",
          opacity: introVisible ? 1 : 0,
          paddingTop: introVisible ? undefined : "0px",
          paddingBottom: introVisible ? undefined : "0px",
        }}
      >
        <div className="pt-2 sm:pt-4 pb-2 sm:pb-4">
          <div className="flex items-center justify-center gap-2 mb-1.5 sm:mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-fg-faint">
              Avocado · Live
            </span>
          </div>
          <h1 className="text-base sm:text-2xl font-bold tracking-tight text-fg">
            Chat with Avocado 🥑
          </h1>
          <p className="mt-0.5 text-[11px] font-medium text-accent tracking-wide">
            Jaya&apos;s personal AI assistant — ask anything
          </p>
          <div className="mx-auto mt-2 sm:mt-4 w-8 h-px bg-border" />
        </div>
      </div>

      {/* Warm-up banner */}
      {backendStatus === "warming" && (
        <div className="shrink-0 px-3 sm:px-10 pt-2">
          <div className="mx-auto max-w-2xl">
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-3 py-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                Avocado is waking up — first response may take ~30 seconds.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Rate-limit countdown banner */}
      {rateLimitUntil && (
        <div className="shrink-0 px-3 sm:px-10 pt-2">
          <div className="mx-auto max-w-2xl">
            <div className="flex items-center justify-between gap-2 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                <p className="text-[11px] text-rose-700 dark:text-rose-400 truncate">
                  Rate limit reached · You can ask again in
                </p>
              </div>
              <span className="text-[11px] font-semibold tabular-nums text-rose-700 dark:text-rose-300 shrink-0">
                {rateLimitSecsLeft}s
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-10 py-3 sm:py-4">
        <div className="mx-auto max-w-2xl space-y-4 sm:space-y-5">
          {messages.map((m, i) => (
            <div key={i}>
              <ChatMessage message={m} />
              {m.role === "assistant" && m.navLinks && m.navLinks.length > 0 && m !== WELCOME && (
                <div className="ml-10">
                  <NavSuggestions links={m.navLinks} />
                </div>
              )}
              {m.role === "assistant" && m.followUps && m.followUps.length > 0 &&
               i === messages.length - 1 && !streaming && (
                <div className="ml-10 mt-2.5">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-fg-faint mb-1.5">
                    Ask next
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {m.followUps.map((q) => (
                      <button
                        key={q}
                        onClick={() => setPrefill(q)}
                        className="rounded-full border border-border bg-surface px-3 py-1 text-[11px] text-fg-muted hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-accent transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Suggestion chips — only on initial state */}
          {isInitial && (
            <div className="pt-1 sm:pt-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-faint mb-2 sm:mb-3">
                Ask Avocado about
              </p>
              <div className="grid grid-cols-2 gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.full}
                    onClick={() => setPrefill(s.full)}
                    className="group text-left rounded-xl border border-border bg-surface px-3 py-2.5 sm:px-4 sm:py-3 shadow-sm transition-all hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md active:scale-[0.98]"
                  >
                    <span className="flex flex-col gap-0.5">
                      <span className="text-[11px] sm:text-xs font-semibold text-fg-muted group-hover:text-accent transition-colors leading-tight">
                        {s.label}
                      </span>
                      <span className="text-[10px] text-fg-faint leading-tight hidden sm:block">
                        {s.hint}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Retry button */}
          {pendingRetry && !streaming && (
            <div className="flex justify-center">
              <button
                onClick={() => handleSend(pendingRetry)}
                className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-1.5 text-xs text-fg-muted hover:text-fg hover:border-fg-muted transition-colors"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M1 4v6h6M23 20v-6h-6"/>
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                </svg>
                Retry
              </button>
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
      <div className="shrink-0 px-3 sm:px-6 lg:px-10 pt-2 pb-3 sm:pb-5">
        <div className="mx-auto max-w-2xl space-y-2">

          <ChatInput
            onSend={handleSend}
            disabled={streaming || !!rateLimitUntil}
            prefill={prefill}
            onPrefillConsumed={() => setPrefill("")}
          />

          <div className="flex items-center justify-between px-1">
            <p className="text-[11px] text-fg-faint flex items-center gap-2">
              Avocado answers from Jaya&apos;s profile.{" "}
              {activeModel && (
                <span className="inline-flex items-center gap-1 rounded-full bg-surface-raised border border-border px-2 py-0.5 text-[10px] font-medium text-fg-subtle">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                  {activeModel}
                </span>
              )}
              <Link href="/" className="text-accent hover:text-accent-hover font-medium">
                View portfolio →
              </Link>
            </p>
            {messages.length > 1 && (
              <button
                onClick={handleClear}
                className="text-[11px] text-fg-faint hover:text-fg-muted transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Stats */}
          {stats && stats.total_responses > 0 && (
            <div className="flex items-center justify-center gap-4 py-1.5">
              <div className="flex items-center gap-1.5">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <span className="text-[10px] text-fg-faint">
                  <span className="font-semibold text-fg-muted">{stats.total_responses.toLocaleString()}</span> responses
                </span>
              </div>
              <span className="text-border">·</span>
              <div className="flex items-center gap-1.5">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <span className="text-[10px] text-fg-faint">
                  <span className="font-semibold text-fg-muted">{stats.unique_visitors.toLocaleString()}</span> unique visitors
                </span>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-2 sm:pt-3 border-t border-border">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] sm:text-[11px] text-fg-faint hidden sm:block">
                © {new Date().getFullYear()} Jaya Sabarish Reddy Remala
              </span>
              {/* Mobile: show 3 key links only; sm+: show all */}
              <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                <a href={profile.linkedin} target="_blank" rel="noopener noreferrer"
                  className="text-[10px] sm:text-[11px] text-fg-faint hover:text-fg-muted transition-colors">LinkedIn</a>
                <a href={`mailto:${profile.email}`}
                  className="text-[10px] sm:text-[11px] text-fg-faint hover:text-fg-muted transition-colors">Email</a>
                <a href={profile.resume} target="_blank" rel="noopener noreferrer"
                  className="text-[10px] sm:text-[11px] text-fg-faint hover:text-fg-muted transition-colors">Resume</a>
                <Link href="/blog" className="hidden sm:inline text-[11px] text-fg-faint hover:text-fg-muted transition-colors">Blog</Link>
                <a href={profile.github} target="_blank" rel="noopener noreferrer"
                  className="hidden sm:inline text-[11px] text-fg-faint hover:text-fg-muted transition-colors">GitHub</a>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

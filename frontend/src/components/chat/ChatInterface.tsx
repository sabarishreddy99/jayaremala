"use client";

import { useEffect, useRef, useState, startTransition } from "react";
import { useSearchParams } from "next/navigation";
import { API_BASE_URL } from "@/lib/api/client";
import { getOrCreateVisitorId } from "@/lib/visitor";
import { saveMessages, loadMessages, clearSession, saveModel, loadModel, saveLastQuestions, loadLastQuestions } from "@/lib/session";
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

function getGeminiResetInfo(): { time: string; countdown: string } {
  // Gemini free-tier daily quota resets at midnight Pacific Time.
  const now = new Date();
  const ptStr = now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" });
  const ptNow = new Date(ptStr);
  const ptMidnight = new Date(ptNow);
  ptMidnight.setDate(ptMidnight.getDate() + 1);
  ptMidnight.setHours(0, 0, 0, 0);
  const resetAt = new Date(now.getTime() + (ptMidnight.getTime() - ptNow.getTime()));

  const time = resetAt.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const diffMs = resetAt.getTime() - now.getTime();
  const diffMins = Math.ceil(diffMs / 60000);
  const h = Math.floor(diffMins / 60);
  const m = diffMins % 60;
  const countdown = h > 0
    ? `${h}h ${m > 0 ? `${m}m` : ""}`.trim()
    : `${m}m`;

  return { time, countdown };
}


const WELCOME: Message = {
  role: "assistant",
  content:
    "Hi! I'm Avocado, Jaya's AI assistant. Ask me anything about his background, work experience, projects, or skills.",
};

function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const PROMPTS = [
  { category: "Availability",   label: "Open to new roles?",    full: "Is Jaya currently open to new job opportunities? Where is he based and what kind of roles interest him?" },
  { category: "Projects",       label: "Most impressive work",   full: "What is Jaya's most impressive project and what makes it technically stand out?" },
  { category: "AI Expertise",   label: "AI & ML skills",         full: "Tell me about Jaya's AI and machine learning expertise — RAG pipelines, LLMs, and edge AI." },
  { category: "Experience",     label: "Shell, Wipro & NYU",     full: "What did Jaya build at Shell PLC, Wipro, and NYU? Walk me through his career timeline." },
  { category: "Recognition",    label: "Hackathon winner?",      full: "Tell me about Jaya's Qualcomm Edge AI Hackathon win and other notable achievements." },
  { category: "About Avocado",  label: "How this AI works",      full: "How does this AI portfolio chatbot work? What powers Avocado behind the scenes?" },
];

export default function ChatInterface() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  // Always-current ref so handleSend reads the right messages even from stale closures
  const messagesRef = useRef<Message[]>([WELCOME]);
  messagesRef.current = messages;
  const [activeModel, setActiveModel] = useState<string | null>(null);
  const [totalResponses, setTotalResponses] = useState<number | null>(null);
  const [backendStatus, setBackendStatus] = useState<"checking" | "ready" | "warming">("checking");
  const [experienceRating, setExperienceRating] = useState<number | null>(null);
  const [ratingDismissed, setRatingDismissed] = useState(false);
  const [ratingHover, setRatingHover] = useState(0);
  const [pendingRetry, setPendingRetry] = useState<string | null>(null);
  const [sessionRestored, setSessionRestored] = useState(false);
  const [welcomeBack, setWelcomeBack] = useState<string | null>(null);
  const [dynamicFollowUps, setDynamicFollowUps] = useState<string[]>([]);
  const [followUpsLoading, setFollowUpsLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE_URL}/health`, { signal: controller.signal })
      .then((r) => { if (r.ok) setBackendStatus("ready"); else setBackendStatus("warming"); })
      .catch(() => setBackendStatus("warming"));
    fetch(`${API_BASE_URL}/stats`)
      .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then((d) => { if (d.total_responses > 0) setTotalResponses(d.total_responses); })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  // Restore rating state from sessionStorage after hydration
  useEffect(() => {
    const saved = sessionStorage.getItem("avocado_experience_rating");
    if (saved) setExperienceRating(Number(saved));
    if (sessionStorage.getItem("avocado_rating_dismissed") === "1") setRatingDismissed(true);
  }, []);

  // Load persisted messages after hydration, then auto-send ?q= if present
  const autoSentRef = useRef(false);
  useEffect(() => {
    const saved = loadMessages();
    const hasHistory = saved && saved.length > 0;
    const restored: Message[] = hasHistory ? [WELCOME, ...saved] : [WELCOME];
    messagesRef.current = restored; // update ref immediately so handleSend reads it
    startTransition(() => setMessages(restored));

    // Restore last known model so the badge shows immediately after navigation
    const savedModel = loadModel();
    if (savedModel) setActiveModel(savedModel);

    // Show the "restored" pill if there was a real conversation to restore
    let dismissTimer: ReturnType<typeof setTimeout> | undefined;
    if (hasHistory) {
      setSessionRestored(true);
      dismissTimer = setTimeout(() => setSessionRestored(false), 3000);
    }

    // Welcome back: show last question from a previous session (localStorage, not sessionStorage)
    let welcomeTimer: ReturnType<typeof setTimeout> | undefined;
    if (!hasHistory) {
      const prev = loadLastQuestions();
      if (prev && prev.length > 0) {
        setWelcomeBack(prev[0]);
        welcomeTimer = setTimeout(() => setWelcomeBack(null), 3000);
      }
    }

    const q = searchParams.get("q");
    if (q && !autoSentRef.current) {
      autoSentRef.current = true;
      handleSend(decodeURIComponent(q));
    }

    return () => {
      if (dismissTimer) clearTimeout(dismissTimer);
      if (welcomeTimer) clearTimeout(welcomeTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [prefill, setPrefill] = useState("");
  const [introVisible, setIntroVisible] = useState(true);
  const [rateLimitUntil, setRateLimitUntil] = useState<number | null>(null);
  const [rateLimitSecsLeft, setRateLimitSecsLeft] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [atBottom, setAtBottom] = useState(true);

  /* Track whether the user is near the bottom of the scroll area */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
      setAtBottom(dist < 120);
    };
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

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

  /* Auto-scroll only when the user is already at the bottom — never yank
     them away from an earlier message they're reading */
  useEffect(() => {
    if (atBottom) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent, atBottom]);

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  /* Collapse the intro banner as soon as the first real message is sent */
  useEffect(() => {
    if (messages.length > 1) setIntroVisible(false);
  }, [messages.length]);

  async function handleSend(text: string) {
    const userMsg: Message = { role: "user", content: text };
    const nextMessages = [...messagesRef.current, userMsg];
    setMessages(nextMessages);
    setStreaming(true);
    setStreamingContent("");
    abortRef.current = new AbortController();

    setPendingRetry(null);
    setDynamicFollowUps([]);
    setFollowUpsLoading(false);
    try {
      const vid = getOrCreateVisitorId();
      const res = await fetch(`${API_BASE_URL}/ai/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(vid ? { "x-visitor-id": vid } : {}),
        },
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
            if (data.reset) { accumulated = ""; setStreamingContent(""); }
            if (data.token) { accumulated += data.token; setStreamingContent(accumulated); }
            if (data.error) { sseError = data.error as string; break outer; }
            if (data.done) {
              if (data.model) { setActiveModel(data.model); saveModel(data.model as string); }
              if (data.sources) ragSources = data.sources as string[];
              break outer;
            }
          } catch { /* partial chunk */ }
        }
      }

      if (sseError) {
        const { time, countdown } = getGeminiResetInfo();
        const isQuota = sseError === "quota_exhausted";
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: isQuota
              ? "Avocado has exhausted all available Gemini AI models for today — the daily quota across the entire fallback chain has been reached.\n\n" +
                `**Quota resets at ${time}** (in ~${countdown}). After that, everything will be back to normal automatically.\n\n` +
                "In the meantime, feel free to reach Jaya directly at **jr6421@nyu.edu**."
              : "Sorry, I ran into an issue generating a response. Please try again or reach Jaya directly at **jr6421@nyu.edu**.",
          },
        ]);
        return;
      }

      setBackendStatus("ready");
      const navLinks = mergeNavLinks(
        sourcesToNavLinks(ragSources),
        detectNavLinks(text, accumulated),
      );
      const content = accumulated.trim() || "Sorry, I couldn't generate a response. Please try again or reach Jaya directly at jr6421@nyu.edu.";
      const assistantMsg: Message = { role: "assistant", content, navLinks, followUps: [] };
      const finalMessages = [...nextMessages, assistantMsg];
      setMessages(finalMessages);
      saveMessages(finalMessages.filter((m) => m !== WELCOME));
      const userQuestions = finalMessages
        .filter((m) => m.role === "user")
        .map((m) => m.content)
        .slice(-3);
      saveLastQuestions(userQuestions);

      // Async dynamic follow-ups — fire after message is committed
      setFollowUpsLoading(true);
      fetch(`${API_BASE_URL}/ai/followups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, response: content }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d?.followups?.length) setDynamicFollowUps(d.followups); })
        .catch(() => {})
        .finally(() => setFollowUpsLoading(false));
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

  function handleRate(star: number) {
    setExperienceRating(star);
    sessionStorage.setItem("avocado_experience_rating", String(star));
    fetch(`${API_BASE_URL}/stats/experience-rating`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: star }),
    }).catch(() => {});
  }

  function handleRatingDismiss() {
    setRatingDismissed(true);
    sessionStorage.setItem("avocado_rating_dismissed", "1");
  }

  const isInitial = messages.length === 1 && !streaming;

  return (
    <div className="flex flex-col h-full">

      {/* ── Intro — cinematic first impression, collapses on first send ── */}
      <div
        className="shrink-0 overflow-hidden transition-all duration-500 ease-in-out"
        style={{
          maxHeight: introVisible ? "580px" : "0px",
          opacity: introVisible ? 1 : 0,
        }}
      >
        {/* Avatar + greeting */}
        <div className="flex flex-col items-center px-4 sm:px-6 pt-7 sm:pt-10 pb-3 text-center">
          {/* Avocado avatar with glow ring */}
          <div className="relative mb-4">
            <div className="absolute inset-[-8px] rounded-full bg-indigo-500/15 blur-lg animate-avo-glow" />
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-3xl shadow-xl shadow-indigo-500/20">
              🥑
            </div>
            {/* Live status dot */}
            <span className="absolute bottom-0.5 right-0.5 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-bg items-center justify-center">
                <span className="w-1 h-1 rounded-full bg-white" />
              </span>
            </span>
          </div>

          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-fg-faint mb-1">
            {getTimeGreeting()} · Avocado
          </p>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-fg leading-tight">
            Ask me anything about Jaya
          </h1>
          <p className="mt-1 text-xs text-fg-subtle max-w-xs leading-relaxed">
            Jaya&apos;s personal AI — powered by RAG + Gemini.
          </p>
          {totalResponses !== null && (
            <div className="mt-2 flex items-center gap-1.5">
              <span className="text-base font-black tabular-nums text-fg">{totalResponses.toLocaleString()}+</span>
              <span className="text-[11px] text-fg-faint leading-tight">conversations<br/>answered</span>
            </div>
          )}
        </div>

        {/* Prompt cards — constrained to same width as chat messages */}
        <div className="px-3 sm:px-6 pb-5 sm:pb-7">
          <div className="mx-auto max-w-2xl lg:max-w-3xl">
          <p className="hidden sm:block text-[9px] font-bold uppercase tracking-[0.2em] text-fg-faint mb-2 px-1">
            Start with a question
          </p>
          <div className="hidden sm:grid grid-cols-2 gap-1.5">
            {PROMPTS.map((p) => (
              <button
                key={p.full}
                onClick={() => setPrefill(p.full)}
                className="group text-left rounded-lg border border-border bg-surface/70
                           px-3 py-2 hover:border-indigo-300 dark:hover:border-indigo-700
                           hover:bg-surface active:scale-[0.98]
                           transition-all duration-150"
              >
                <span className="text-[9px] font-bold uppercase tracking-widest text-fg-faint block mb-0.5">
                  {p.category}
                </span>
                <span className="text-[11px] font-medium text-fg-muted group-hover:text-accent transition-colors leading-snug block">
                  {p.label}
                </span>
              </button>
            ))}
          </div>
          </div>
        </div>
      </div>

      {/* Warm-up banner */}
      {backendStatus === "warming" && (
        <div className="shrink-0 px-3 sm:px-10 pt-2">
          <div className="mx-auto max-w-2xl lg:max-w-3xl">
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-3 py-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                Avocado is waking up — first response may take ~30 seconds.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Session restored indicator */}
      <div
        className={`shrink-0 px-3 sm:px-10 pt-2 transition-all duration-500 ${sessionRestored ? "opacity-100 max-h-12" : "opacity-0 max-h-0 overflow-hidden pointer-events-none"}`}
      >
        <div className="mx-auto max-w-2xl lg:max-w-3xl">
          <div className="flex items-center gap-2 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/30 px-3 py-2">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-indigo-400 shrink-0">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
              Conversation restored — pick up where you left off.
            </p>
          </div>
        </div>
      </div>

      {/* Welcome back banner — shown on return visits (new session, but prior questions exist) */}
      {welcomeBack && (
        <div className="shrink-0 px-3 sm:px-10 pt-2">
          <div className="mx-auto max-w-2xl lg:max-w-3xl">
            <div className="flex items-center justify-between gap-2 rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50/60 dark:bg-violet-950/30 px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-violet-400 shrink-0">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <p className="text-[11px] text-violet-600 dark:text-violet-400 font-medium truncate">
                  Welcome back! Last time:{" "}
                  <span className="italic font-normal opacity-80 truncate">&ldquo;{welcomeBack}&rdquo;</span>
                </p>
              </div>
              <button
                onClick={() => setWelcomeBack(null)}
                aria-label="Dismiss"
                className="text-[12px] text-violet-400 hover:text-violet-600 dark:hover:text-violet-300 transition-colors shrink-0 leading-none"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rate-limit countdown banner */}
      {rateLimitUntil && (
        <div className="shrink-0 px-3 sm:px-10 pt-2">
          <div className="mx-auto max-w-2xl lg:max-w-3xl">
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

      {/* Ambient status strip — live feedback on streaming / warming state */}
      <div
        aria-hidden
        className={`shrink-0 h-0.5 w-full transition-all duration-700 ${
          streaming
            ? "opacity-80 bg-gradient-to-r from-indigo-500 via-violet-400 to-indigo-500"
            : backendStatus === "warming"
            ? "opacity-50 bg-amber-400"
            : "opacity-0"
        }`}
      />

      {/* Messages */}
      <div className="relative flex-1 min-h-0">
      <div ref={scrollRef} className="h-full overflow-y-auto px-3 sm:px-6 lg:px-10 py-3 sm:py-4">
        <div className="mx-auto max-w-2xl lg:max-w-3xl space-y-4 sm:space-y-5">
          {messages.map((m, i) => (
            <div key={i}>
              <ChatMessage message={m} />
              {m.role === "assistant" && m.navLinks && m.navLinks.length > 0 && m !== WELCOME && (
                <div className="ml-10">
                  <NavSuggestions links={m.navLinks} />
                </div>
              )}
              {m.role === "assistant" && i === messages.length - 1 && !streaming &&
               (followUpsLoading || dynamicFollowUps.length > 0) && (
                <div className="ml-10 mt-3">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-fg-faint mb-2">
                    Ask next
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {followUpsLoading && dynamicFollowUps.length === 0 ? (
                      /* Shimmer skeleton while Gemini generates */
                      [45, 60, 52].map((w, idx) => (
                        <div
                          key={idx}
                          className="h-8 rounded-lg bg-surface-raised animate-pulse"
                          style={{ width: `${w}%` }}
                        />
                      ))
                    ) : (
                      dynamicFollowUps.map((q, idx) => (
                        <button
                          key={q}
                          onClick={() => setPrefill(q)}
                          style={{ animationDelay: `${idx * 60}ms` }}
                          className="w-full text-left rounded-lg border border-border bg-surface/70
                                     px-3 py-2 text-[11px] text-fg-muted
                                     hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-accent
                                     hover:bg-surface transition-all duration-150
                                     opacity-0 animate-[fadeUp_0.4s_ease_forwards]"
                        >
                          {q}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Welcome back prompt — shown after intro has gone away but chat is fresh */}
          {isInitial && messages.length === 1 && (
            <div className="pt-2">
              <p className="text-[10px] text-fg-faint text-center">
                Pick a card above or type your question below ↓
              </p>
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

        {/* Jump-to-latest — appears when scrolled up during/after a conversation */}
        {!atBottom && messages.length > 2 && (
          <button
            onClick={scrollToBottom}
            aria-label="Scroll to latest message"
            className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20
                       inline-flex items-center gap-1.5 rounded-full
                       border border-border bg-surface/95 backdrop-blur-sm
                       px-3 py-1.5 text-[11px] font-medium text-fg-muted
                       shadow-md hover:text-fg hover:border-fg-muted
                       transition-all duration-200 animate-fade-up"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
            Latest
          </button>
        )}
      </div>

      {/* Bottom — input + footer */}
      <div className="shrink-0 px-3 sm:px-6 lg:px-10 pt-2 pb-3 sm:pb-5">
        <div className="mx-auto max-w-2xl lg:max-w-3xl space-y-2">

          <ChatInput
            onSend={handleSend}
            disabled={streaming || !!rateLimitUntil}
            prefill={prefill}
            onPrefillConsumed={() => setPrefill("")}
          />

          {/* Single meta row — model · keyboard hint · clear */}
          <div className="flex items-center justify-between px-1 min-h-[18px]">
            <div className="flex items-center gap-2">
              {activeModel ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-surface-raised border border-border px-2 py-0.5 text-[10px] font-medium text-fg-subtle">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                  {activeModel}
                </span>
              ) : (
                <span className="text-[10px] text-fg-faint/70">Powered by RAG + Gemini</span>
              )}
              {totalResponses !== null && (
                <span className="hidden sm:inline text-[10px] text-fg-faint/60">
                  · {totalResponses.toLocaleString()} answered
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-[10px] text-fg-faint/40 select-none">
                <kbd className="font-mono">↵</kbd> send · <kbd className="font-mono">⇧↵</kbd> newline
              </span>
              {messages.length > 1 && (
                <button
                  onClick={handleClear}
                  className="text-[11px] text-fg-faint hover:text-fg-muted transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Experience rating — contextual, appears only after 2+ exchanges */}
          {messages.length >= 4 && experienceRating === null && !ratingDismissed && (
            <div className="flex items-center justify-center gap-1.5 animate-fade-up">
              <span className="text-[10px] text-fg-faint">Helpful? Rate Avocado</span>
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRate(star)}
                    onMouseEnter={() => setRatingHover(star)}
                    onMouseLeave={() => setRatingHover(0)}
                    aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                    className={`text-sm leading-none transition-colors ${
                      star <= (ratingHover || 0) ? "text-amber-400" : "text-border hover:text-amber-300"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <button
                onClick={handleRatingDismiss}
                aria-label="Dismiss rating"
                className="text-[11px] text-fg-faint hover:text-fg-muted transition-colors leading-none ml-1"
              >
                ×
              </button>
            </div>
          )}
          {experienceRating !== null && (
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-[10px] text-fg-faint">Thanks for rating!</span>
              <span className="text-xs leading-none">
                {[1,2,3,4,5].map((s) => (
                  <span key={s} className={s <= experienceRating ? "text-amber-400" : "text-border"}>★</span>
                ))}
              </span>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}

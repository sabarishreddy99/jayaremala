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
import RichCards from "./RichCards";
import LeadCaptureCard from "./LeadCaptureCard";
import AnswerTrace, { TraceStage } from "./AnswerTrace";
import AgentSteps, { StepEvent } from "./AgentSteps";

export interface Message {
  role: "user" | "assistant";
  content: string;
  navLinks?: NavLink[];
  followUps?: string[];
  showLeadCapture?: boolean;
  trace?: TraceStage[];
  traceModel?: string;
  latencyMs?: number;
  steps?: StepEvent[];
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

// ── Audience personas ─────────────────────────────────────────────────────────
type PersonaId = "recruiter" | "engineer" | "founder";

const PERSONAS: { id: PersonaId; label: string; hint: string }[] = [
  { id: "recruiter", label: "Recruiter", hint: "Impact & availability" },
  { id: "engineer",  label: "Engineer",  hint: "Architecture & stack" },
  { id: "founder",   label: "Founder",   hint: "Shipping & ownership" },
];

type Prompt = { label: string; full: string };

const PROMPTS_BY_PERSONA: Record<PersonaId, Prompt[]> = {
  recruiter: [
    { label: "Open to new roles?",       full: "Is Jaya open to new opportunities? What roles and locations is he targeting?" },
    { label: "Biggest measurable impact", full: "What's the most impressive, measurable impact Jaya has delivered?" },
    { label: "How he works with teams",   full: "How does Jaya collaborate with engineering teams and stakeholders?" },
    { label: "Standout achievement",      full: "What is Jaya's standout career achievement and why does it matter?" },
  ],
  engineer: [
    { label: "How the RAG pipeline works", full: "Walk me through how Jaya's RAG pipeline works end to end." },
    { label: "Hardest technical problem",  full: "What's the hardest technical problem Jaya has solved, and how?" },
    { label: "Stack & design tradeoffs",   full: "What's Jaya's core tech stack and what design tradeoffs has he made?" },
    { label: "Edge AI & low-latency work", full: "Tell me about Jaya's edge AI and low-latency inference work." },
  ],
  founder: [
    { label: "Can he build 0 → 1?",       full: "Can Jaya build a product from zero to one on his own? What has he shipped solo?" },
    { label: "How fast does he ship?",     full: "How quickly does Jaya ship, and how does he handle ambiguity?" },
    { label: "Full-stack range",           full: "What's the full range of what Jaya can build across the stack?" },
    { label: "Business impact",            full: "What business impact has Jaya's work driven?" },
  ],
};

const PERSONA_KEY = "avocado_persona";
const AGENT_MODE_KEY = "avocado_agent_mode";

function toolStepReduce(arr: StepEvent[], step: StepEvent): StepEvent[] {
  // Collapse the running→done pair for a tool into a single chip.
  if (step.status === "running") return [...arr, { tool: step.tool, status: "running" }];
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i].tool === step.tool && arr[i].status === "running") {
      const copy = [...arr];
      copy[i] = { tool: step.tool, status: "done", ms: step.ms };
      return copy;
    }
  }
  return [...arr, { tool: step.tool, status: "done", ms: step.ms }];
}

export default function ChatInterface() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  // Always-current ref so handleSend reads the right messages even from stale closures
  const messagesRef = useRef<Message[]>([WELCOME]);
  messagesRef.current = messages;
  const [activeModel, setActiveModel] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<"checking" | "ready" | "warming">("checking");
  const [experienceRating, setExperienceRating] = useState<number | null>(null);
  const [ratingDismissed, setRatingDismissed] = useState(false);
  const [ratingHover, setRatingHover] = useState(0);
  const [pendingRetry, setPendingRetry] = useState<string | null>(null);
  const [sessionRestored, setSessionRestored] = useState(false);
  const [welcomeBack, setWelcomeBack] = useState<string | null>(null);
  const [dynamicFollowUps, setDynamicFollowUps] = useState<string[]>([]);
  const [followUpsLoading, setFollowUpsLoading] = useState(false);
  const [persona, setPersona] = useState<PersonaId | null>(null);
  const personaRef = useRef<PersonaId | null>(null);
  personaRef.current = persona;
  const [agentMode, setAgentMode] = useState(false);
  const agentModeRef = useRef(false);
  agentModeRef.current = agentMode;
  // Live tool-call steps for the in-flight agent response
  const [liveSteps, setLiveSteps] = useState<StepEvent[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE_URL}/health`, { signal: controller.signal })
      .then((r) => { if (r.ok) setBackendStatus("ready"); else setBackendStatus("warming"); })
      .catch(() => setBackendStatus("warming"));
    // Pre-warm the embedder + retrieval path so the first real question is hot
    fetch(`${API_BASE_URL}/ai/warmup`, { signal: controller.signal }).catch(() => {});
    // Restore previously-chosen persona
    const saved = (typeof localStorage !== "undefined" && localStorage.getItem(PERSONA_KEY)) as PersonaId | null;
    if (saved && PROMPTS_BY_PERSONA[saved]) setPersona(saved);
    try { if (localStorage.getItem(AGENT_MODE_KEY) === "1") setAgentMode(true); } catch { /* storage blocked */ }
    return () => controller.abort();
  }, []);

  function choosePersona(id: PersonaId) {
    const next = persona === id ? null : id;
    setPersona(next);
    try {
      if (next) localStorage.setItem(PERSONA_KEY, next);
      else localStorage.removeItem(PERSONA_KEY);
    } catch { /* storage blocked */ }
  }

  const activePrompts: Prompt[] = persona ? PROMPTS_BY_PERSONA[persona] : PROMPTS;

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

  async function handleSend(text: string, forceClassic = false) {
    const useAgent = agentModeRef.current && !forceClassic;
    const endpoint = useAgent ? "/ai/chat/agentic" : "/ai/chat/stream";
    const userMsg: Message = { role: "user", content: text };
    const nextMessages = [...messagesRef.current, userMsg];
    setMessages(nextMessages);
    setStreaming(true);
    setStreamingContent("");
    setLiveSteps([]);
    abortRef.current = new AbortController();

    setPendingRetry(null);
    setDynamicFollowUps([]);
    setFollowUpsLoading(false);
    const agentSteps: StepEvent[] = [];
    try {
      const vid = getOrCreateVisitorId();
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
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
          ...(personaRef.current ? { persona: personaRef.current } : {}),
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
      let leadCapturePrompt = false;
      let traceStages: TraceStage[] = [];
      let traceModel: string | undefined;
      let latencyMs: number | undefined;

      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value, { stream: true }).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.reset) { accumulated = ""; setStreamingContent(""); }
            if (data.step) {
              const step = data.step as StepEvent;
              agentSteps.splice(0, agentSteps.length, ...toolStepReduce(agentSteps, step));
              setLiveSteps([...agentSteps]);
            }
            if (data.token) { accumulated += data.token; setStreamingContent(accumulated); }
            if (data.error) { sseError = data.error as string; break outer; }
            if (data.done) {
              if (data.model) { setActiveModel(data.model); saveModel(data.model as string); traceModel = data.model as string; }
              if (data.sources) ragSources = data.sources as string[];
              if (data.lead_capture_prompt) leadCapturePrompt = true;
              if (Array.isArray(data.trace)) traceStages = data.trace as TraceStage[];
              if (typeof data.latency_ms === "number") latencyMs = data.latency_ms;
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
      const assistantMsg: Message = {
        role: "assistant",
        content,
        navLinks,
        followUps: [],
        showLeadCapture: leadCapturePrompt,
        trace: traceStages.length ? traceStages : undefined,
        traceModel,
        latencyMs,
        steps: agentSteps.length ? agentSteps : undefined,
      };
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
          maxHeight: introVisible ? "720px" : "0px",
          opacity: introVisible ? 1 : 0,
        }}
      >
        {/* Avatar + greeting — minimal */}
        <div className="flex flex-col items-center px-4 sm:px-6 pt-10 sm:pt-16 pb-4 text-center">
          <div className="relative mb-3">
            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-2xl">
              🥑
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-bg" />
          </div>

          <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-fg leading-tight">
            Ask me anything about Jaya
          </h1>
          <p className="mt-1.5 text-xs text-fg-faint">
            {getTimeGreeting()}! I&apos;m Avocado, his AI assistant.
          </p>


          {/* Audience personas — tailor tone + what Avocado leads with */}
          <div className="mt-5 flex flex-col items-center gap-2">
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-fg-faint/70">
              {persona ? "Tailored for a" : "I'm a…"}
            </span>
            <div className="flex items-center gap-1.5">
              {PERSONAS.map((p) => {
                const selected = persona === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => choosePersona(p.id)}
                    title={p.hint}
                    aria-pressed={selected}
                    className={`rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-all duration-150 ${
                      selected
                        ? "border-accent bg-accent text-white"
                        : "border-border bg-surface/60 text-fg-muted hover:border-accent/50 hover:text-accent"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
            {persona && (
              <span className="text-[10px] text-fg-faint animate-fade-up">
                {PERSONAS.find((p) => p.id === persona)?.hint} · tap again to clear
              </span>
            )}
          </div>
        </div>

        {/* Prompt suggestions — centered cards, swap with persona */}
        <div className="px-4 sm:px-6 pb-6 sm:pb-8">
          <div className="mx-auto max-w-lg hidden sm:grid grid-cols-2 gap-2">
            {activePrompts.map((p) => (
              <button
                key={p.full}
                onClick={() => setPrefill(p.full)}
                className="group rounded-xl border border-border/60 bg-surface/50 px-4 py-3
                           text-[13px] text-center text-fg-muted
                           hover:border-accent/50 hover:text-accent hover:bg-surface
                           active:scale-[0.98] transition-all duration-150"
              >
                {p.label}
              </button>
            ))}
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
          <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-accent shrink-0">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            <p className="text-[11px] text-fg-muted font-medium">
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
            ? "opacity-80 bg-gradient-to-r from-accent via-accent/60 to-accent"
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
              {/* Inline rich cards — projects mentioned in the reply */}
              {m.role === "assistant" && m.steps && m.steps.length > 0 && m !== WELCOME && (
                <div className="ml-10">
                  <AgentSteps steps={m.steps} />
                </div>
              )}
              {m.role === "assistant" && m !== WELCOME && (
                <div className="ml-10">
                  <RichCards content={m.content} />
                </div>
              )}
              {m.role === "assistant" && m.navLinks && m.navLinks.length > 0 && m !== WELCOME && (
                <div className="ml-10">
                  <NavSuggestions links={m.navLinks} />
                </div>
              )}
              {/* Glass-box: how this answer was built (per-stage RAG waterfall) */}
              {m.role === "assistant" && m.trace && m.trace.length > 0 && m !== WELCOME && (
                <div className="ml-10">
                  <AnswerTrace trace={m.trace} model={m.traceModel} latencyMs={m.latencyMs} />
                </div>
              )}
              {m.role === "assistant" && m.showLeadCapture && !streaming && (
                <div className="ml-10">
                  <LeadCaptureCard
                    messages={messages
                      .filter((msg) => msg !== WELCOME)
                      .map((msg) => ({ role: msg.role, content: msg.content }))}
                    persona={persona}
                  />
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
                                     hover:border-accent/50 hover:text-accent
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

          {/* Live agent tool-call steps while the agent works */}
          {streaming && liveSteps.length > 0 && (
            <div className="ml-10">
              <AgentSteps steps={liveSteps} />
            </div>
          )}

          {streaming && !streamingContent && liveSteps.length === 0 && <LoadingGame />}

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

          {/* Minimal meta row — model status · clear */}
          <div className="flex items-center justify-between px-1 min-h-[16px]">
            <span className="inline-flex items-center gap-1 text-[10px] text-fg-faint/60">
              {activeModel ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                  {activeModel}
                </>
              ) : (
                "Powered by Gemini"
              )}
            </span>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => {
                  const next = !agentMode;
                  setAgentMode(next);
                  try { localStorage.setItem(AGENT_MODE_KEY, next ? "1" : "0"); } catch { /* storage blocked */ }
                }}
                title="Agent mode — Avocado picks tools per question and shows its steps live"
                aria-pressed={agentMode}
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors ${
                  agentMode
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border text-fg-faint hover:text-fg-muted"
                }`}
              >
                <span aria-hidden>⚡</span> Agent{agentMode ? " · on" : ""}
              </button>
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

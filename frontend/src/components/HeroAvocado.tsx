"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api/client";
import { saveMessages, loadMessages } from "@/lib/session";

const CHIPS = [
  "Is Jaya open to new opportunities?",
  "What's his background and expertise?",
  "What are his biggest career wins?",
  "What kind of teams does Jaya thrive in?",
];

function Prose({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((chunk, i) => {
        if (chunk.startsWith("**") && chunk.endsWith("**")) {
          return <strong key={i} className="text-zinc-100">{chunk.slice(2, -2)}</strong>;
        }
        return chunk.split("\n").map((line, j, arr) => (
          <span key={`${i}-${j}`}>{line}{j < arr.length - 1 && <br />}</span>
        ));
      })}
    </>
  );
}

export default function HeroAvocado() {
  const router = useRouter();
  const [input, setInput]         = useState("");
  const [asked, setAsked]         = useState("");
  const [reply, setReply]         = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError]         = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function submit(q: string) {
    q = q.trim();
    if (!q || streaming) return;

    // Second question — hand off to full chat with history already in localStorage
    if (asked !== "") {
      router.push(`/chat?q=${encodeURIComponent(q)}`);
      return;
    }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setAsked(q);
    setInput("");
    setReply("");
    setError(false);
    setStreaming(true);
    let fullReply = "";
    let hadError = false;
    try {
      const res = await fetch(`${API_BASE_URL}/ai/chat/stream`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: q, messages: [] }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) throw new Error("stream failed");
      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const msg = JSON.parse(line.slice(6));
            if (msg.token) { fullReply += msg.token; setReply((p) => p + msg.token); }
            if (msg.done || msg.error) { setStreaming(false); if (msg.error) { hadError = true; setError(true); } }
          } catch { /* skip */ }
        }
      }
      // Persist this Q&A so the full chat page shows it on load
      if (fullReply && !hadError) {
        const existing = loadMessages() ?? [];
        saveMessages([
          ...existing,
          { role: "user",      content: q         },
          { role: "assistant", content: fullReply  },
        ]);
      }
    } catch (e: unknown) {
      if ((e as Error).name !== "AbortError") setError(true);
    } finally {
      setStreaming(false);
    }
  }

  function handleForm(e: React.FormEvent) {
    e.preventDefault();
    submit(input);
  }

  const hasReply = asked !== "";

  return (
    <div className="w-full max-w-xl">

      {/* Header row */}
      <div className="mb-3 flex items-center gap-2.5">
        <span className="text-[11px] font-bold uppercase tracking-widest text-fg-faint">Ask Avocado</span>
        <span className="text-sm leading-none">🥑</span>
        <div className="h-px flex-1 bg-border" />
        <span className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full transition-colors ${streaming ? "animate-pulse bg-green-400" : "bg-green-500"}`} />
          <span className="text-[10px] text-fg-faint">{streaming ? "thinking…" : "online"}</span>
        </span>
      </div>
      <p className="mb-4 text-[12px] text-fg-faint leading-relaxed">
        Ask anything about my work, projects, or experience — powered by RAG + Gemini.
      </p>

      {/* Sample chips — hidden once a question is asked */}
      {!hasReply && (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {CHIPS.map((q, i) => (
            <button
              key={q}
              onClick={() => setInput(q)}
              disabled={streaming}
              className="animate-fade-up w-full rounded-full border border-border bg-surface-raised/70 px-3 py-2 text-left text-[11px] text-fg-muted/70 backdrop-blur-sm transition-all hover:border-indigo-400 hover:text-indigo-600 hover:opacity-100 disabled:opacity-40 sm:w-auto sm:py-1.5 dark:hover:border-indigo-600 dark:hover:text-indigo-400"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Chat window — question bubble + answer */}
      {hasReply && (
        <div className="mb-3 overflow-hidden rounded-2xl border border-zinc-800/70 bg-zinc-950/90 text-[12px] font-mono backdrop-blur-sm">
          {/* User question */}
          <div className="flex gap-3 border-b border-zinc-800/50 px-4 py-3">
            <span className="mt-0.5 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-indigo-400">You</span>
            <span className="text-zinc-300 leading-relaxed">{asked}</span>
          </div>
          {/* Avocado answer */}
          <div className="flex gap-3 px-4 py-3">
            <span className="mt-0.5 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">🥑</span>
            <div className="max-h-52 overflow-y-auto text-zinc-300 leading-relaxed">
              {error ? (
                <span className="text-rose-400">
                  Connection error —{" "}
                  <Link href="/chat" className="underline">try full chat</Link>
                </span>
              ) : reply ? (
                <>
                  <Prose text={reply} />
                  {streaming && (
                    <span className="ml-0.5 inline-block h-[13px] w-1.5 animate-pulse align-text-bottom bg-indigo-400" />
                  )}
                </>
              ) : (
                <span className="inline-block h-[13px] w-1.5 animate-pulse align-text-bottom bg-indigo-400" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Input — button lives inside the rounded border */}
      <form
        onSubmit={handleForm}
        className="flex items-center rounded-full border border-border bg-bg/80 backdrop-blur-sm pl-4 pr-1 py-1 transition-all focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-400/20"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={hasReply ? "Ask another question…" : "Ask anything about Jaya…"}
          disabled={streaming}
          className="min-w-0 flex-1 bg-transparent py-2 text-base sm:text-sm text-fg placeholder:text-fg-faint focus:outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={streaming || !input.trim()}
          aria-label="Ask"
          className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white transition-colors hover:bg-indigo-700 disabled:opacity-40"
        >
          {streaming ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          )}
        </button>
      </form>

      {/* Footer */}
      <div className="mt-2 flex items-center justify-between">
        <p className="text-[10px] text-fg-faint">Gemini · BGE-base · BM25 · RRF · knowledge graph</p>
        <Link
          href="/chat"
          className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
        >
          Full chat
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M7 17L17 7M17 7H7M17 7v10"/>
          </svg>
        </Link>
      </div>

    </div>
  );
}

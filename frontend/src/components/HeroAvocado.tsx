"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api/client";

const CHIPS = [
  "How did Jaya cut RAG latency by 78%?",
  "Tell me about the Qualcomm hackathon win",
  "What's Jaya's production AI stack?",
  "What would Jaya bring to my team?",
];

/** Minimal inline renderer: **bold**, newlines. No extra deps. */
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
  const [input, setInput]       = useState("");
  const [asked, setAsked]       = useState("");
  const [reply, setReply]       = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError]       = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function submit(q: string) {
    q = q.trim();
    if (!q || streaming) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setAsked(q);
    setInput("");
    setReply("");
    setError(false);
    setStreaming(true);

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
            if (msg.token) setReply((p) => p + msg.token);
            if (msg.done || msg.error) { setStreaming(false); if (msg.error) setError(true); }
          } catch { /* skip */ }
        }
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
    <div className="max-w-xl w-full rounded-2xl border border-border overflow-hidden shadow-sm bg-surface">

      {/* Terminal title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-raised border-b border-border select-none">
        <span className="w-3 h-3 rounded-full bg-zinc-300 dark:bg-zinc-600" />
        <span className="w-3 h-3 rounded-full bg-zinc-300 dark:bg-zinc-600" />
        <span className="w-3 h-3 rounded-full bg-zinc-300 dark:bg-zinc-600" />
        <span className="mx-auto text-[11px] font-semibold uppercase tracking-widest text-fg-faint">
          🥑 avocado · live demo
        </span>
        <span className="flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full transition-colors ${streaming ? "bg-green-400 animate-pulse" : "bg-green-500"}`} />
          <span className="text-[10px] text-fg-faint">{streaming ? "thinking…" : "online"}</span>
        </span>
      </div>

      <div className="p-4 space-y-3">

        {/* Sample question chips — hide once a question is asked */}
        {!hasReply && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-fg-faint">Try asking</p>
            <div className="flex flex-wrap gap-1.5">
              {CHIPS.map((q) => (
                <button
                  key={q}
                  onClick={() => submit(q)}
                  disabled={streaming}
                  className="rounded-full border border-border bg-surface-raised px-3 py-1 text-[11px] text-fg-muted hover:border-indigo-400 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-40 text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Response terminal block */}
        {hasReply && (
          <div className="rounded-xl bg-zinc-950 border border-zinc-800 text-[12px] font-mono overflow-hidden">
            {/* prompt line */}
            <div className="px-4 pt-3 pb-1.5 border-b border-zinc-800/60">
              <span className="text-indigo-400">›</span>
              <span className="text-zinc-300 ml-2">{asked}</span>
            </div>
            {/* response */}
            <div className="px-4 py-3 text-zinc-300 leading-relaxed max-h-52 overflow-y-auto">
              {error ? (
                <span className="text-rose-400">Connection error — <Link href="/chat" className="underline">try full chat</Link></span>
              ) : reply ? (
                <>
                  <Prose text={reply} />
                  {streaming && (
                    <span className="inline-block w-1.5 h-[13px] bg-indigo-400 ml-0.5 align-text-bottom animate-pulse" />
                  )}
                </>
              ) : (
                <span className="inline-block w-1.5 h-[13px] bg-indigo-400 animate-pulse align-text-bottom" />
              )}
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleForm} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={hasReply ? "Ask another question…" : "e.g. How did Jaya optimize the LangGraph system?"}
            disabled={streaming}
            className="flex-1 min-w-0 rounded-xl border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:border-indigo-400 transition-colors disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            aria-label="Ask"
            className="shrink-0 w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            {streaming ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between pt-0.5">
          <p className="text-[10px] text-fg-faint">Gemini · BGE-base · BM25 · RRF · knowledge graph</p>
          <Link
            href="/chat"
            className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-0.5"
          >
            Full chat
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M7 17L17 7M17 7H7M17 7v10"/>
            </svg>
          </Link>
        </div>

      </div>
    </div>
  );
}

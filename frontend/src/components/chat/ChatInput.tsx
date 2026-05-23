"use client";

import { useRef, useState, useEffect } from "react";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  prefill?: string;
  onPrefillConsumed?: () => void;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition: new () => any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition: new () => any;
  }
}

export default function ChatInput({ onSend, disabled, prefill, onPrefillConsumed }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported] = useState(
    () => typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  );

  // Populate textarea when a suggestion chip is clicked
  useEffect(() => {
    if (!prefill || !textareaRef.current) return;
    textareaRef.current.value = prefill;
    resize();
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(prefill.length, prefill.length);
    onPrefillConsumed?.();
  }, [prefill]); // eslint-disable-line react-hooks/exhaustive-deps

  function resize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  function submit() {
    const value = textareaRef.current?.value.trim();
    if (!value || disabled) return;
    onSend(value);
    if (textareaRef.current) {
      textareaRef.current.value = "";
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function toggleVoice() {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join("");
      if (textareaRef.current) { textareaRef.current.value = transcript; resize(); }
    };
    recognition.onend = () => { setIsListening(false); textareaRef.current?.focus(); };
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  }

  return (
    <div className="flex items-end gap-2 rounded-full border border-border bg-surface px-4 py-3 shadow-sm transition-shadow focus-within:shadow-md focus-within:border-indigo-400">
      <textarea
        ref={textareaRef}
        rows={1}
        placeholder={isListening ? "Listening…" : "Ask about experience, projects, skills…"}
        className="flex-1 resize-none bg-transparent text-base sm:text-sm leading-relaxed text-fg placeholder:text-fg-faint focus:outline-none"
        onKeyDown={handleKeyDown}
        disabled={disabled}
        style={{ maxHeight: "120px" }}
        onInput={resize}
      />

      {voiceSupported && (
        <button
          type="button"
          onClick={toggleVoice}
          disabled={disabled}
          aria-label={isListening ? "Stop recording" : "Voice input"}
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-40"
          style={isListening ? { background: "#fee2e2", color: "#ef4444" } : { background: "#f4f4f5", color: "#71717a" }}
        >
          {isListening ? (
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          )}
        </button>
      )}

      <button
        onClick={submit}
        disabled={disabled}
        aria-label="Send"
        className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-40 transition-colors shadow-sm"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

const STEPS = [
  { icon: "🥑", text: "Slicing open the avocado…" },
  { icon: "🥄", text: "Mashing in Jaya's experience…" },
  { icon: "🍞", text: "Toasting the context bread…" },
  { icon: "🍋", text: "Squeezing in a dash of relevance…" },
  { icon: "🌿", text: "Layering on the freshest insights…" },
  { icon: "🧂", text: "Seasoning with precision…" },
  { icon: "✨", text: "Almost ready to serve…" },
];

export default function LoadingGame() {
  const [step, setStep] = useState(0);
  const [coldStart, setColdStart] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s < STEPS.length - 1 ? s + 1 : s));
    }, 1800);
    const coldTimer = setTimeout(() => setColdStart(true), 6000);
    return () => {
      clearInterval(interval);
      clearTimeout(coldTimer);
    };
  }, []);

  return (
    <div className="space-y-2 animate-in fade-in duration-300">

      {coldStart && (
        <div className="flex justify-start gap-3">
          <div className="w-7 shrink-0" />
          <div className="animate-in fade-in duration-500 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 flex items-start gap-2 max-w-[80%] sm:max-w-[75%]">
            <span className="text-sm shrink-0 mt-px">⏳</span>
            <div>
              <p className="text-[11px] font-semibold text-amber-700">Avocado is waking up…</p>
              <p className="text-[10px] text-amber-600 mt-0.5">
                First response takes ~20–30 s on cold start. Subsequent ones are instant.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Matches the assistant ChatMessage layout exactly */}
      <div className="flex justify-start gap-3">
        {/* Avatar — same as ChatMessage */}
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-base mt-0.5">
          🥑
        </div>

        {/* Bubble — same shape/border as ChatMessage */}
        <div className="max-w-[80%] sm:max-w-[75%] rounded-2xl rounded-tl-sm border border-zinc-200 bg-white px-4 py-2.5 shadow-sm">
          <div className="flex items-center gap-2.5">
            {/* Step icon animates in when it changes */}
            <span
              key={step}
              className="text-base leading-none animate-in zoom-in duration-200 shrink-0"
            >
              {STEPS[step].icon}
            </span>
            <span className="text-sm text-zinc-500 leading-relaxed">
              {STEPS[step].text}
            </span>
            {/* Bouncing dots — same style as ChatMessage streaming dots */}
            <span className="inline-flex gap-1 items-center shrink-0 ml-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 animate-bounce [animation-delay:300ms]" />
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}

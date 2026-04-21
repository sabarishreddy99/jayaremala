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
  const [visibleCount, setVisibleCount] = useState(1);
  const [coldStart, setColdStart] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleCount((c) => (c < STEPS.length ? c + 1 : c));
    }, 1800);
    const coldTimer = setTimeout(() => setColdStart(true), 6000);
    return () => {
      clearInterval(interval);
      clearTimeout(coldTimer);
    };
  }, []);

  return (
    <div className="space-y-3 animate-in fade-in duration-300">

      {coldStart && (
        <div className="animate-in fade-in duration-500 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 flex items-start gap-2.5">
          <span className="text-base shrink-0 mt-px">🥑</span>
          <div>
            <p className="text-[11px] font-semibold text-amber-700 leading-snug">
              Avocado is waking up…
            </p>
            <p className="text-[10px] text-amber-600 leading-relaxed mt-0.5">
              First response takes ~20–30 s on cold start. Subsequent ones are instant.
            </p>
          </div>
        </div>
      )}

      {/* Sandwich card */}
      <div className="flex gap-3 items-start">
        {/* Avatar */}
        <div className="shrink-0 w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-base select-none">
          🥑
        </div>

        <div className="flex-1 rounded-2xl rounded-tl-sm border border-indigo-100 bg-white shadow-sm px-4 py-3.5 space-y-1">

          {/* Header */}
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
              Making your sandwich
            </span>
            <span className="flex gap-[3px] ml-auto">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1 h-1 rounded-full bg-indigo-300 animate-bounce"
                  style={{ animationDelay: `${i * 0.18}s` }}
                />
              ))}
            </span>
          </div>

          {/* Steps */}
          <div className="space-y-2">
            {STEPS.slice(0, visibleCount).map((step, i) => {
              const isActive = i === visibleCount - 1;
              const isDone = i < visibleCount - 1;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-1 duration-300 ${
                    isDone ? "opacity-35" : "opacity-100"
                  }`}
                >
                  {/* Connector line above (for all but first) */}
                  <div className="flex flex-col items-center self-stretch shrink-0 w-5">
                    {i > 0 && (
                      <div className={`w-px flex-1 mb-0.5 ${isDone ? "bg-zinc-100" : "bg-indigo-100"}`} />
                    )}
                    <span className={`text-sm leading-none ${isDone ? "grayscale opacity-60" : ""}`}>
                      {step.icon}
                    </span>
                  </div>

                  {/* Text */}
                  <span className={`text-[12px] leading-relaxed flex-1 ${
                    isActive ? "text-zinc-700 font-medium" : "text-zinc-400"
                  }`}>
                    {step.text}
                    {isActive && (
                      <span className="inline-flex gap-px ml-0.5">
                        {[0, 1, 2].map((j) => (
                          <span
                            key={j}
                            className="inline-block w-[3px] h-[3px] rounded-full bg-indigo-400 animate-bounce"
                            style={{ animationDelay: `${j * 0.15}s` }}
                          />
                        ))}
                      </span>
                    )}
                  </span>

                  {/* Done checkmark */}
                  {isDone && (
                    <span className="text-[10px] text-zinc-300 shrink-0">✓</span>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const HINTS = [
  "Avocado is digging through Jaya's experience…",
  "Consulting the guacamole oracle…",
  "Ripening the perfect answer…",
  "Searching across 66 knowledge chunks…",
  "Avocado never lies — just takes a moment…",
  "Fetching the freshest context…",
];

const COMBO_LABELS = ["Nice!", "Sweet!", "On fire! 🔥", "Unstoppable! 💥", "LEGEND 🥑"];
const GRID = 9;

// speed tier: [showMs, intervalMs]
const SPEEDS = [
  [950, 750],
  [800, 600],
  [650, 500],
  [500, 380],
  [380, 270],
];

function speedTier(score: number) {
  const idx = Math.min(Math.floor(score / 3), SPEEDS.length - 1);
  return SPEEDS[idx];
}

export default function LoadingGame() {
  const [cells, setCells] = useState<Record<number, "avocado" | "bomb" | "hit" | "miss">>({});
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [streak, setStreak] = useState(0);
  const [combo, setCombo] = useState<string | null>(null);
  const [hint] = useState(() => HINTS[Math.floor(Math.random() * HINTS.length)]);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const comboRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showCombo = useCallback((s: number) => {
    const label = COMBO_LABELS[Math.min(Math.floor((s - 1) / 2), COMBO_LABELS.length - 1)];
    setCombo(label);
    if (comboRef.current) clearTimeout(comboRef.current);
    comboRef.current = setTimeout(() => setCombo(null), 700);
  }, []);

  const scheduleNext = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (hideRef.current) clearTimeout(hideRef.current);

    const [showMs, intervalMs] = speedTier(scoreRef.current);

    function pop() {
      if (livesRef.current <= 0) return;
      const idx = Math.floor(Math.random() * GRID);
      const isBomb = Math.random() < 0.18;
      setCells({ [idx]: isBomb ? "bomb" : "avocado" });
      hideRef.current = setTimeout(() => {
        setCells((prev) => {
          if (prev[idx] === "avocado") {
            // missed avocado — lose a life
            livesRef.current = Math.max(0, livesRef.current - 1);
            setLives(livesRef.current);
            setStreak(0);
            return { [idx]: "miss" };
          }
          return {};
        });
        setTimeout(() => setCells({}), 250);
      }, showMs);
    }

    pop();
    timerRef.current = setInterval(pop, showMs + intervalMs);
  }, []);

  useEffect(() => {
    scheduleNext();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (hideRef.current) clearTimeout(hideRef.current);
      if (comboRef.current) clearTimeout(comboRef.current);
    };
  }, [scheduleNext]);

  function handleClick(idx: number) {
    const type = cells[idx];
    if (!type || type === "hit" || type === "miss") return;

    if (type === "bomb") {
      livesRef.current = Math.max(0, livesRef.current - 1);
      setLives(livesRef.current);
      setStreak(0);
      setCells({ [idx]: "miss" });
      setTimeout(() => setCells({}), 250);
      return;
    }

    // hit avocado
    const newScore = scoreRef.current + 1;
    scoreRef.current = newScore;
    setScore(newScore);
    setStreak((s) => {
      const ns = s + 1;
      if (ns >= 2) showCombo(ns);
      return ns;
    });
    setCells({ [idx]: "hit" });
    setTimeout(() => setCells({}), 200);
    scheduleNext();
  }

  // reset when lives hit 0
  useEffect(() => {
    if (lives <= 0) {
      setTimeout(() => {
        livesRef.current = 3;
        scoreRef.current = 0;
        setLives(3);
        setScore(0);
        setStreak(0);
        setCells({});
        scheduleNext();
      }, 800);
    }
  }, [lives, scheduleNext]);

  const cellEntry = (i: number) => {
    const state = cells[i];
    if (state === "avocado") return { emoji: "🥑", bg: "bg-indigo-50 border-indigo-300 scale-110 shadow-md" };
    if (state === "bomb")   return { emoji: "💣", bg: "bg-red-50 border-red-300 scale-110 shadow-md" };
    if (state === "hit")    return { emoji: "✨", bg: "bg-green-50 border-green-300" };
    if (state === "miss")   return { emoji: "💨", bg: "bg-zinc-100 border-zinc-200" };
    return { emoji: "", bg: "bg-zinc-50 border-zinc-100" };
  };

  return (
    <div className="animate-in fade-in duration-300 mx-auto max-w-xs w-full">
      <div className="rounded-2xl border border-indigo-100 bg-white shadow-md px-5 py-4 space-y-3">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">🥑</span>
            <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
              Whack-an-Avocado
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="text-zinc-400">
              ❤️ <span className={lives <= 1 ? "text-red-500" : "text-zinc-600"}>{lives}</span>
            </span>
            <span className="text-zinc-400">
              Score <span className="text-indigo-600">{score}</span>
            </span>
          </div>
        </div>

        {/* Speed bar */}
        <div className="w-full h-1 rounded-full bg-zinc-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-indigo-400 transition-all duration-500"
            style={{ width: `${Math.min((score / 15) * 100, 100)}%` }}
          />
        </div>

        {/* Grid */}
        <div className="relative">
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: GRID }).map((_, i) => {
              const { emoji, bg } = cellEntry(i);
              return (
                <button
                  key={i}
                  onClick={() => handleClick(i)}
                  className={`h-12 rounded-xl border-2 transition-all duration-100 flex items-center justify-center text-xl select-none ${bg} ${cells[i] ? "cursor-pointer" : "cursor-default"}`}
                >
                  {emoji}
                </button>
              );
            })}
          </div>

          {/* Combo popup */}
          {combo && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-sm font-black text-indigo-600 bg-white/90 rounded-full px-3 py-1 shadow animate-in zoom-in duration-150">
                {combo}
              </span>
            </div>
          )}

          {/* Game over flash */}
          {lives === 0 && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/80 pointer-events-none">
              <span className="text-xs font-bold text-red-400">Resetting…</span>
            </div>
          )}
        </div>

        {/* Streak + hint */}
        <div className="flex items-center justify-between">
          {streak >= 2 ? (
            <span className="text-[10px] font-semibold text-orange-500">🔥 {streak} streak</span>
          ) : (
            <span className="text-[10px] text-zinc-300">tap 🥑 · avoid 💣</span>
          )}
          <p className="text-[10px] text-zinc-400 text-right max-w-[55%] leading-relaxed">{hint}</p>
        </div>

      </div>
    </div>
  );
}

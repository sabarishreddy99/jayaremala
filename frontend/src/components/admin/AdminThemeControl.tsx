"use client";

import { useTheme } from "next-themes";

type ThemeMode = "light" | "dark" | "system";

const OPTIONS: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
  {
    value: "light",
    label: "Light",
    icon: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/></>,
  },
  {
    value: "dark",
    label: "Dark",
    icon: <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>,
  },
  {
    value: "system",
    label: "Auto",
    icon: <><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 22h8M12 18v4"/></>,
  },
];

export default function AdminThemeControl() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-medium text-fg-muted">Appearance</span>
        <span className="text-[10px] text-fg-faint">Saved automatically</span>
      </div>
      <div className="grid grid-cols-3 gap-1 rounded-full border border-border bg-bg p-1" aria-label="Admin color theme">
        {OPTIONS.map((option) => {
          const selected = theme === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value)}
              aria-pressed={selected}
              className={`flex min-h-9 items-center justify-center gap-1.5 rounded-full px-2 text-[11px] font-medium transition-colors ${
                selected ? "bg-accent text-accent-fg" : "text-fg-subtle hover:bg-surface-raised hover:text-fg"
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                {option.icon}
              </svg>
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

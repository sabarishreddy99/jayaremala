"use client";

export interface StepEvent {
  tool: string;
  status: "running" | "done";
  ms?: number;
}

const META: Record<string, { label: string; icon: string }> = {
  search_knowledge: { label: "Searching knowledge base", icon: "🔍" },
  get_profile:      { label: "Reading profile", icon: "👤" },
  get_experience:   { label: "Reading work history", icon: "💼" },
  get_projects:     { label: "Reading projects", icon: "🛠️" },
  get_project:      { label: "Looking up a project", icon: "🛠️" },
  get_skills:       { label: "Reading skills", icon: "🧠" },
  get_education:    { label: "Reading education", icon: "🎓" },
  get_now:          { label: "Checking what he's up to now", icon: "📍" },
  get_resume:       { label: "Fetching resume", icon: "📄" },
  check_availability: { label: "Checking availability", icon: "📅" },
  get_booking_link:   { label: "Finding open times to meet", icon: "📅" },
};

export default function AgentSteps({ steps }: { steps: StepEvent[] }) {
  if (!steps || steps.length === 0) return null;
  return (
    <div className="my-2 flex flex-col gap-1">
      {steps.map((s, i) => {
        const m = META[s.tool] ?? { label: s.tool, icon: "⚙️" };
        const running = s.status === "running";
        return (
          <div
            key={`${s.tool}-${i}`}
            className="inline-flex items-center gap-2 self-start rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] animate-[fadeUp_0.25s_ease_forwards]"
          >
            <span aria-hidden className="text-[12px] leading-none">{m.icon}</span>
            <span className={running ? "text-fg-muted" : "text-fg-faint"}>{m.label}</span>
            {running ? (
              <span className="flex gap-0.5" aria-label="running">
                <span className="w-1 h-1 rounded-full bg-accent animate-bounce [animation-delay:0ms]" />
                <span className="w-1 h-1 rounded-full bg-accent animate-bounce [animation-delay:150ms]" />
                <span className="w-1 h-1 rounded-full bg-accent animate-bounce [animation-delay:300ms]" />
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-emerald-500">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                {s.ms != null && (
                  <span className="font-mono tabular-nums text-fg-faint">{Math.round(s.ms)}ms</span>
                )}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

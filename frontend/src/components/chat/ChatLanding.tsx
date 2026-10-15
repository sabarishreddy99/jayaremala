"use client";

import SeedRing from "@/components/portfolio/SeedRing";
import { profile } from "@/data/profile";
import { formatModel } from "@/lib/chat-model";

export type PersonaOption = { id: string; label: string; hint: string };
export type LandingPrompt = { label: string; full: string; category?: string };

type ChatLandingProps = {
  personas: PersonaOption[];
  persona: string | null;
  onChoosePersona: (id: string) => void;
  activePrompts: LandingPrompt[];
  onPrompt: (full: string) => void;
  backendStatus: "checking" | "ready" | "warming";
  activeModel: string | null;
  onBook: () => void;
  greeting: string;
};

const linkIcon = (d: string) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

/** Drawn at one stroke weight, matching the prompt and calendar icons in this
 *  file. These were ◎ ◈ ◉ ◇ — four Unicode shapes at four optical weights. */
export const INTERNAL_LINKS = [
  { href: "/experience", label: "Experience", icon: linkIcon("M2 7h20v14H2zM16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2") },
  { href: "/projects", label: "Projects", icon: linkIcon("M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z") },
  { href: "/education", label: "Education", icon: linkIcon("M22 10v6M2 10l10-5 10 5-10 5zM6 12v5c3 3 9 3 12 0v-5") },
  { href: "/blog", label: "Blog", icon: linkIcon("M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z") },
];

/** Staggered entrance without inventing new motion — reuses .animate-fade-up. */
function delay(i: number) {
  return { animationDelay: `${i * 70}ms` } as const;
}

/** Prompt cards are dealt like the home page's testimonial deck: small tilts,
 *  faces cycling Skin / Paper / Flesh, straightening on hover. */
const FACES = ["skin", "paper", "flesh"] as const;
const TILTS = [-2, 1.5, -1, 2, -1.5, 1];

export default function ChatLanding({
  personas,
  persona,
  onChoosePersona,
  activePrompts,
  onPrompt,
  backendStatus,
  activeModel,
  onBook,
  greeting,
}: ChatLandingProps) {
  return (
    <div className="mx-auto w-full max-w-3xl lg:max-w-4xl px-1 pt-6 sm:pt-10 pb-4">
      {/* ── Identity: the seed, with a sentence turning around it ── */}
      <div className="mb-8 flex flex-col items-center text-center animate-fade-up sm:mb-10">
        <SeedRing text="Ask Avocado · answers from Jaya's own knowledge base · " size={104} />
        <h1 className="display-serif display-lg mt-5 text-fg">Ask me anything about Jaya</h1>
        <p className="mt-2 text-[0.9375rem] text-fg-subtle">{greeting}! I&apos;m Avocado, his AI assistant.</p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-mono text-[0.6875rem] text-fg-subtle">
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${backendStatus === "warming" ? "bg-fg-faint animate-pulse" : "bg-accent"}`}
            aria-hidden
          />
          <span className="text-fg-muted">{backendStatus === "warming" ? "Waking up…" : "Online"}</span>
          <span aria-hidden>·</span>
          <span>{formatModel(activeModel, "Gemini 2.5 Flash")}</span>
          <span className="hidden sm:inline" aria-hidden>·</span>
          <span className="hidden sm:inline">Hybrid RAG → BM25 + vectors → RRF</span>
        </div>
      </div>

      {/* ── Who's asking: one segmented control ── */}
      <div className="mb-8 flex flex-col items-center gap-2 animate-fade-up" style={delay(1)}>
        <div role="group" aria-label="Tailor answers for" className="inline-flex rounded-full border border-border bg-surface p-1">
          {personas.map((p) => {
            const selected = persona === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onChoosePersona(p.id)}
                title={p.hint}
                aria-pressed={selected}
                className={`rounded-full px-4 py-2 text-[0.8125rem] font-medium transition-colors duration-200 ${
                  selected ? "bg-accent text-accent-fg" : "text-fg-muted hover:text-fg"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-fg-faint">
          {persona
            ? `${personas.find((p) => p.id === persona)?.hint} · tap again to clear`
            : "I'm a… — answers lead with what matters to you"}
        </p>
      </div>

      {/* ── Pick a card ── */}
      <ul className="grid grid-cols-1 gap-4 px-2 sm:grid-cols-2 lg:grid-cols-3">
        {activePrompts.map((p, i) => (
          <li key={p.full} className="animate-fade-up" style={delay(i + 2)}>
            <button
              onClick={() => onPrompt(p.full)}
              data-face={FACES[i % FACES.length]}
              style={{ "--tilt": `${TILTS[i % TILTS.length]}deg` } as React.CSSProperties}
              className="prompt-card group flex h-full min-h-[7.5rem] w-full flex-col justify-between rounded-card p-5 text-left"
            >
              {p.category && (
                <span className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] opacity-70">{p.category}</span>
              )}
              <span className="mt-4 flex items-end justify-between gap-3">
                <span className="display-serif text-[1.35rem] leading-tight">{p.label}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden
                  className="shrink-0 opacity-60 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100">
                  <path d="M7 17 17 7M7 7h10v10" />
                </svg>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {/* ── The two other doors ── */}
      <div className="mt-6 grid gap-4 px-2 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <button
          onClick={onBook}
          aria-label="Book a call with Jaya"
          className="group flex items-center justify-between gap-4 rounded-card border border-border bg-surface p-5 text-left transition-colors hover:border-border-strong animate-fade-up"
          style={delay(9)}
        >
          <span>
            <span className="block text-[0.9375rem] font-semibold text-fg">Rather talk to Jaya?</span>
            <span className="mt-0.5 block text-sm text-fg-subtle">See open 30-minute slots and book one.</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-transform duration-200 group-hover:translate-x-0.5">
            Book a call →
          </span>
        </button>

        <nav aria-label="Explore the site" className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-card border border-border p-5 animate-fade-up" style={delay(10)}>
          {INTERNAL_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="inline-flex items-center gap-1.5 text-sm text-fg-muted transition-colors hover:text-fg">
              <span className="text-fg-faint" aria-hidden>{l.icon}</span>
              {l.label}
            </a>
          ))}
          {profile.resume && (
            <a href={profile.resume} target="_blank" rel="noopener noreferrer" className="text-sm text-fg-muted transition-colors hover:text-fg">Résumé ↗</a>
          )}
        </nav>
      </div>
    </div>
  );
}

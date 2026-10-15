"use client";

import { useState } from "react";
import type { Quote, QuoteCategory } from "@/data/quotes";
import { profile } from "@/data/profile";

// ── Category config ──────────────────────────────────────────────────────────

const CAT_CONFIG: Record<QuoteCategory, {
  border: string;
  badge: string;
  quote: string;
  pill: string;
  pillActive: string;
}> = {
  Work: {
    border: "border-border hover:border-border-strong",
    badge: "bg-surface-raised text-fg-muted",
    quote: "text-border",
    pill: "bg-surface border border-border text-fg-faint hover:text-fg hover:border-border-strong",
    pillActive: "bg-accent text-accent-fg border-accent shadow-sm",
  },
  Life: {
    border: "border-border hover:border-border-strong",
    badge: "bg-surface-raised text-fg-muted",
    quote: "text-border",
    pill: "bg-surface border border-border text-fg-faint hover:text-fg hover:border-border-strong",
    pillActive: "bg-accent text-accent-fg border-accent shadow-sm",
  },
  Technology: {
    border: "border-border hover:border-border-strong",
    badge: "bg-surface-raised text-fg-muted",
    quote: "text-border",
    pill: "bg-surface border border-border text-fg-faint hover:text-fg hover:border-border-strong",
    pillActive: "bg-accent text-accent-fg border-accent shadow-sm",
  },
  Philosophy: {
    border: "border-border hover:border-border-strong",
    badge: "bg-surface-raised text-fg-muted",
    quote: "text-border",
    pill: "bg-surface border border-border text-fg-faint hover:text-fg hover:border-border-strong",
    pillActive: "bg-accent text-accent-fg border-accent shadow-sm",
  },
  Creativity: {
    border: "border-border hover:border-border-strong",
    badge: "bg-surface-raised text-fg-muted",
    quote: "text-border",
    pill: "bg-surface border border-border text-fg-faint hover:text-fg hover:border-border-strong",
    pillActive: "bg-accent text-accent-fg border-accent",
  },
  Mindset: {
    border: "border-border hover:border-border-strong",
    badge: "bg-surface-raised text-fg-muted",
    quote: "text-border",
    pill: "bg-surface border border-border text-fg-faint hover:text-fg hover:border-border-strong",
    pillActive: "bg-accent text-accent-fg border-accent shadow-sm",
  },
};

const ALL_CATEGORIES: QuoteCategory[] = ["Work", "Life", "Technology", "Philosophy", "Creativity", "Mindset"];

// ── QuoteCard ────────────────────────────────────────────────────────────────

function QuoteCard({ quote }: { quote: Quote }) {
  const cfg = CAT_CONFIG[quote.category];
  return (
    <div className={`relative rounded-2xl border bg-surface p-5 shadow-sm transition-all duration-200 hover:shadow-md ${cfg.border}`}>
      {/* Category badge */}
      <div className="flex items-center justify-between mb-3">
        <span className={`inline-flex items-center text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${cfg.badge}`}>
          {quote.category}
        </span>
        <div className="flex items-center gap-1.5">
          {quote.featured && (
            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-surface-raised text-fg-muted border border-border">
              Featured
            </span>
          )}
          {quote.favorite && (
            <span className="text-accent text-sm" title="Favorite" aria-hidden>★</span>
          )}
        </div>
      </div>

      {/* Large opening quote mark */}
      <div className={`text-6xl font-serif leading-none mb-1 select-none ${cfg.quote}`} aria-hidden>
        ❝
      </div>

      {/* Quote text */}
      <p className="text-sm text-fg leading-relaxed">{quote.text}</p>

      {/* Divider + attribution */}
      <div className="mt-4 pt-3 border-t border-border">
        <p className="text-xs font-semibold text-fg-muted">{quote.author}</p>
        {quote.source && (
          <p className="text-[10px] text-fg-faint italic mt-0.5">{quote.source}</p>
        )}
      </div>
    </div>
  );
}

// ── FeaturedQuote ────────────────────────────────────────────────────────────

function FeaturedQuote({ quote }: { quote: Quote }) {
  const cfg = CAT_CONFIG[quote.category];
  return (
    <div className={`relative rounded-3xl border-2 bg-surface p-8 sm:p-10 overflow-hidden ${cfg.border}`}>
      {/* Background decorative quote mark */}
      <div className={`absolute -top-4 -left-2 text-[120px] font-serif leading-none select-none pointer-events-none ${cfg.quote} opacity-60`} aria-hidden>
        ❝
      </div>

      <div className="relative z-10">
        <span className={`inline-flex items-center text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-6 ${cfg.badge}`}>
          Featured · {quote.category}
        </span>
        <blockquote className="text-xl sm:text-2xl font-medium text-fg leading-snug italic">
          {quote.text}
        </blockquote>
        <div className="mt-6 flex items-center gap-2">
          <div className="h-px flex-1 max-w-12 bg-border" />
          <p className="text-sm font-semibold text-fg-muted">
            {quote.author}
            {quote.source && <span className="text-fg-faint font-normal">, <em>{quote.source}</em></span>}
          </p>
          <span className="text-accent" aria-hidden>★</span>
        </div>
      </div>
    </div>
  );
}

// ── Quote of the Week ────────────────────────────────────────────────────────

function getQuoteOfWeek(quotes: Quote[]): Quote {
  const weekIndex = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  return quotes[weekIndex % quotes.length];
}

function WeeklyQuote({ quote }: { quote: Quote }) {
  const cfg = CAT_CONFIG[quote.category];
  return (
    <div className="relative rounded-card border border-border-strong bg-surface-raised p-6 sm:p-7 overflow-hidden mb-10">
      <div className="absolute top-3 right-4 text-[11px] font-bold uppercase tracking-widest text-accent flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse inline-block" />
        Quote of the Week
      </div>
      <div className={`text-5xl font-serif leading-none mb-3 select-none ${cfg.quote} opacity-80`} aria-hidden>❝</div>
      <blockquote className="text-base sm:text-lg font-medium text-fg leading-relaxed italic mb-4">
        {quote.text}
      </blockquote>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-fg-muted">
          {quote.author}
          {quote.source && <span className="text-fg-faint font-normal">, <em>{quote.source}</em></span>}
        </p>
        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${cfg.badge}`}>
          {quote.category}
        </span>
      </div>
    </div>
  );
}

// ── Main Client Component ────────────────────────────────────────────────────

export default function QuotesClient({ quotes }: { quotes: Quote[] }) {
  const [activeCategory, setActiveCategory] = useState<QuoteCategory | "All">("All");

  const featured = quotes.find((q) => q.featured);
  const weeklyQuote = getQuoteOfWeek(quotes);

  const filtered = activeCategory === "All"
    ? quotes
    : quotes.filter((q) => q.category === activeCategory);

  const countByCategory = ALL_CATEGORIES.reduce<Record<string, number>>((acc, cat) => {
    acc[cat] = quotes.filter((q) => q.category === cat).length;
    return acc;
  }, {});

  const favoriteCount = quotes.filter((q) => q.favorite).length;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-12 sm:py-16">

      {/* Hero */}
      <div className="mb-14 sm:mb-16">
        <p className="text-[11px] font-medium tracking-wide text-fg-subtle mb-3">
          Collected Wisdom
        </p>


        <h1 className="display-serif display-md text-fg mb-2">
          Favorite Quotes
        </h1>
        {profile.page_quotes && (
          <p className="text-sm text-fg-subtle mb-6 max-w-lg">
            {profile.page_quotes}
          </p>
        )}

        {/* Stats chips */}
        <div className="flex flex-wrap gap-2">
          {[
            { label: `${quotes.length} quotes` },
            { label: `${ALL_CATEGORIES.length} categories` },
            { label: `${favoriteCount} favorites` },
          ].map(({ label }) => (
            <span
              key={label}
              className="inline-flex items-center text-[11px] font-medium text-fg-muted bg-surface border border-border rounded-full px-3 py-1"
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Quote of the Week */}
      <WeeklyQuote quote={weeklyQuote} />

      {/* Featured quote */}
      {featured && featured.id !== weeklyQuote.id && (
        <div className="mb-12">
          <FeaturedQuote quote={featured} />
        </div>
      )}

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        {/* All pill */}
        <button
          onClick={() => setActiveCategory("All")}
          className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-3.5 py-1.5 border transition-all duration-150 ${
            activeCategory === "All"
              ? "bg-accent text-accent-fg border-accent shadow-sm"
              : "bg-surface border-border text-fg-faint hover:text-fg"
          }`}
        >
          All
          <span className={`text-[10px] font-semibold rounded-full px-1.5 py-0.5 ${
            activeCategory === "All" ? "bg-bg/20 text-bg" : "bg-surface-raised text-fg-faint"
          }`}>
            {quotes.length}
          </span>
        </button>

        {ALL_CATEGORIES.map((cat) => {
          const cfg = CAT_CONFIG[cat];
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-3.5 py-1.5 border transition-all duration-150 ${
                isActive ? cfg.pillActive : cfg.pill
              }`}
            >
              {cat}
              <span className={`text-[10px] font-semibold rounded-full px-1.5 py-0.5 ${
                isActive ? "bg-white/20 text-white" : "bg-surface-raised text-fg-faint"
              }`}>
                {countByCategory[cat]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Masonry grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-sm text-fg-faint">No quotes in this category yet.</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 xl:columns-3 gap-4">
          {filtered.map((quote) => (
            <div key={quote.id} className="break-inside-avoid mb-4">
              <QuoteCard quote={quote} />
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

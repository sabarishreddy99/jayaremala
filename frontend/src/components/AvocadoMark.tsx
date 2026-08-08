/**
 * The avocado mark: an emerald body with an amber pit.
 *
 * Drawn rather than the 🥑 emoji the rest of the site uses, because at marker
 * size an emoji renders differently on every platform and its full-colour
 * weight fights the hairline rules it sits on. Both hues already exist in the
 * palette (emerald for live status, amber for award badges), so it reads as an
 * avocado without introducing a new colour.
 */
export default function AvocadoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path
        d="M12 3c-2 0-3.3 1.9-3.8 3.9-.4 1.6-1.4 2.7-2 4.2-.5 1.3-.7 2.4-.7 3.3 0 3.3 2.9 5.6 6.5 5.6s6.5-2.3 6.5-5.6c0-.9-.2-2-.7-3.3-.6-1.5-1.6-2.6-2-4.2C15.3 4.9 14 3 12 3Z"
        className="stroke-emerald-600/70 dark:stroke-emerald-400/60"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="15.1" r="2.5" className="fill-amber-600/60 dark:fill-amber-500/50" />
    </svg>
  );
}

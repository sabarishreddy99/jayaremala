/**
 * The avocado mark: a Skin rind (Flesh in dark mode) around a Pit stone.
 *
 * Drawn rather than the 🥑 emoji the rest of the site uses, because at marker
 * size an emoji renders differently on every platform and its full-colour
 * weight fights the hairline rules it sits on. The colours are the portfolio's
 * own Avocado palette, with literal fallbacks for surfaces outside it.
 */
export default function AvocadoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path
        d="M12 3c-2 0-3.3 1.9-3.8 3.9-.4 1.6-1.4 2.7-2 4.2-.5 1.3-.7 2.4-.7 3.3 0 3.3 2.9 5.6 6.5 5.6s6.5-2.3 6.5-5.6c0-.9-.2-2-.7-3.3-.6-1.5-1.6-2.6-2-4.2C15.3 4.9 14 3 12 3Z"
        className="stroke-[var(--skin,#3b4320)] dark:stroke-[var(--flesh,#d8de8a)]"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="15.1" r="2.5" className="fill-[var(--pit,#7a4a2b)] dark:fill-[#a46a3f]" />
    </svg>
  );
}

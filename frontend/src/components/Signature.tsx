/**
 * The signature mark — a fine-nib italic line over a rule that draws itself,
 * standing in for a handwritten signature. This is the personal mark on a site
 * that deliberately carries no portrait.
 */
export default function Signature({
  text,
  className = "",
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  return (
    <div className={`inline-flex flex-col items-start gap-2 ${className}`}>
      <p
        className="signature-mark text-fg-subtle"
        style={{ fontSize: "clamp(1.5rem, 3.4vw, 2.25rem)" }}
      >
        {text}
      </p>
      <span
        aria-hidden
        className="ink-rule block h-[2px] w-[5.5rem] rounded-full bg-accent"
        style={{ animationDelay: `${delay}ms` }}
      />
    </div>
  );
}

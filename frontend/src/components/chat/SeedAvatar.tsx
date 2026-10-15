import AvocadoMark from "@/components/portfolio/AvocadoMark";

/**
 * Avocado's face: the pit. A seed-brown stone with the mark pressed into it in
 * Flesh. Replaces the 🥑 emoji, which rendered differently on every platform
 * and sat on an accent disc that changed hue with the theme.
 */
export default function SeedAvatar({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-grid shrink-0 place-items-center rounded-full bg-[var(--pit,#7a4a2b)] shadow-[inset_0_-3px_6px_rgb(0_0_0/0.22)] ${className}`}
      style={{ width: size, height: size }}
    >
      <AvocadoMark className="h-[58%] w-[58%] [&_*]:!stroke-[var(--flesh,#d8de8a)] [&_circle]:!fill-[var(--flesh,#d8de8a)]" />
    </span>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteGroups } from "@/lib/portfolio/site-nav";
import { pageCounts } from "@/lib/portfolio/site-stats";
import SeedAvatar from "@/components/chat/SeedAvatar";

/** Each group is one avocado face, so a colour always means the same kind of page. */
const GROUP_FACE: Record<string, "skin" | "flesh" | "paper"> = {
  Work: "skin",
  Writing: "flesh",
  Developers: "paper",
};
/** Bubble size tier: the pages most visitors want are the biggest. */
const BIG = new Set(["/projects", "/experience", "/blog"]);
const SMALL = new Set(["/now", "/quotes", "/atlas", "/education"]);

/**
 * The site map as a cluster of bubbles around the seed.
 *
 * Every page in site-nav.tsx is a bubble, coloured by its group (Work = Skin,
 * Writing = Flesh, Developers = Paper) and sized by how often a visitor wants
 * it, each carrying a real count from the knowledge files. The pit in the
 * middle is Avocado: if you don't know which bubble you want, ask.
 *
 * Used twice with one look: as the "Explore the rest" section on the home page,
 * and as the phone menu sheet. Bubbles drift gently (CSS only; off under
 * reduced motion) and lift on hover/focus. The page you are on carries a ring.
 */
export default function SiteBubbles({
  variant = "section",
  onNavigate,
}: {
  variant?: "section" | "sheet";
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = siteGroups.flatMap((g) => g.items.map((it) => ({ ...it, group: g.label })));
  const mid = Math.floor(items.length / 2);
  const sheet = variant === "sheet";

  // On lg+ the section variant lays the bubbles on an ellipse around the pit,
  // groups kept contiguous so each reads as one arc of the fruit. Positions
  // are percentages of the field; the slot is centred on its point with the
  // `translate` property so the drift animation (on `transform`) stays free.
  const ring = (i: number) => {
    const t = -Math.PI / 2 + (i / items.length) * Math.PI * 2;
    // Rounded: server and browser float maths differ in the last digits,
    // which would otherwise be a hydration mismatch on the inline style.
    return { "--x": `${(50 + Math.cos(t) * 41).toFixed(2)}%`, "--y": `${(50 + Math.sin(t) * 38).toFixed(2)}%` };
  };

  const bubbles = items.map((it, i) => {
    const size = BIG.has(it.href) ? "is-big" : SMALL.has(it.href) ? "is-small" : "is-mid";
    const active = pathname.startsWith(it.href);
    return (
      <li key={it.href} className="bubble-slot" style={{ "--d": `${(i % 5) * -1.3}s`, ...ring(i) } as React.CSSProperties}>
        <Link
          href={it.href}
          onClick={onNavigate}
          data-face={GROUP_FACE[it.group] ?? "paper"}
          aria-current={active ? "page" : undefined}
          className={`site-bubble ${size} ${active ? "is-active" : ""}`}
        >
          <span className="bubble-icon" aria-hidden>{it.icon}</span>
          <span className="display-serif bubble-label">{it.label}</span>
          <span className="bubble-meta">{pageCounts[it.href] ?? it.desc}</span>
        </Link>
      </li>
    );
  });

  const pit = (
    <li key="__pit" className="bubble-slot is-pit-slot" style={{ "--d": "-0.6s", "--x": "50%", "--y": "50%" } as React.CSSProperties}>
      <Link href="/chat" onClick={onNavigate} className="site-bubble is-pit">
        <SeedAvatar size={sheet ? 40 : 48} />
        <span className="display-serif bubble-label">Ask Avocado</span>
        <span className="bubble-meta">not sure? ask</span>
      </Link>
    </li>
  );

  return (
    <div className={sheet ? "site-bubbles is-sheet" : "site-bubbles"}>
      <ul className="bubble-field">
        {[...bubbles.slice(0, mid), pit, ...bubbles.slice(mid)]}
      </ul>
      <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-subtle" aria-label="Legend">
        {siteGroups.map((g) => (
          <li key={g.label} className="inline-flex items-center gap-2">
            <span aria-hidden data-face={GROUP_FACE[g.label]} className="legend-dot" />
            {g.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

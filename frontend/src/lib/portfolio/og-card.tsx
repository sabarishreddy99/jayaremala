/**
 * The shared social-preview card for blog posts and lab entries, rendered by
 * next/og (Satori) at build time. Avocado palette: a Skin sheet, paper ink,
 * Flesh for the accent, a Pit seed as the mark, and a halved avocado drawn in
 * Flesh line-work in the corner — the same object the site footer carries.
 *
 * Satori rules: every element with more than one child needs display:flex,
 * and only a subset of CSS (and inline SVG) is supported.
 *
 * The site-wide card (public/og-image.png, which layout.tsx points every
 * page at) is a committed static file rendered from this same component.
 * It cannot be a route at app/og-image.png/: a dot in a route segment breaks
 * Turbopack's next/font resolution. To regenerate it, temporarily add a
 * route that returns `new ImageResponse(<OgCard … />, { ...OG_SIZE, fonts })`
 * with the hero copy, fetch it, and save the PNG over public/og-image.png.
 */
export const OG_SIZE = { width: 1200, height: 630 };

/**
 * EB Garamond for the card titles, so a shared link carries the same display
 * voice as the site. Satori needs TTF/OTF bytes; Google Fonts serves TTF to a
 * plain fetch. Any failure (offline build) returns [] and the card falls back
 * to Satori's default face rather than failing the build.
 */
export async function loadOgFonts(): Promise<{ name: string; data: ArrayBuffer; weight: 600; style: "normal" }[]> {
  try {
    const css = await (await fetch("https://fonts.googleapis.com/css2?family=EB+Garamond:wght@600")).text();
    const url = css.match(/src: url\((.+?)\) format/)?.[1] ?? css.match(/url\((.+?)\)/)?.[1];
    if (!url) return [];
    const data = await (await fetch(url)).arrayBuffer();
    return [{ name: "EB Garamond", data, weight: 600, style: "normal" }];
  } catch {
    return [];
  }
}

export const AVO = {
  skin: "#3b4320",
  skinDeep: "#2b3117",
  flesh: "#d8de8a",
  pit: "#7a4a2b",
  paper: "#f4f2e6",
};

export function OgCard({
  kind,
  badge,
  title,
  description,
  chips,
  footnote,
}: {
  /** Small label above the title, e.g. "Blog" or "Lab · building in public". */
  kind: string;
  /** Top-right pill, e.g. "5 min read" or "Active". */
  badge?: { label: string; color?: string };
  title: string;
  description?: string;
  chips?: string[];
  footnote?: string;
}) {
  const titleSize = title.length > 60 ? 50 : title.length > 40 ? 58 : 66;
  const desc = description && description.length > 130 ? `${description.slice(0, 130)}…` : description;

  return (
    <div style={{ width: 1200, height: 630, background: AVO.skin, display: "flex", position: "relative", overflow: "hidden", fontFamily: "Georgia, 'Times New Roman', serif" }}>
      {/* The halved avocado, cropped by the corner. */}
      <svg width="520" height="676" viewBox="0 0 400 520" style={{ position: "absolute", right: -150, bottom: -230, opacity: 0.22 }}>
        <path d="M200 12C138 12 112 92 92 160C66 246 22 300 22 380C22 462 104 508 200 508C296 508 378 462 378 380C378 300 334 246 308 160C288 92 262 12 200 12Z" fill="none" stroke={AVO.flesh} strokeWidth="3" />
        <path d="M200 44C152 44 132 110 116 168C94 248 56 304 56 378C56 446 124 482 200 482C276 482 344 446 344 378C344 304 306 248 284 168C268 110 248 44 200 44Z" fill="none" stroke={AVO.flesh} strokeWidth="1.5" strokeDasharray="2 7" />
        <circle cx="200" cy="350" r="78" fill={AVO.flesh} fillOpacity="0.35" stroke={AVO.flesh} strokeWidth="3" />
      </svg>

      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, padding: "56px 72px" }}>
        {/* Masthead */}
        <div style={{ display: "flex", alignItems: "center", fontFamily: "system-ui, sans-serif" }}>
          <div style={{ width: 30, height: 30, borderRadius: 15, background: AVO.pit, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 10, height: 10, borderRadius: 5, background: AVO.flesh }} />
          </div>
          <span style={{ marginLeft: 12, color: AVO.flesh, fontSize: 18, letterSpacing: "0.04em" }}>jayaremala.com</span>
          {badge && (
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", border: `1px solid ${badge.color ?? AVO.flesh}`, borderRadius: 999, padding: "6px 14px" }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, background: badge.color ?? AVO.flesh, marginRight: 8 }} />
              <span style={{ color: badge.color ?? AVO.flesh, fontSize: 14, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>{badge.label}</span>
            </div>
          )}
        </div>

        {/* Title block */}
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 900 }}>
          <span style={{ color: AVO.flesh, fontSize: 18, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "system-ui, sans-serif" }}>{kind}</span>
          <div style={{ display: "flex", marginTop: 18, fontSize: titleSize, fontWeight: 600, color: AVO.paper, lineHeight: 1.08, letterSpacing: "-0.015em", fontFamily: "'EB Garamond', Georgia, serif" }}>
            {title}
          </div>
          {desc && (
            <div style={{ display: "flex", marginTop: 20, fontSize: 22, color: "rgba(244,242,230,0.72)", lineHeight: 1.45, maxWidth: 800, fontFamily: "system-ui, sans-serif" }}>
              {desc}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "system-ui, sans-serif" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            {(chips ?? []).slice(0, 4).map((c) => (
              <div key={c} style={{ display: "flex", marginRight: 10, border: "1px solid rgba(216,222,138,0.45)", borderRadius: 999, padding: "6px 14px" }}>
                <span style={{ color: AVO.flesh, fontSize: 15, fontWeight: 600 }}>{c}</span>
              </div>
            ))}
          </div>
          <span style={{ color: "rgba(244,242,230,0.62)", fontSize: 16 }}>{footnote ?? "Jaya Sabarish Reddy Remala"}</span>
        </div>
      </div>
    </div>
  );
}

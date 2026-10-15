import { ImageResponse } from "next/og";
import { getLabEntryBySlug, getAllLabSlugs } from "@/lib/content/lab";
import { OgCard, OG_SIZE, loadOgFonts, AVO } from "@/lib/portfolio/og-card";

export const dynamic = "force-static";

export function generateStaticParams() {
  return getAllLabSlugs().map((slug) => ({ slug }));
}
export const size = OG_SIZE;
export const contentType = "image/png";

// Live is Flesh; paused is a lighter Pit; shipped is plain paper.
const STATUS: Record<string, { label: string; color: string }> = {
  active:  { label: "Active",  color: AVO.flesh },
  paused:  { label: "Paused",  color: "#c9a27a" },
  shipped: { label: "Shipped", color: AVO.paper },
};

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = getLabEntryBySlug(slug);

  const title       = entry?.title       ?? slug;
  const description = entry?.description ?? "";
  const tech        = (entry?.tech ?? []).slice(0, 4);
  const status      = entry?.status ?? "active";
  const sc          = STATUS[status] ?? STATUS.active;

  return new ImageResponse(
    (
      <OgCard
        kind="Lab · building in public"
        badge={sc}
        title={title}
        description={description}
        chips={tech}
      />
    ),
    { ...size, fonts: await loadOgFonts() }
  );
}

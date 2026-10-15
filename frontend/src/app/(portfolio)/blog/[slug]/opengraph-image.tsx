import { ImageResponse } from "next/og";
import { getPostBySlug, getAllSlugs } from "@/lib/content/blog";
import { OgCard, OG_SIZE, loadOgFonts } from "@/lib/portfolio/og-card";

export const dynamic = "force-static";

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  const title       = post?.title       ?? slug;
  const description = post?.description ?? "";
  const tags        = (post?.tags ?? []).slice(0, 3);
  const readingTime = post?.readingTime ?? null;

  return new ImageResponse(
    (
      <OgCard
        kind="Blog"
        badge={readingTime ? { label: `${readingTime} min read` } : undefined}
        title={title}
        description={description}
        chips={tags.map((t) => `#${t}`)}
      />
    ),
    { ...size, fonts: await loadOgFonts() }
  );
}

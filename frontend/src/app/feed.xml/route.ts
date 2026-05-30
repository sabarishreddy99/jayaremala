import { getAllPosts } from "@/lib/blog";

export const dynamic = "force-static";

const SITE_URL  = "https://jayaremala.com";
const SITE_TITLE = "Jaya Sabarish Reddy Remala — Blog";
const SITE_DESC  = "Notes on AI systems, distributed infrastructure, and software craft.";
const AUTHOR     = "Jaya Sabarish Reddy Remala";

function escapeXml(str: string) {
  return str
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;")
    .replace(/'/g,  "&apos;");
}

export async function GET() {
  const posts = getAllPosts();

  const items = posts
    .map((post) => {
      const url = `${SITE_URL}/blog/${post.slug}`;
      const pubDate = new Date(post.publishedAt ?? post.date).toUTCString();
      const tags = post.tags.map((t) => `<category>${escapeXml(t)}</category>`).join("\n    ");
      return `
  <item>
    <title>${escapeXml(post.title)}</title>
    <link>${url}</link>
    <guid isPermaLink="true">${url}</guid>
    <description>${escapeXml(post.description)}</description>
    <pubDate>${pubDate}</pubDate>
    <author>jr6421@nyu.edu (${AUTHOR})</author>
    ${tags}
  </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${SITE_URL}/blog</link>
    <description>${escapeXml(SITE_DESC)}</description>
    <language>en-us</language>
    <managingEditor>jr6421@nyu.edu (${AUTHOR})</managingEditor>
    <webMaster>jr6421@nyu.edu (${AUTHOR})</webMaster>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${SITE_URL}/og-image.png</url>
      <title>${escapeXml(SITE_TITLE)}</title>
      <link>${SITE_URL}/blog</link>
    </image>${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

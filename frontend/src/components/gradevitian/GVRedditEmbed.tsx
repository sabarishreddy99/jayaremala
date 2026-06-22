"use client";

import { useEffect } from "react";

const REDDIT_SCRIPT = "https://embed.reddit.com/widgets.js";

/** Reddit post embed. Reddit's widgets.js swaps the blockquote for an iframe; the
 *  shared .gv-embed box then forces it to match the LinkedIn embeds exactly. The
 *  script is (re)injected on mount so the embed also renders after client-side nav. */
export default function GVRedditEmbed({
  url,
  title,
  author,
  authorUrl,
  subreddit = "Vit",
}: {
  url: string;
  title: string;
  author: string;
  authorUrl: string;
  subreddit?: string;
}) {
  useEffect(() => {
    // Drop any prior instance so re-adding forces a re-scan of unprocessed blockquotes.
    document.querySelectorAll(`script[src="${REDDIT_SCRIPT}"]`).forEach((s) => s.remove());
    const script = document.createElement("script");
    script.src = REDDIT_SCRIPT;
    script.async = true;
    script.setAttribute("charset", "UTF-8");
    document.body.appendChild(script);
    return () => { script.remove(); };
  }, []);

  return (
    <div className="gv-embed">
      <blockquote className="reddit-embed-bq" style={{ height: 700 }} data-embed-height={700}>
        <a href={url}>{title}</a>
        <br /> by <a href={authorUrl}>{author}</a> in{" "}
        <a href={`https://www.reddit.com/r/${subreddit}/`}>{subreddit}</a>
      </blockquote>
    </div>
  );
}

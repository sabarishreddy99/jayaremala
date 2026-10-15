"use client";

import useSWR from "swr";
import BlogPostMarkdown from "./BlogPostMarkdown";
import { fetchBlogPost, fetchLabEntry } from "@/lib/api/content";

type Kind = "blog" | "lab";

/**
 * Posts and lab entries written in the admin (Live, not MDX) are prerendered at
 * build time, but can be edited at any moment after. These pieces render the
 * built text first, then swap in the current version from the content API, so
 * the page always says what Avocado says. All pieces on a page share one request.
 */
type Latest = { title?: string; description?: string; content?: string } | null;

function useLatest(kind: Kind, slug: string): Latest {
  const { data } = useSWR<Latest>(
    ["live-entry", kind, slug],
    (): Promise<Latest> => (kind === "blog" ? fetchBlogPost(slug) : fetchLabEntry(slug)),
    { revalidateOnFocus: false, shouldRetryOnError: false },
  );
  return data ?? null;
}

/** One text field (title, description) — the built value until the latest arrives. */
export function LiveText({ kind, slug, field, initial }: { kind: Kind; slug: string; field: "title" | "description"; initial: string }) {
  const latest = useLatest(kind, slug);
  const value = latest?.[field];
  return <>{typeof value === "string" && value ? value : initial}</>;
}

/** The body, rendered as Markdown. */
export function LiveBody({ kind, slug, initial }: { kind: Kind; slug: string; initial: string }) {
  const latest = useLatest(kind, slug);
  return <BlogPostMarkdown content={latest?.content ?? initial} />;
}

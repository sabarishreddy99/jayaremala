"use client";

import useSWR from "swr";
import { BlogSection } from "./BlogIndexStats";
import {
  BLOG_POSTS_KEY,
  fetchBlogPosts,
  normalizeBlogPost,
  type ApiBlogPost,
} from "@/lib/api/content";

interface StaticPost {
  slug: string;
  title: string;
  date: string;
  publishedAt?: string;
  description: string;
  tags: string[];
  readingTime?: number;
  image?: string;
}

interface Props {
  /** Posts from the build-time MDX scan — used as fallback if API is unavailable */
  staticPosts: StaticPost[];
}

const fetcher = () => fetchBlogPosts();

/**
 * Wraps BlogSection with SWR so newly published posts (from the admin API)
 * appear without a site rebuild. Falls back to staticPosts if API is unreachable.
 */
export default function BlogSectionDynamic({ staticPosts }: Props) {
  const { data: apiPosts } = useSWR<ApiBlogPost[]>(BLOG_POSTS_KEY, fetcher, {
    fallbackData: undefined,
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  // If API responded: use API posts (seeded from MDX + any new admin posts)
  // If API is down: fall back to staticPosts from build time
  const posts = apiPosts
    ? apiPosts.map(normalizeBlogPost).sort(
        (a, b) => (a.publishedAt! < b.publishedAt! ? 1 : -1)
      )
    : staticPosts;

  return <BlogSection posts={posts} />;
}

"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useGvBase } from "@/lib/gradevitian/useGvBase";

/** A next/link that prepends the gradeVITian mount-point prefix to internal hrefs
 *  (so the same build works on the subdomain AND under /gradevitian). External or
 *  hash links (http…, mailto…, #…) are passed through untouched. */
export default function GVLink({ href, ...props }: ComponentProps<typeof Link>) {
  const base = useGvBase();
  const isInternal = typeof href === "string" && href.startsWith("/");
  return <Link href={isInternal ? `${base}${href}` : href} {...props} />;
}

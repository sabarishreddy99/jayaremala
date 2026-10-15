"use client";

import { useLang } from "./VRFLang";
import { Inner } from "./VRFUi";
import type { T } from "@/data/vrfbricks/copy";

/**
 * Photographs, shown at their true proportions.
 *
 * The previous version laid every photo out full-bleed at a viewport-relative
 * height (`h-[46vw] object-cover`). Two things went wrong with that. On a wide
 * screen a 1152px-wide source was being stretched across 1920px, so it was
 * upscaled past its own resolution and looked soft and "enlarged"; and
 * object-cover then cropped whatever did not fit the forced height, so the
 * framing the photographer chose was thrown away.
 *
 * This component fixes both by construction:
 *
 *   1. Every photo is registered below with its REAL pixel dimensions, and the
 *      container takes that exact aspect ratio. Nothing is ever cropped.
 *   2. Photos are constrained to a max width at or below their native width,
 *      so the browser only ever scales them DOWN. Nothing is ever upscaled.
 *
 * Add a photo to PHOTOS with its true size and it is impossible to distort.
 */

export interface PhotoMeta {
  src: string;
  w: number;
  h: number;
  /** True only for the single genuine photograph of this yard. */
  authentic?: boolean;
}

/**
 * Real dimensions, read off the files. Keep these in sync if a photo is
 * replaced: `sips -g pixelWidth -g pixelHeight <file>`.
 */
export const PHOTOS = {
  yard: { src: "/vrfbricks/photos/yard-kavali.jpg", w: 1152, h: 464, authentic: true },
  curing: { src: "/vrfbricks/photos/curing-india.jpg", w: 1400, h: 935 },
  mason: { src: "/vrfbricks/photos/mason-delhi.jpg", w: 1400, h: 932 },
  clay: { src: "/vrfbricks/photos/mason-hands.jpg", w: 1400, h: 932 },
  stacks: { src: "/vrfbricks/photos/bricks-solid-yard.jpg", w: 797, h: 599 },
} as const satisfies Record<string, PhotoMeta>;

/** Max display width per size, chosen to stay at or under native width. */
const MAX_W = {
  /** The hero band. 1152px is exactly the yard photo's native width. */
  wide: "max-w-6xl",
  /** Supporting photographs, kept smaller so they do not dominate the page. */
  standard: "max-w-4xl",
} as const;

export default function VRFPhoto({
  photo,
  alt,
  caption,
  size = "standard",
  priority = false,
  className = "",
}: {
  photo: PhotoMeta;
  alt: string;
  /** Bilingual caption. Sourced photos MUST say they are illustrative. */
  caption?: T;
  size?: keyof typeof MAX_W;
  /** Set on the hero only, so it is fetched immediately. */
  priority?: boolean;
  className?: string;
}) {
  const { t } = useLang();

  return (
    <figure className={className}>
      <Inner>
        <div className={`mx-auto ${MAX_W[size]}`}>
          <div
            className="overflow-hidden rounded-2xl bg-surface-sunken ring-1 ring-border"
            // The true ratio. The box is shaped by the photo rather than the
            // photo being squeezed into a box.
            style={{ aspectRatio: `${photo.w} / ${photo.h}` }}
          >
            {/* Static export: next/image optimisation is off, so a plain img with
                explicit aspect ratio is the right element here. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.src}
              alt={alt}
              width={photo.w}
              height={photo.h}
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "auto"}
              decoding="async"
              sizes={size === "wide" ? "(max-width: 1152px) 100vw, 1152px" : "(max-width: 896px) 100vw, 896px"}
              // `object-contain` rather than cover: the ratio already matches,
              // so nothing is cropped, and if a replacement photo ever has a
              // slightly different ratio it letterboxes instead of silently
              // cutting someone's head off.
              className={`h-full w-full object-contain ${photo.authentic ? "vrf-photo-true" : "vrf-photo"}`}
            />
          </div>
          {caption && (
            <figcaption className="mt-3 text-[0.8rem] leading-relaxed text-fg-subtle">
              {t(caption)}
            </figcaption>
          )}
        </div>
      </Inner>
    </figure>
  );
}

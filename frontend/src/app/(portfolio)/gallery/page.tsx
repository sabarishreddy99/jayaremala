import GalleryGrid from "@/components/portfolio/GalleryGrid";
import { gallery } from "@/data/gallery";
import { profile } from "@/data/profile";

export const metadata = {
  title: "Gallery",
  description: "Moments, milestones, and achievements, a visual log from Jaya Sabarish Reddy Remala.",
  alternates: { canonical: "https://jayaremala.com/gallery" },
  openGraph: {
    type: "website" as const,
    url: "https://jayaremala.com/gallery",
    title: "Gallery | Jaya Sabarish Reddy Remala",
    description: "Moments, milestones, and achievements in pictures.",
  },
};

export default function GalleryPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-12 sm:py-16">
      {/* Header */}
      <header className="mb-10 sm:mb-12 relative">
        <div
          className="absolute -top-8 -right-8 w-72 h-72 rounded-full blur-3xl pointer-events-none -z-10"
          style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--accent) 10%, transparent) 0%, transparent 70%)" }}
          aria-hidden
        />
        <p className="text-[11px] font-medium tracking-wide text-fg-subtle mb-3">Moments · Milestones</p>
        <h1 className="display-serif display-md text-fg mb-2">Gallery</h1>
        {profile.page_gallery && (
          <p className="text-sm text-fg-subtle max-w-xl leading-relaxed">
            {profile.page_gallery}
          </p>
        )}
      </header>

      <GalleryGrid items={gallery} />
    </div>
  );
}

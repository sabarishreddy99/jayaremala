import { getAllLabEntries } from "@/lib/content/lab";
import LabSectionDynamic from "@/components/lab/LabSectionDynamic";
import BlogSwitcher from "@/components/blog/BlogSwitcher";
import { profile } from "@/data/profile";

export const metadata = { title: "Lab | Jaya Sabarish Reddy Remala" };

export default function LabPage() {
  // Build-time MDX entries — used as fallback if the API is unreachable
  const staticEntries = getAllLabEntries();
  const activeCount  = staticEntries.filter((e) => e.status === "active").length;
  const shippedCount = staticEntries.filter((e) => e.status === "shipped").length;

  return (
    <div className="mx-auto w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl px-4 sm:px-6 xl:px-8 py-12 sm:py-16">
      <header className="mb-12 sm:mb-16 relative">
        {/* Decorative background bloom */}
        <div
          className="absolute -top-8 -right-8 w-72 h-72 rounded-full blur-3xl pointer-events-none -z-10"
          style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--accent) 7%, transparent) 0%, transparent 70%)" }}
          aria-hidden
        />

        <p className="text-[11px] font-medium tracking-wide text-fg-subtle mb-2">Build Log · In the Open</p>

        {/* Title + switcher */}
        <div className="flex items-center justify-between gap-4 mb-2">
          <h1 className="display-serif display-md text-fg">Lab</h1>
          <BlogSwitcher
            posts={staticEntries.map((e) => ({ slug: e.slug, title: e.title, date: e.updatedAt }))}
            label="Browse"
            listTitle="All entries"
            basePath="/lab"
          />
        </div>

        <p className="text-sm font-medium text-accent mb-3">Building in public</p>

        {profile.page_lab && (
          <p className="text-sm text-fg-subtle max-w-xl leading-relaxed">
            {profile.page_lab}
          </p>
        )}

        {/* Stat chips — derived from staticEntries; updates after API hydrates */}
        {staticEntries.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {activeCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-accent bg-accent-light border border-accent/30 rounded-sm px-3 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                {activeCount} active
              </span>
            )}
            {shippedCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-fg bg-surface border border-border-strong rounded-sm px-3 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-fg-faint" />
                {shippedCount} shipped
              </span>
            )}
            <span className="inline-flex items-center text-[11px] font-medium text-fg-muted bg-surface border border-border rounded-sm px-3 py-1">
              {staticEntries.length} experiment{staticEntries.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </header>

      {/* LabSectionDynamic fetches from API on the client; falls back to staticEntries */}
      <LabSectionDynamic staticEntries={staticEntries} />
    </div>
  );
}

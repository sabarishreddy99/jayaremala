import type { Metadata } from "next";
import { GitHubStagingProvider } from "@/lib/admin/githubStaging";
import PublishBar from "@/components/admin/PublishBar";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <GitHubStagingProvider>
      {/* `portfolio` opts the desk into the site's Avocado palette, type and warm
          dark mode (globals.css scopes all of it to that class). */}
      <div className="portfolio admin-surface">{children}</div>
      <PublishBar />
    </GitHubStagingProvider>
  );
}

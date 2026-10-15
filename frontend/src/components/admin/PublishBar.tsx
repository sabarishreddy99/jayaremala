"use client";

import { useGitHubStaging } from "@/lib/admin/githubStaging";

/** Fixed bottom toolbar: shows everything staged across editors and publishes it all
 *  in a single GitHub commit (→ one CI deploy). */
export default function PublishBar() {
  const ctx = useGitHubStaging();
  if (!ctx) return null;
  const { staged, count, publishAll, publishing, unstage, result, dismissResult } = ctx;

  if (count === 0 && !result) return null;

  return (
    <>
      {/* A Skin band in both modes, like the site's footer: the one place work leaves the desk. */}
      {/* Starts at the sidebar edge on desktop so the sidebar footer stays reachable. */}
      <div className="publish-bar fixed inset-x-0 lg:left-64 bottom-0 z-50 bg-[var(--skin)] text-[#f4f2e6] shadow-[0_-18px_40px_-24px_rgb(35_40_15/0.6)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 pt-3.5" style={{ paddingBottom: "max(0.875rem, env(safe-area-inset-bottom))" }}>
          {count > 0 ? (
            <>
              <span className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-[var(--flesh)]">
                {count} staged change{count > 1 ? "s" : ""}
              </span>
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                {Object.keys(staged).map((path) => (
                  <span key={path} className="inline-flex items-center gap-1.5 rounded-full border border-[#f4f2e6]/20 bg-[#f4f2e6]/10 py-1 pl-3 pr-1 text-[11px] text-[#f4f2e6]">
                    {path.replace(/^.*\//, "").replace(/\.json$/, "")}
                    <button onClick={() => unstage(path)} aria-label={`Discard ${path}`} className="grid size-5 place-items-center rounded-full text-[#f4f2e6]/70 hover:bg-[#f4f2e6]/15 hover:text-[#f4f2e6]">×</button>
                  </span>
                ))}
              </div>
              <button
                onClick={() => void publishAll()}
                disabled={publishing}
                className="rounded-full bg-[var(--flesh)] px-5 py-2.5 text-sm font-semibold text-[var(--skin-ink)] transition-colors hover:bg-[#f4f2e6] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
              >
                {publishing ? "Publishing…" : `Publish all (${count})`}
              </button>
            </>
          ) : (
            <div className="flex w-full items-center justify-between gap-3">
              <span className={`text-sm font-medium ${result?.ok ? "text-[var(--flesh)]" : "text-rose-300"}`}>
                {result?.message}
              </span>
              <button onClick={dismissResult} className="rounded-full border border-[#f4f2e6]/30 px-3 py-1 text-xs font-semibold text-[#f4f2e6] hover:bg-[#f4f2e6]/10">
                Dismiss
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

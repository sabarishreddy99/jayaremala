"use client";

import Link from "next/link";
import { useState } from "react";
import type { SkillGroup } from "@/data/skills";
import type { Project } from "@/data/projects";

interface Props {
  skills: SkillGroup[];
  featuredProjects: Project[];
}

export default function SkillsSection({ skills, featuredProjects }: Props) {
  const [activeSkill, setActiveSkill] = useState<string | null>(null);

  // First category opens by default so the section never reads as an empty
  // list of headings. Multiple may be open at once — these are reference
  // lists, and forcing one shut to read another is a needless trade.
  // `skills` is static build-time data, so server and client agree on this.
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () => new Set(skills.length ? [skills[0].category] : [])
  );

  const matching = activeSkill
    ? featuredProjects.filter((p) =>
        p.tags.some((t) => t.toLowerCase() === activeSkill.toLowerCase())
      )
    : [];

  function toggle(item: string) {
    setActiveSkill((prev) => (prev === item ? null : item));
  }

  function toggleGroup(category: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-fg-faint shrink-0">Skills & Tools</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" aria-hidden />
        {activeSkill && (
          <button
            onClick={() => setActiveSkill(null)}
            className="inline-flex items-center gap-1 text-[10px] font-medium text-fg-faint hover:text-fg transition-colors shrink-0"
          >
            <span className="text-accent font-semibold">{activeSkill}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
            Clear
          </button>
        )}
      </div>

      {/* Skills accordion.
          Was a 3-up card grid, which forced every one of the ~47 chips onto the
          page at once and read as a wall at any width. As rows, each category
          is a scannable line and the reader opens only what they care about —
          and one column behaves identically from 375px to 2560px, which the
          grid never did. Panels animate on grid-template-rows so nothing has
          to be measured in JS. */}
      <div className="border-t border-border">
        {skills.map((group) => {
          const panelId = `skills-${group.category.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}`;
          const isOpen = openGroups.has(group.category);

          return (
            <div key={group.category} className="border-b border-border">
              <h3>
                <button
                  type="button"
                  onClick={() => toggleGroup(group.category)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="group flex w-full items-baseline gap-4 py-5 text-left transition-colors hover:text-accent sm:py-6"
                >
                  <span className="display-serif display-md min-w-0 flex-1 text-fg transition-colors group-hover:text-accent">
                    {group.category}
                  </span>
                  <span className="shrink-0 self-center font-mono text-[11px] tabular-nums text-fg-faint">
                    {group.items.length}
                  </span>
                  {/* Plus that becomes a minus. One bar rotates, the other holds. */}
                  <span aria-hidden className="relative h-3 w-3 shrink-0 self-center text-fg-faint transition-colors group-hover:text-accent">
                    <span className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 bg-current" />
                    <span
                      className={`absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-current transition-transform duration-300 motion-reduce:transition-none ${
                        isOpen ? "scale-y-0" : "scale-y-100"
                      }`}
                    />
                  </span>
                </button>
              </h3>

              <div
                id={panelId}
                role="region"
                className="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
                style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
              >
                <div className="overflow-hidden">
                  <div className="flex flex-wrap gap-1.5 pb-6">
                    {group.items.map((item) => {
                      const isActive = activeSkill === item;
                      const hasMatch = featuredProjects.some((p) =>
                        p.tags.some((t) => t.toLowerCase() === item.toLowerCase())
                      );
                      const isDimmed = activeSkill !== null && !isActive;

                      return (
                        <button
                          key={item}
                          onClick={() => toggle(item)}
                          tabIndex={isOpen ? 0 : -1}
                          title={hasMatch ? `See projects using ${item}` : `${item} (not in featured projects)`}
                          className={`rounded-sm border px-2.5 py-1 text-xs font-medium transition-all duration-150 cursor-pointer
                            ${isActive
                              ? "border-accent bg-accent text-accent-fg shadow-sm scale-105"
                              : isDimmed
                                ? "border-border bg-surface text-fg-faint opacity-40 hover:opacity-70 hover:border-border-strong hover:text-fg-subtle"
                                : hasMatch
                                  ? "border-border bg-surface text-fg-muted hover:border-accent/50 hover:text-accent"
                                  : "border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg"
                            }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Matching projects strip */}
      {activeSkill && (
        <div className="mt-8 pt-7 border-t border-border">
          {matching.length > 0 ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-fg-faint">
                  Featured projects using
                </p>
                <span className="rounded-full bg-accent text-accent-fg px-2.5 py-0.5 text-[10px] font-semibold">
                  {activeSkill}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {matching.map((p) => (
                  <div
                    key={p.title}
                    className="rounded-2xl border border-border bg-surface p-4"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="text-sm font-semibold text-fg leading-snug">{p.title}</h3>
                      {p.award && (
                        <span className="text-[10px] font-semibold rounded-sm bg-surface-raised text-fg border border-border-strong px-1.5 py-0.5 whitespace-nowrap shrink-0">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="inline-block align-[-1px] mr-1" aria-hidden><path d="M8 21h8M12 17v4M6 4h12v5a6 6 0 0 1-12 0zM6 6H3v2a3 3 0 0 0 3 3M18 6h3v2a3 3 0 0 0-3 3" /></svg>{p.award}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-fg-subtle leading-relaxed mb-2.5">{p.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {p.tags.slice(0, 5).map((t) => (
                        <span
                          key={t}
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium
                            ${t.toLowerCase() === activeSkill.toLowerCase()
                              ? "bg-accent text-accent-fg"
                              : "bg-surface-raised text-fg-muted"}`}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-fg-faint">
              <span className="font-medium text-fg-subtle">{activeSkill}</span> doesn&apos;t appear in featured projects.{" "}
              <Link href="/projects" className="text-accent hover:text-accent-hover transition-colors">
                Browse all projects →
              </Link>
            </p>
          )}
        </div>
      )}
    </>
  );
}

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

  const matching = activeSkill
    ? featuredProjects.filter((p) =>
        p.tags.some((t) => t.toLowerCase() === activeSkill.toLowerCase())
      )
    : [];

  function toggle(item: string) {
    setActiveSkill((prev) => (prev === item ? null : item));
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 min-h-[1.5rem]">
        <h2 className="text-xs font-bold uppercase tracking-widest text-fg-faint">Skills & Tools</h2>
        {activeSkill && (
          <button
            onClick={() => setActiveSkill(null)}
            className="inline-flex items-center gap-1 text-[10px] font-medium text-fg-faint hover:text-fg transition-colors"
          >
            <span className="text-accent font-semibold">{activeSkill}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
            Clear
          </button>
        )}
      </div>

      {/* Skills grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {skills.map((group) => (
          <div key={group.category} className="rounded-2xl border border-border bg-surface-raised p-5 h-full">
            <p className="text-[11px] font-bold uppercase tracking-wider text-accent mb-3">{group.category}</p>
            <div className="flex flex-wrap gap-1.5">
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
                    title={hasMatch ? `See projects using ${item}` : `${item} (not in featured projects)`}
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all duration-150 cursor-pointer
                      ${isActive
                        ? "border-indigo-500 bg-indigo-600 text-white shadow-sm shadow-indigo-500/40 scale-105"
                        : isDimmed
                          ? "border-border bg-surface text-fg-faint opacity-40 hover:opacity-70 hover:border-border-strong hover:text-fg-subtle"
                          : hasMatch
                            ? "border-border bg-surface text-fg-muted hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-fg hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30"
                            : "border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg"
                      }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
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
                <span className="rounded-full bg-indigo-600 text-white px-2.5 py-0.5 text-[10px] font-semibold">
                  {activeSkill}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {matching.map((p) => (
                  <div
                    key={p.title}
                    className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-surface p-4
                               ring-1 ring-indigo-300/20 dark:ring-indigo-700/20"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="text-sm font-semibold text-fg leading-snug">{p.title}</h3>
                      {p.award && (
                        <span className="text-[10px] font-semibold rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 whitespace-nowrap shrink-0">
                          🏆 {p.award}
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
                              ? "bg-indigo-600 text-white"
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

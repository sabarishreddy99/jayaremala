"use client";

import Link from "next/link";
import { useState } from "react";
import type { SkillGroup } from "@/data/skills";
import type { Project } from "@/data/projects";

interface BrickColor {
  bg: string;
  shadow: string;
  stud: string;
  text: string;
  studs: number; // studs on category header brick
}

const CATEGORY_COLORS: Record<string, BrickColor> = {
  "Languages":              { bg: "#C4171C", shadow: "#8A1015", stud: "#E03A3F", text: "#fff", studs: 5 },
  "AI & Agents":            { bg: "#006CB7", shadow: "#004A80", stud: "#2085CC", text: "#fff", studs: 5 },
  "Systems & Cloud":        { bg: "#00933B", shadow: "#006629", stud: "#14AA52", text: "#fff", studs: 6 },
  "Frameworks & Databases": { bg: "#D4A800", shadow: "#9A7900", stud: "#F0C422", text: "#1a1a00", studs: 7 },
  "Certifications":         { bg: "#D45A00", shadow: "#983E00", stud: "#F07030", text: "#fff", studs: 5 },
};

const DEFAULT_COLOR: BrickColor = {
  bg: "#5B21B6", shadow: "#3B0F8C", stud: "#7C3AED", text: "#fff", studs: 4,
};

interface Props {
  skills: SkillGroup[];
  featuredProjects: Project[];
}

function brickVars(c: BrickColor): React.CSSProperties {
  return { "--bb": c.bg, "--bsh": c.shadow, "--bs": c.stud, "--bt": c.text } as React.CSSProperties;
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
      <div className="flex items-center justify-between mb-8 min-h-[1.5rem]">
        <div className="flex items-center gap-2.5">
          <div className="w-0.5 h-3.5 rounded-full bg-gradient-to-b from-violet-500 to-purple-500 shrink-0" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-fg-faint">Skills & Tools</h2>
        </div>
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

      {/* Lego baseplate + brick grid */}
      <div className="lego-baseplate rounded-2xl border border-border p-5 sm:p-7 space-y-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {skills.map((group) => {
            const colors = CATEGORY_COLORS[group.category] ?? DEFAULT_COLOR;
            return (
              <div key={group.category}>
                {/* Category header brick */}
                <div className="lego-cat-header mb-5" style={brickVars(colors)}>
                  <div className="lego-cat-studs">
                    {Array.from({ length: colors.studs }).map((_, i) => (
                      <div key={i} className="lego-cat-stud" />
                    ))}
                  </div>
                  <div className="lego-cat-body">{group.category}</div>
                </div>

                {/* Skill bricks */}
                <div className="flex flex-wrap gap-x-2.5 gap-y-5">
                  {group.items.map((item) => {
                    const isActive = activeSkill === item;
                    const isDimmed = activeSkill !== null && !isActive;
                    const hasMatch = featuredProjects.some((p) =>
                      p.tags.some((t) => t.toLowerCase() === item.toLowerCase())
                    );
                    return (
                      <button
                        key={item}
                        onClick={() => toggle(item)}
                        title={hasMatch ? `See projects using ${item}` : item}
                        className="lego-brick"
                        style={{
                          ...brickVars(colors),
                          opacity: isDimmed ? 0.32 : 1,
                        }}
                        data-active={isActive}
                      >
                        <div className="lego-stud" />
                        <div className="lego-body">
                          {item}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
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
                    className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-surface p-4 ring-1 ring-indigo-300/20 dark:ring-indigo-700/20"
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

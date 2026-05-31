"use client";

import { useMemo, useState } from "react";
import { skills } from "@/data/skills";
import { projects } from "@/data/projects";

function projectName(title: string): string {
  return title.split(/[–—(]| - /)[0].trim();
}

// skill ↔ tag match (case-insensitive, substring either direction)
function matches(skill: string, tag: string): boolean {
  const s = skill.toLowerCase().trim();
  const t = tag.toLowerCase().trim();
  return s === t || t.includes(s) || s.includes(t);
}

const SKILL_X = 250;
const PROJ_X = 750;
const ROW = 46;
const PAD = 40;

export default function SkillsConstellation() {
  const [hoverSkill, setHoverSkill] = useState<string | null>(null);
  const [hoverProj, setHoverProj] = useState<string | null>(null);

  const { skillNodes, projNodes, edges, height } = useMemo(() => {
    const allSkills = Array.from(new Set(skills.flatMap((c) => c.items)));

    // connection count per skill
    const conn = new Map<string, string[]>();
    for (const sk of allSkills) {
      const ps = projects.filter((p) => p.tags.some((t) => matches(sk, t))).map((p) => p.title);
      if (ps.length >= 2) conn.set(sk, ps);
    }
    // top skills by connection count
    const topSkills = [...conn.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 11);

    // projects that have at least one connection
    const usedProjects = projects.filter((p) => topSkills.some(([, ps]) => ps.includes(p.title)));

    const rows = Math.max(topSkills.length, usedProjects.length);
    const h = rows * ROW + PAD * 2;

    const skillNodes = topSkills.map(([name, ps], i) => ({
      name, projects: ps,
      x: SKILL_X,
      y: PAD + (i + 0.5) * ((h - PAD * 2) / topSkills.length),
    }));
    const projNodes = usedProjects.map((p, i) => ({
      title: p.title,
      label: projectName(p.title),
      award: !!p.award,
      x: PROJ_X,
      y: PAD + (i + 0.5) * ((h - PAD * 2) / usedProjects.length),
    }));

    const edges: { skill: string; proj: string; d: string }[] = [];
    for (const s of skillNodes) {
      for (const pt of s.projects) {
        const pn = projNodes.find((p) => p.title === pt);
        if (!pn) continue;
        const mx = (s.x + pn.x) / 2;
        edges.push({ skill: s.name, proj: pt, d: `M ${s.x} ${s.y} C ${mx} ${s.y}, ${mx} ${pn.y}, ${pn.x} ${pn.y}` });
      }
    }
    return { skillNodes, projNodes, edges, height: h };
  }, []);

  const activeSkill = hoverSkill;
  const activeProj = hoverProj;

  function edgeActive(e: { skill: string; proj: string }) {
    if (activeSkill) return e.skill === activeSkill;
    if (activeProj) return e.proj === activeProj;
    return false;
  }
  const anyHover = !!(activeSkill || activeProj);

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 1000 ${height}`} className="w-full h-auto" style={{ maxHeight: height }}>
        {/* Edges */}
        {edges.map((e, i) => {
          const on = edgeActive(e);
          return (
            <path
              key={i}
              d={e.d}
              fill="none"
              stroke={on ? "rgb(99 102 241)" : "currentColor"}
              strokeWidth={on ? 1.6 : 1}
              className="text-border"
              style={{
                opacity: anyHover ? (on ? 0.9 : 0.06) : 0.18,
                transition: "opacity 0.25s ease, stroke-width 0.25s ease",
              }}
            />
          );
        })}

        {/* Skill nodes */}
        {skillNodes.map((s) => {
          const on = activeSkill === s.name || (activeProj && s.projects.includes(activeProj));
          const dim = anyHover && !on;
          return (
            <g
              key={s.name}
              transform={`translate(${s.x}, ${s.y})`}
              onMouseEnter={() => setHoverSkill(s.name)}
              onMouseLeave={() => setHoverSkill(null)}
              style={{ cursor: "default", opacity: dim ? 0.3 : 1, transition: "opacity 0.25s ease" }}
            >
              <circle cx={0} cy={0} r={on ? 5 : 3.5} fill={on ? "rgb(99 102 241)" : "currentColor"} className="text-fg-faint" style={{ transition: "all 0.2s ease" }} />
              <text x={-12} y={4} textAnchor="end" className={`text-[13px] font-medium ${on ? "fill-accent" : "fill-fg-muted"}`} style={{ transition: "fill 0.2s ease" }}>
                {s.name}
              </text>
            </g>
          );
        })}

        {/* Project nodes */}
        {projNodes.map((p) => {
          const on = activeProj === p.title || (activeSkill && skillNodes.find((s) => s.name === activeSkill)?.projects.includes(p.title));
          const dim = anyHover && !on;
          return (
            <g
              key={p.title}
              transform={`translate(${p.x}, ${p.y})`}
              onMouseEnter={() => setHoverProj(p.title)}
              onMouseLeave={() => setHoverProj(null)}
              style={{ cursor: "default", opacity: dim ? 0.3 : 1, transition: "opacity 0.25s ease" }}
            >
              <circle cx={0} cy={0} r={on ? 5 : 3.5} fill={on ? (p.award ? "rgb(245 158 11)" : "rgb(139 92 246)") : "currentColor"} className="text-fg-faint" style={{ transition: "all 0.2s ease" }} />
              <text x={12} y={4} textAnchor="start" className={`text-[13px] font-medium ${on ? "fill-fg" : "fill-fg-muted"}`} style={{ transition: "fill 0.2s ease" }}>
                {p.label}{p.award ? " ★" : ""}
              </text>
            </g>
          );
        })}

        {/* Column captions */}
        <text x={SKILL_X} y={20} textAnchor="end" className="fill-fg-faint text-[10px] font-bold uppercase tracking-widest">Skills</text>
        <text x={PROJ_X} y={20} textAnchor="start" className="fill-fg-faint text-[10px] font-bold uppercase tracking-widest">Projects</text>
      </svg>

      <p className="text-center text-[11px] text-fg-faint mt-2">
        Hover a skill to see where Jaya has shipped it.
      </p>
    </div>
  );
}

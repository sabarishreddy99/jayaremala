"use client";

import { useState } from "react";
import KnowledgeBaseEditor from "./KnowledgeBaseEditor";

const FILES = [
  {
    key: "profile",
    label: "Profile",
    icon: "👤",
    filePath: "backend/data/knowledge/profile.json",
    description: "Name · tagline · bio · hero stats · availability · contact links · domains",
  },
  {
    key: "experience",
    label: "Experience",
    icon: "💼",
    filePath: "backend/data/knowledge/experience.json",
    description: "Work history — roles, companies, locations, dates, bullet points",
  },
  {
    key: "education",
    label: "Education",
    icon: "🎓",
    filePath: "backend/data/knowledge/education.json",
    description: "Degrees, institutions, GPA, highlights",
  },
  {
    key: "projects",
    label: "Projects",
    icon: "🚀",
    filePath: "backend/data/knowledge/projects.json",
    description: "Title, description, tags, featured flag, award, source links, notes",
  },
  {
    key: "skills",
    label: "Skills",
    icon: "⚡",
    filePath: "backend/data/knowledge/skills.json",
    description: "Skill categories and items shown as Lego bricks on the homepage",
  },
  {
    key: "testimonials",
    label: "Testimonials",
    icon: "💬",
    filePath: "backend/data/knowledge/testimonials.json",
    description: "Name, designation, company, LinkedIn, quote, date, source",
  },
] as const;

type FileKey = (typeof FILES)[number]["key"];

export default function KnowledgeDataView() {
  const [active, setActive] = useState<FileKey>("profile");
  const current = FILES.find(f => f.key === active)!;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-sm font-bold text-fg">Portfolio Data</h2>
        <p className="text-xs text-fg-faint mt-0.5">
          All changes commit to <code className="text-accent">backend/data/knowledge/</code> — GH Actions syncs to the frontend and Railway re-ingests the chatbot knowledge base automatically.
        </p>
      </div>

      {/* File tabs */}
      <div className="flex flex-wrap gap-2">
        {FILES.map(f => (
          <button
            key={f.key}
            onClick={() => setActive(f.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              active === f.key
                ? "bg-fg text-bg shadow-sm"
                : "border border-border text-fg-muted hover:text-fg hover:border-fg-muted"
            }`}
          >
            <span>{f.icon}</span>
            {f.label}
          </button>
        ))}
      </div>

      {/* Active editor — key forces re-mount on tab switch so each file has isolated state */}
      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-lg">{current.icon}</span>
          <h3 className="text-sm font-bold text-fg">{current.label}</h3>
        </div>
        <KnowledgeBaseEditor
          key={current.key}
          filePath={current.filePath}
          label={current.label}
          description={current.description}
        />
      </div>

      {/* Schema hints */}
      <details className="rounded-xl border border-border bg-surface overflow-hidden">
        <summary className="px-5 py-3 text-xs font-semibold text-fg-faint cursor-pointer hover:text-fg transition-colors select-none">
          Field reference for {current.label}
        </summary>
        <div className="px-5 pb-5 pt-3 border-t border-border">
          <FieldReference fileKey={active} />
        </div>
      </details>
    </div>
  );
}

function FieldReference({ fileKey }: { fileKey: FileKey }) {
  const refs: Record<FileKey, { field: string; type: string; note: string }[]> = {
    profile: [
      { field: "name",               type: "string",    note: "Full display name" },
      { field: "tagline",            type: "string",    note: "Subtitle under the name in hero" },
      { field: "bio",                type: "string",    note: "About paragraph — numbers get auto-highlighted in bold" },
      { field: "obsession",          type: "string",    note: "Italic pull-quote in At a Glance section" },
      { field: "currently",          type: "string",    note: "\"Currently deep in\" card in hero right column" },
      { field: "previous",           type: "string",    note: "Comma-separated company names shown as Prev@ chips" },
      { field: "prev_domain",        type: "string",    note: "Comma-separated previous domain chips in At a Glance" },
      { field: "interested_domain",  type: "string",    note: "Comma-separated interested domain chips (accent color)" },
      { field: "heroStats[]",        type: "array",     note: "4 animated count-up stat cards in hero. Each: {value, suffix, label, sub}" },
      { field: "availability",       type: "object",    note: "{open, label, types[], locations[]} — hero status badge" },
      { field: "resume",             type: "string",    note: "URL shown in hero CTA and chatbot responses" },
      { field: "email / phone",      type: "string",    note: "Contact info used by chatbot and contact form" },
      { field: "github / linkedin",  type: "string",    note: "Social profile URLs" },
    ],
    experience: [
      { field: "role",        type: "string",   note: "Job title" },
      { field: "company",     type: "string",   note: "Employer name" },
      { field: "location",    type: "string",   note: "City / Remote" },
      { field: "start",       type: "string",   note: "Start date e.g. \"Jan 2023\"" },
      { field: "end",         type: "string",   note: "End date or \"Present\"" },
      { field: "description", type: "string",   note: "One-line role summary" },
      { field: "bullets[]",   type: "string[]", note: "Achievement bullet points shown on /experience" },
    ],
    education: [
      { field: "institution", type: "string",   note: "University / school name" },
      { field: "degree",      type: "string",   note: "Degree type e.g. \"Master of Science\"" },
      { field: "field",       type: "string",   note: "Major / field of study" },
      { field: "location",    type: "string",   note: "City, State" },
      { field: "start / end", type: "string",   note: "Year range" },
      { field: "gpa",         type: "string",   note: "Optional GPA string" },
      { field: "highlights[]",type: "string[]", note: "Notable achievements / coursework" },
    ],
    projects: [
      { field: "title",          type: "string",   note: "Project name" },
      { field: "description",    type: "string",   note: "One-paragraph summary" },
      { field: "tags[]",         type: "string[]", note: "Tech stack — used for skill filter cross-linking" },
      { field: "featured",       type: "boolean",  note: "true → shows on homepage Featured Projects grid" },
      { field: "award",          type: "string",   note: "Optional award badge text e.g. \"Hackathon Winner\"" },
      { field: "sourceLinks[]",  type: "array",    note: "Each: {label, url} — rendered as indigo pill buttons" },
      { field: "note",           type: "string",   note: "Optional amber callout note shown on the card" },
    ],
    skills: [
      { field: "category", type: "string",   note: "Group heading — controls Lego brick color" },
      { field: "items[]",  type: "string[]", note: "Individual skill names — each rendered as a Lego brick" },
    ],
    testimonials: [
      { field: "name",        type: "string", note: "Person's full name" },
      { field: "designation", type: "string", note: "Job title" },
      { field: "company",     type: "string", note: "Employer" },
      { field: "linkedin",    type: "string", note: "LinkedIn profile URL (optional)" },
      { field: "description", type: "string", note: "The testimonial quote text" },
      { field: "givenAt",     type: "string", note: "Date / context e.g. \"April 2024 · via LinkedIn\"" },
      { field: "source",      type: "string", note: "Platform e.g. \"LinkedIn\" or \"Direct\"" },
    ],
  };

  const fields = refs[fileKey] ?? [];

  return (
    <div className="grid gap-1.5 sm:grid-cols-2">
      {fields.map(f => (
        <div key={f.field} className="flex gap-2.5 rounded-lg border border-border-subtle p-2.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <code className="text-[11px] font-semibold text-accent">{f.field}</code>
              <span className="text-[9px] font-medium text-fg-faint bg-surface-raised px-1.5 py-0.5 rounded-full">{f.type}</span>
            </div>
            <p className="text-[10px] text-fg-faint mt-0.5 leading-snug">{f.note}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

"use client";

import { useState } from "react";
import RagPipelineModal from "@/components/portfolio/RagPipelineModal";

interface SourceLink { label: string; url: string; }
interface Props {
  title: string;
  description: string;
  tags: string[];
  award?: string;
  note?: string;
  sourceLinks?: SourceLink[];
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function RagPipelineCard({ title, description, tags, award, note, sourceLinks }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="min-w-0 flex-1 rounded-card border border-border bg-surface p-5 sm:p-6 space-y-3 hover:border-border-strong card-lift transition-all">

        {/* ── Standard card content ── */}
        <div>
          <div className="mb-2 flex h-5 items-center">
          {award && (
            <span className="inline-flex max-w-full items-center truncate rounded-chip bg-surface-raised text-fg border border-border-strong px-2 py-0.5 text-[10px] font-semibold">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="inline-block align-[-1px] mr-1" aria-hidden><path d="M8 21h8M12 17v4M6 4h12v5a6 6 0 0 1-12 0zM6 6H3v2a3 3 0 0 0 3 3M18 6h3v2a3 3 0 0 0-3 3" /></svg>{award}
            </span>
          )}
          </div>
          <h3 className="font-semibold text-fg text-sm leading-snug">{title}</h3>
        </div>

        <p className="line-clamp-6 text-xs leading-5 text-fg-subtle">{description}</p>

        <div className="flex min-w-0 flex-wrap gap-1.5">
          {tags.slice(0, 4).map((t) => (
            <span key={t} className="max-w-full truncate rounded-full border border-border px-2.5 py-0.5 text-[10px] font-medium text-fg-subtle tracking-wide">
              {t}
            </span>
          ))}
        </div>

        {note && (
          <p className="text-[11px] text-fg-muted bg-surface-raised border border-border rounded-chip px-2.5 py-1.5 leading-relaxed">
            {note}
          </p>
        )}

        {sourceLinks && sourceLinks.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {sourceLinks.map((link) => (
              <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-sm bg-accent-light border border-accent/30 px-2.5 py-0.5 text-[10px] font-semibold text-accent hover:opacity-80 transition-opacity">
                {link.label}
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
              </a>
            ))}
          </div>
        )}

        {/* ── Pipeline modal trigger ── */}
        <button
          onClick={() => setModalOpen(true)}
          className="flex w-full items-center gap-1.5 border-t border-border pt-3 text-[10px] font-semibold text-accent hover:text-accent-hover transition-colors"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 17.5h7M17.5 14v7"/>
          </svg>
          View RAG pipeline
        </button>
      </div>

      <RagPipelineModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}

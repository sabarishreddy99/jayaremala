"use client";

import { useEffect, useState } from "react";
import type { GalleryItem } from "@/data/gallery";

export default function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const [active, setActive] = useState<string | null>(null);   // category filter
  const [lightbox, setLightbox] = useState<number | null>(null);

  const categories = Array.from(new Set(items.map((i) => i.category).filter(Boolean))) as string[];
  const shown = active ? items.filter((i) => i.category === active) : items;

  // Keyboard nav for the lightbox
  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") setLightbox((i) => (i === null ? null : (i + 1) % shown.length));
      if (e.key === "ArrowLeft")  setLightbox((i) => (i === null ? null : (i - 1 + shown.length) % shown.length));
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [lightbox, shown.length]);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
        <p className="text-sm text-fg-faint">No photos yet — add them from the admin gallery panel.</p>
      </div>
    );
  }

  return (
    <>
      {/* Category filter */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <FilterChip label="All" count={items.length} active={!active} onClick={() => setActive(null)} />
          {categories.map((c) => (
            <FilterChip key={c} label={c} count={items.filter((i) => i.category === c).length}
              active={active === c} onClick={() => setActive(active === c ? null : c)} />
          ))}
        </div>
      )}

      {/* Masonry */}
      <div className="columns-2 md:columns-3 lg:columns-4 gap-3 sm:gap-4">
        {shown.map((item, i) => (
          <button
            key={item.id}
            onClick={() => setLightbox(i)}
            className="group relative mb-3 sm:mb-4 block w-full break-inside-avoid overflow-hidden rounded-xl border border-border bg-surface-raised text-left"
          >
            <GalleryImage item={item} />
            {/* Caption overlay */}
            <div className="absolute inset-x-0 bottom-0 translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200 bg-gradient-to-t from-black/75 to-transparent p-3">
              <p className="text-[12px] font-semibold text-white leading-snug line-clamp-2">{item.title}</p>
              {item.date && <p className="text-[10px] text-white/70 mt-0.5">{item.date}</p>}
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null && shown[lightbox] && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm p-4 sm:p-8"
          onClick={() => setLightbox(null)}
        >
          <button onClick={() => setLightbox(null)} aria-label="Close"
            className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
          {shown.length > 1 && (
            <>
              <NavArrow dir="left"  onClick={(e) => { e.stopPropagation(); setLightbox((i) => (i! - 1 + shown.length) % shown.length); }} />
              <NavArrow dir="right" onClick={(e) => { e.stopPropagation(); setLightbox((i) => (i! + 1) % shown.length); }} />
            </>
          )}
          <div className="max-w-5xl max-h-[80vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shown[lightbox].src} alt={shown[lightbox].title}
              className="max-w-full max-h-[72vh] object-contain rounded-lg shadow-2xl" />
            <div className="mt-3 text-center max-w-2xl">
              <p className="text-sm font-semibold text-white">{shown[lightbox].title}</p>
              {shown[lightbox].caption && <p className="text-xs text-white/70 mt-1 leading-relaxed">{shown[lightbox].caption}</p>}
              <p className="text-[10px] text-white/40 mt-2 tabular-nums">{lightbox + 1} / {shown.length}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function GalleryImage({ item }: { item: GalleryItem }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-indigo-500/15 to-violet-500/15 p-4">
        <p className="text-[11px] font-medium text-fg-muted text-center">{item.title}</p>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={item.src}
      alt={item.title}
      loading="lazy"
      onError={() => setFailed(true)}
      className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-[1.03]"
    />
  );
}

function FilterChip({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium border transition-all duration-150 ${
        active ? "bg-accent text-white border-accent shadow-sm" : "bg-surface border-border text-fg-faint hover:text-fg hover:border-accent/50"
      }`}>
      {label}
      <span className={`text-[10px] font-semibold rounded-full px-1.5 py-0.5 ${active ? "bg-white/20 text-white" : "bg-surface-raised text-fg-faint"}`}>{count}</span>
    </button>
  );
}

function NavArrow({ dir, onClick }: { dir: "left" | "right"; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button onClick={onClick} aria-label={dir === "left" ? "Previous" : "Next"}
      className={`absolute top-1/2 -translate-y-1/2 ${dir === "left" ? "left-3" : "right-3"} z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors`}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {dir === "left" ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
      </svg>
    </button>
  );
}

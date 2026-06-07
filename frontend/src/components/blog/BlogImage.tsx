"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface Props {
  src: string;
  alt: string;
  caption?: string;
}

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function BlogImage({ src, alt, caption }: Props) {
  const fullSrc = src.startsWith("http") ? src : `${BASE}${src}`;
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // portal target must be resolved client-side only
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const overlay = (
    // Inline styles only — bypasses .prose pre, Tailwind specificity, and any external CSS
    <div
      onClick={() => setOpen(false)}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.82)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        padding: "1.5rem",
        cursor: "zoom-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ position: "relative", cursor: "auto" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fullSrc}
          alt={alt}
          style={{
            display: "block",
            maxWidth: "90vw",
            maxHeight: "90vh",
            width: "auto",
            height: "auto",
            borderRadius: "1rem",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.9)",
          }}
        />
        {caption && (
          <p style={{
            marginTop: "0.75rem",
            textAlign: "center",
            fontSize: "0.75rem",
            color: "rgb(212 212 216)",
            fontStyle: "italic",
          }}>
            {caption}
          </p>
        )}
        <button
          onClick={() => setOpen(false)}
          aria-label="Close"
          style={{
            position: "absolute",
            top: "-0.75rem",
            right: "-0.75rem",
            width: "2rem",
            height: "2rem",
            borderRadius: "9999px",
            background: "var(--surface)",
            color: "var(--fg-muted)",
            border: "1px solid var(--border)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.125rem",
            lineHeight: 1,
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.3)",
          }}
        >
          ×
        </button>
      </div>
    </div>
  );

  return (
    <>
      <figure className="not-prose my-6 flex flex-col items-center">
        <div
          className="rounded-2xl border border-border bg-surface-raised p-3 shadow-sm cursor-zoom-in transition-all duration-200 hover:shadow-md hover:border-border-strong max-w-sm w-full"
          onClick={() => setOpen(true)}
          title="Click to enlarge"
        >
          <div style={{ lineHeight: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fullSrc} alt={alt} className="w-full h-auto block rounded-xl" />
          </div>
        </div>
        {caption && (
          <figcaption className="mt-2.5 text-center text-[11px] text-fg-faint italic">
            {caption}
          </figcaption>
        )}
      </figure>

      {/* Portal renders the lightbox as a direct child of document.body —
          outside the React tree's positioning/transform context,
          so position:fixed is always relative to the true viewport */}
      {mounted && open && createPortal(overlay, document.body)}
    </>
  );
}

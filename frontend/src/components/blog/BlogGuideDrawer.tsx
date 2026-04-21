"use client";

import { useState, useEffect } from "react";

const SECTIONS = [
  {
    heading: "New post frontmatter",
    code: `---
title: Your Title
date: "2026-04-21"
publishedAt: "2026-04-21"
description: One-line summary shown on index.
tags: [tag1, tag2]
---`,
    note: "publishedAt = immutable publish date used for sort order. date = display date (update freely). Filename becomes the URL slug: my-post.mdx → /blog/my-post",
  },
  {
    heading: "Headings",
    code: `## Section      ← large, border below
### Sub-section ← medium, no border
#### Label      ← uppercase small caps`,
  },
  {
    heading: "Text formatting",
    code: `**bold**        *italic*
\`inline code\`   ~~strikethrough~~

> blockquote pull quote

<Divider />   ← decorative section break`,
  },
  {
    heading: "Links & lists",
    code: `[link text](https://example.com)
[internal](/blog/my-post)

- bullet item
- another item
  - nested item

1. numbered item
2. second item`,
  },
  {
    heading: "Images",
    code: `<!-- basic -->
![alt text](/blog/file.jpg)

<!-- with caption -->
![alt text](/blog/file.jpg "Caption text")

<!-- component -->
<BlogImage
  src="/blog/file.jpg"
  alt="description"
  caption="optional caption"
/>`,
    note: "Put image files in frontend/public/blog/",
  },
  {
    heading: "Callout boxes",
    code: `<Callout type="info" title="Title">text</Callout>
<Callout type="tip" title="Title">text</Callout>
<Callout type="warning" title="Title">text</Callout>
<Callout type="quote" title="Title">text</Callout>`,
    note: "All MDX components (Callout, BlogImage, Divider) are auto-imported — no import statement needed.",
  },
  {
    heading: "Code blocks",
    code: "```python\ndef hello(): return 'hi'\n```\n\nSupported: python typescript javascript\nbash json yaml sql go rust",
  },
  {
    heading: "Table",
    code: `| Col A | Col B |
|---|---|
| val   | val   |`,
  },
];

export default function BlogGuideDrawer() {
  const [open, setOpen] = useState(false);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen(true)}
        title="Blog writing guide"
        className="fixed bottom-6 right-5 z-40 flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white/80 backdrop-blur px-3 py-1.5 text-[10px] font-semibold text-zinc-300 shadow-sm hover:text-indigo-500 hover:border-indigo-200 transition-all duration-300 select-none"
      >
        <span className="text-[11px]">✦</span>
        <span className="hidden sm:inline">Guide</span>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-white shadow-2xl border-l border-zinc-200 flex flex-col transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Reference</p>
            <h2 className="text-sm font-bold text-zinc-950 mt-0.5">Blog Writing Guide</h2>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-7 h-7 flex items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {SECTIONS.map((s) => (
            <div key={s.heading}>
              <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 mb-2">{s.heading}</p>
              {s.note && (
                <p className="text-[11px] text-zinc-400 mb-1.5 italic">{s.note}</p>
              )}
              <pre className="bg-zinc-950 text-zinc-300 text-[11px] leading-relaxed rounded-xl p-3.5 overflow-x-auto font-mono whitespace-pre-wrap break-words">
                {s.code}
              </pre>
            </div>
          ))}

          {/* Quick card */}
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-3">Quick card</p>
            <div className="space-y-1.5 font-mono text-[10px] text-zinc-600">
              {[
                ["Image",       "![alt](/blog/f.jpg)"],
                ["Caption",     "![alt](/blog/f.jpg \"cap\")"],
                ["Link",        "[text](https://url)"],
                ["Bold",        "**text**"],
                ["Italic",      "*text*"],
                ["Code",        "`code`"],
                ["Strike",      "~~text~~"],
                ["Quote",       "> text"],
                ["Bullet",      "- item"],
                ["Numbered",    "1. item"],
                ["Divider",     "<Divider />"],
                ["Info box",    "<Callout type=\"info\">"],
                ["Tip box",     "<Callout type=\"tip\">"],
                ["Warn box",    "<Callout type=\"warning\">"],
                ["Quote box",   "<Callout type=\"quote\">"],
              ].map(([label, syntax]) => (
                <div key={label} className="flex gap-2">
                  <span className="text-zinc-400 w-20 shrink-0">{label}</span>
                  <span className="text-zinc-700">{syntax}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

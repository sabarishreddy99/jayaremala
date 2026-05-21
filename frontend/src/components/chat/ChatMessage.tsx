"use client";

import React, { useState } from "react";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  message: Message;
  streaming?: boolean;
}

// ── Inline formatter ─────────────────────────────────────────────────────────

const INLINE = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s]+))/g;

function inline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  INLINE.lastIndex = 0;

  while ((match = INLINE.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const key = `${keyPrefix}-${match.index}`;

    if (match[2] !== undefined) {
      nodes.push(<strong key={key} className="font-semibold text-fg">{match[2]}</strong>);
    } else if (match[3] !== undefined) {
      nodes.push(<em key={key}>{match[3]}</em>);
    } else if (match[4] !== undefined) {
      nodes.push(<code key={key} className="rounded bg-surface-raised px-1 py-0.5 text-[11px] font-mono text-fg-muted">{match[4]}</code>);
    } else if (match[5] !== undefined) {
      nodes.push(<a key={key} href={match[6]} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 text-accent hover:text-accent-hover transition-colors">{match[5]}</a>);
    } else if (match[7] !== undefined) {
      nodes.push(<a key={key} href={match[7]} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 text-accent hover:text-accent-hover break-all transition-colors">{match[7]}</a>);
    }
    last = match.index + match[0].length;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

// ── Block renderer ────────────────────────────────────────────────────────────

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  let k = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") { i++; continue; }

    if (line.startsWith("### ")) {
      elements.push(
        <p key={k++} className="font-semibold text-fg mt-2 mb-0.5 text-[13px]">
          {inline(line.slice(4), String(k))}
        </p>
      );
      i++; continue;
    }
    if (line.startsWith("## ")) {
      elements.push(
        <p key={k++} className="font-bold text-fg mt-2 mb-1 text-sm">
          {inline(line.slice(3), String(k))}
        </p>
      );
      i++; continue;
    }

    if (/^[-*]\s/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        const idx = i;
        items.push(
          <li key={idx} className="flex gap-2">
            <span className="mt-[5px] w-1 h-1 rounded-full bg-fg-subtle shrink-0" />
            <span>{inline(lines[i].replace(/^[-*]\s/, ""), `li-${idx}`)}</span>
          </li>
        );
        i++;
      }
      elements.push(<ul key={k++} className="space-y-1 my-1 text-fg-muted">{items}</ul>);
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const items: React.ReactNode[] = [];
      let num = 1;
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        const idx = i;
        items.push(
          <li key={idx} className="flex gap-2">
            <span className="shrink-0 text-fg-faint text-[11px] font-mono mt-px">{num++}.</span>
            <span>{inline(lines[i].replace(/^\d+\.\s/, ""), `ol-${idx}`)}</span>
          </li>
        );
        i++;
      }
      elements.push(<ol key={k++} className="space-y-1 my-1 text-fg-muted">{items}</ol>);
      continue;
    }

    if (line.trim() === "---") {
      elements.push(<hr key={k++} className="border-border my-2" />);
      i++; continue;
    }

    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{1,3}\s|[-*]\s|\d+\.\s|---)/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      const combined = paraLines.join("\n");
      const parts: React.ReactNode[] = [];
      combined.split("\n").forEach((ln, li) => {
        if (li > 0) parts.push(<br key={`br-${k}-${li}`} />);
        parts.push(...inline(ln, `p-${k}-${li}`));
      });
      elements.push(<p key={k++} className="leading-relaxed">{parts}</p>);
    }
  }

  return <div className="space-y-1.5">{elements}</div>;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ChatMessage({ message, streaming }: Props) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] sm:max-w-[70%] rounded-2xl rounded-tr-sm bg-fg px-4 py-2.5 text-sm leading-relaxed text-bg shadow-sm">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start gap-3">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-base mt-0.5" title="Avocado">
        🥑
      </div>
      <div className="relative group/msg max-w-[80%] sm:max-w-[75%]">
        <div className="rounded-2xl rounded-tl-sm border border-border bg-surface px-4 py-2.5 text-sm text-fg-muted shadow-sm">
          {streaming && !message.content ? (
            <span className="inline-flex gap-1 items-center h-4">
              <span className="w-1.5 h-1.5 rounded-full bg-fg-faint animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-fg-faint animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-fg-faint animate-bounce [animation-delay:300ms]" />
            </span>
          ) : (
            <>
              {renderMarkdown(message.content)}
              {streaming && <span className="cursor-blink ml-0.5 text-fg-faint">|</span>}
            </>
          )}
        </div>
        {!streaming && message.content && (
          <button
            onClick={handleCopy}
            aria-label="Copy response"
            className="absolute -bottom-2 right-2 opacity-0 group-hover/msg:opacity-100 transition-opacity flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] text-fg-faint hover:text-fg-muted hover:border-fg-faint shadow-sm"
          >
            {copied ? (
              <>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                Copied
              </>
            ) : (
              <>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Copy
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

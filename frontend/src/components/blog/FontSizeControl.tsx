"use client";

import { useEffect } from "react";
import { useStoredState } from "@/lib/hooks";

const SIZES = [
  { label: "Small",   value: "0.9375rem", display: 11 },
  { label: "Medium",  value: "1.0625rem", display: 13 },
  { label: "Large",   value: "1.1875rem", display: 15 },
  { label: "X-Large", value: "1.3125rem", display: 18 },
];
const DEFAULT = 1;
const LS_KEY  = "blog-font-size";
const CSS_VAR = "--blog-font-size";

export default function FontSizeControl() {
  // The saved size lives in localStorage; reading it through the store keeps
  // every control on the page (and other tabs) in step.
  const [saved, setSaved] = useStoredState(LS_KEY, SIZES[DEFAULT].value);
  const found = SIZES.findIndex((s) => s.value === saved);
  const idx = found === -1 ? DEFAULT : found;

  const apply = (i: number) => setSaved(SIZES[i].value);

  useEffect(() => {
    document.documentElement.style.setProperty(CSS_VAR, SIZES[idx].value);
  }, [idx]);

  return (
    <div
      className="flex items-center rounded-lg border border-border bg-surface-raised overflow-hidden"
      title="Adjust reading font size"
      role="group"
      aria-label="Font size"
    >
      {SIZES.map((size, i) => {
        const active = idx === i;
        return (
          <button
            key={size.label}
            onClick={() => apply(i)}
            aria-label={size.label}
            aria-pressed={active}
            className={[
              "relative flex items-center justify-center w-8 h-7 transition-colors duration-150 select-none",
              i < SIZES.length - 1 ? "border-r border-border" : "",
              active
                ? "bg-accent/10 text-accent"
                : "text-fg-faint hover:text-fg hover:bg-surface",
            ].join(" ")}
          >
            <span
              style={{
                fontSize: size.display,
                lineHeight: 1,
                fontWeight: active ? 600 : 400,
                display: "block",
              }}
            >
              A
            </span>
          </button>
        );
      })}
    </div>
  );
}

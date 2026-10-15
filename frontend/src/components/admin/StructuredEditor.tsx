"use client";

import { useState } from "react";
import { useLoadOnMount } from "@/lib/hooks";
import { useGitHubFile } from "@/lib/admin/useGitHubFile";
import { inputCls, GithubPATRow, SaveRow, ResultBanner, DirtyBadge, MoveButtons, Toggle } from "./AdminShared";

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };
type Obj = { [k: string]: Json };

/** Keys that read as prose, so they get a text area whatever their length. */
const LONG = /^(description|desc|about|lead|sub|line|a|deck|caption|context|how|fit|definition|belief|closing|footnote|pullQuote|summary|bio|text|preamble|paragraphs|note|brief)$/i;
/** Keys whose value names an item, used as the card title in lists. */
const TITLE_KEYS = ["title", "name", "label", "term", "need", "q", "headline", "href", "slug"];

function humanize(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (c) => c.toUpperCase());
}

/** An empty value with the same shape, for "Add" buttons in lists. */
function blank(v: Json): Json {
  if (Array.isArray(v)) return [];
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, blank(x)]));
  if (typeof v === "number") return 0;
  if (typeof v === "boolean") return false;
  return "";
}

function itemTitle(v: Json, i: number) {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    for (const k of TITLE_KEYS) if (typeof v[k] === "string" && v[k]) return String(v[k]);
  }
  return `Item ${i + 1}`;
}

const labelCls = "mb-2 block font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-fg-subtle";
const addCls = "inline-flex items-center gap-1.5 rounded-full border border-dashed border-border-strong px-4 py-2 text-xs font-medium text-fg-muted transition-colors hover:border-accent hover:bg-accent-light hover:text-fg";

function Field({ name, value, onChange, depth }: { name: string; value: Json; onChange: (v: Json) => void; depth: number }) {
  // ── Lists ──
  if (Array.isArray(value)) {
    const objects = value.length > 0 && value.every((x) => x && typeof x === "object" && !Array.isArray(x));
    const set = (i: number, v: Json) => onChange(value.map((x, j) => (j === i ? v : x)));
    const move = (i: number, dir: -1 | 1) => {
      const a = [...value];
      const t = i + dir;
      if (t < 0 || t >= a.length) return;
      [a[i], a[t]] = [a[t], a[i]];
      onChange(a);
    };
    const remove = (i: number) => onChange(value.filter((_, j) => j !== i));
    const add = () => onChange([...value, value.length ? blank(value[value.length - 1]) : ""]);

    return (
      <div>
        <span className={labelCls}>{humanize(name)} <span className="normal-case tracking-normal text-fg-faint">· {value.length}</span></span>
        <div className="space-y-3">
          {value.map((item, i) =>
            objects ? (
              <details key={i} className="group rounded-card border border-border bg-bg" open={value.length <= 2}>
                <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3">
                  <span className="font-mono text-[0.6875rem] tabular-nums text-fg-faint">{String(i + 1).padStart(2, "0")}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">{itemTitle(item, i)}</span>
                  <MoveButtons idx={i} total={value.length} onMove={(d) => move(i, d)} />
                  <button type="button" onClick={(e) => { e.preventDefault(); remove(i); }}
                    className="rounded-full px-2.5 py-1 text-xs text-fg-faint transition-colors hover:bg-rose-500/10 hover:text-rose-600">
                    Remove
                  </button>
                </summary>
                <div className="space-y-4 border-t border-border-subtle px-4 py-4">
                  {Object.entries(item as Obj).map(([k, v]) => (
                    <Field key={k} name={k} value={v} depth={depth + 1} onChange={(nv) => set(i, { ...(item as Obj), [k]: nv })} />
                  ))}
                </div>
              </details>
            ) : (
              <div key={i} className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <Field name="" value={item} depth={depth + 1} onChange={(nv) => set(i, nv)} />
                </div>
                <MoveButtons idx={i} total={value.length} onMove={(d) => move(i, d)} />
                <button type="button" onClick={() => remove(i)} aria-label="Remove"
                  className="mt-2 grid size-8 place-items-center rounded-full text-fg-faint transition-colors hover:bg-rose-500/10 hover:text-rose-600">×</button>
              </div>
            ),
          )}
        </div>
        <button type="button" onClick={add} className={`${addCls} mt-3`}>+ Add {objects ? "item" : "line"}</button>
      </div>
    );
  }

  // ── Nested objects ──
  if (value && typeof value === "object") {
    return (
      <fieldset className={depth > 0 ? "rounded-card border border-border-subtle p-4" : ""}>
        {name && <legend className={`${labelCls} px-1`}>{humanize(name)}</legend>}
        <div className="space-y-4">
          {Object.entries(value).map(([k, v]) => (
            <Field key={k} name={k} value={v} depth={depth + 1} onChange={(nv) => onChange({ ...value, [k]: nv })} />
          ))}
        </div>
      </fieldset>
    );
  }

  // ── Scalars ──
  const label = name ? <span className={labelCls}>{humanize(name)}</span> : null;
  if (typeof value === "boolean") {
    return <div>{label}<Toggle checked={value} onChange={onChange} label={value ? "Yes" : "No"} /></div>;
  }
  if (typeof value === "number") {
    return (
      <label className="block">
        {label}
        <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} className={inputCls} />
      </label>
    );
  }
  const text = value ?? "";
  const long = LONG.test(name) || text.length > 90 || text.includes("\n");
  return (
    <label className="block">
      {label}
      {long ? (
        <textarea value={text} onChange={(e) => onChange(e.target.value)} rows={Math.min(8, Math.max(3, Math.ceil(text.length / 90)))}
          className={`${inputCls} resize-y leading-relaxed`} />
      ) : (
        <input type="text" value={text} onChange={(e) => onChange(e.target.value)} className={inputCls} />
      )}
    </label>
  );
}

/**
 * A form for any JSON in the knowledge base, built from the data's own shape:
 * strings become inputs (prose keys become text areas), numbers and booleans
 * get their controls, lists of objects become reorderable cards with Add and
 * Remove. One editor covers every story block in profile.json, site.json and
 * case-studies.json, so new fields are editable the moment they exist.
 *
 * With `keys`, only those top-level keys are edited and staged as a patch, so
 * this never overwrites what another editor staged for the same file.
 */
export default function StructuredEditor({
  file,
  keys,
  sections,
}: {
  /** Path in the repo, e.g. "backend/data/knowledge/profile.json". */
  file: string;
  /** Edit only these top-level keys of an object file. Omit to edit the whole file. */
  keys?: string[];
  /** Optional heading + hint per top-level key. */
  sections?: Record<string, { title: string; hint?: string }>;
}) {
  const gh = useGitHubFile(file);
  const [value, setValue] = useState<Json | null>(null);
  const [dirty, setDirty] = useState(false);

  async function handleLoad() {
    const data = await gh.load<Json>();
    if (data === null) return;
    if (keys && data && typeof data === "object" && !Array.isArray(data)) {
      setValue(Object.fromEntries(keys.map((k) => [k, (data as Obj)[k] ?? ""])));
    } else {
      setValue(data);
    }
    setDirty(false);
  }

  async function handleSave() {
    if (value === null) return;
    const name = file.split("/").pop();
    const ok = keys
      ? await gh.savePatch(value as Obj, `chore: update ${keys.join(", ")} in ${name}`)
      : await gh.save(value, `chore: update ${name}`);
    if (ok) setDirty(false);
  }

  // Load once on arrival when a token is saved. State is set after the fetch
  // resolves, not synchronously, so this cannot cascade renders.
   
  useLoadOnMount(handleLoad, !!gh.pat.trim());

  const change = (v: Json) => { setValue(v); setDirty(true); };
  const top = value && typeof value === "object" && !Array.isArray(value) ? (value as Obj) : null;

  return (
    <div className="space-y-6">
      <GithubPATRow {...gh} onLoad={handleLoad} />
      {dirty && <DirtyBadge dirty />}

      {value !== null && top ? (
        <div className="space-y-4">
          {Object.entries(top).map(([k, v], i) => (
            <details key={k} open={i === 0} className="group rounded-card border border-border bg-surface">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 sm:px-6">
                <span>
                  <span className="display-serif block text-[1.375rem] leading-tight text-fg">{sections?.[k]?.title ?? humanize(k)}</span>
                  {sections?.[k]?.hint && <span className="mt-1 block text-[0.8125rem] text-fg-subtle">{sections[k].hint}</span>}
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden
                  className="shrink-0 text-fg-faint transition-transform group-open:rotate-180"><path d="M6 9l6 6 6-6" /></svg>
              </summary>
              <div className="border-t border-border-subtle px-5 py-5 sm:px-6">
                <Field name="" value={v} depth={0} onChange={(nv) => change({ ...top, [k]: nv })} />
              </div>
            </details>
          ))}
        </div>
      ) : value !== null ? (
        <div className="rounded-card border border-border bg-surface p-5 sm:p-6">
          <Field name="" value={value} depth={0} onChange={change} />
        </div>
      ) : null}

      <ResultBanner result={gh.result} />
      <SaveRow onSave={handleSave} saving={gh.saving} loaded={gh.loaded} pat={gh.pat} dirty={dirty} />
    </div>
  );
}

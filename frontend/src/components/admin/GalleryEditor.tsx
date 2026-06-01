"use client";

import { useState } from "react";

interface GalleryItem {
  id: string;
  title: string;
  caption?: string;
  src: string;
  category?: string;
  date?: string;
}

const REPO         = "sabarishreddy99/jayaremala";
const BASE         = `https://api.github.com/repos/${REPO}/contents`;
const GALLERY_JSON = "backend/data/knowledge/gallery.json";
const IMG_DIR      = "frontend/public/gallery";
const PAT_KEY      = "avocado_github_pat";

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 40) || "photo";
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1]); // strip data: prefix
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default function GalleryEditor() {
  const [pat, setPat] = useState(() => typeof window !== "undefined" ? localStorage.getItem(PAT_KEY) ?? "" : "");
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [sha, setSha] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // Form
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");

  const headers = () => ({ Authorization: `Bearer ${pat}`, Accept: "application/vnd.github+json" });

  function savePat(v: string) {
    const t = v.trim();
    localStorage.setItem(PAT_KEY, t);
    setPat(t);
  }

  async function load() {
    if (!pat) { setResult({ ok: false, msg: "Enter your GitHub PAT first." }); return; }
    setBusy(true); setResult(null);
    try {
      const res = await fetch(`${BASE}/${GALLERY_JSON}`, { headers: headers() });
      if (!res.ok) throw new Error(`GitHub ${res.status}`);
      const d = await res.json();
      const bytes = Uint8Array.from(atob(d.content.replace(/\n/g, "")), (c) => c.charCodeAt(0));
      setItems(JSON.parse(new TextDecoder().decode(bytes)));
      setSha(d.sha);
      setLoaded(true);
      setResult({ ok: true, msg: "Loaded gallery." });
    } catch (e) {
      setResult({ ok: false, msg: `Load failed: ${(e as Error).message}` });
    } finally { setBusy(false); }
  }

  async function putJson(next: GalleryItem[], message: string): Promise<boolean> {
    // refetch sha to avoid conflicts
    const cur = await fetch(`${BASE}/${GALLERY_JSON}`, { headers: headers() });
    const curData = cur.ok ? await cur.json() : null;
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(next, null, 2) + "\n")));
    const res = await fetch(`${BASE}/${GALLERY_JSON}`, {
      method: "PUT",
      headers: { ...headers(), "Content-Type": "application/json" },
      body: JSON.stringify({ message, content: encoded, sha: curData?.sha ?? sha, branch: "main" }),
    });
    if (res.ok) { setSha((await res.json()).content.sha); return true; }
    throw new Error(`gallery.json PUT ${res.status}`);
  }

  async function addPhoto() {
    if (!file)  { setResult({ ok: false, msg: "Pick an image first." }); return; }
    if (!title.trim()) { setResult({ ok: false, msg: "Add a title." }); return; }
    if (!loaded) { setResult({ ok: false, msg: "Load the gallery first." }); return; }
    setBusy(true); setResult(null);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const id  = `${slugify(title)}-${Date.now().toString(36)}`;
      const imgPath = `${IMG_DIR}/${id}.${ext}`;
      const b64 = await fileToBase64(file);

      // 1. Commit the image file
      const imgRes = await fetch(`${BASE}/${imgPath}`, {
        method: "PUT",
        headers: { ...headers(), "Content-Type": "application/json" },
        body: JSON.stringify({ message: `gallery: add ${id}.${ext}`, content: b64, branch: "main" }),
      });
      if (!imgRes.ok) throw new Error(`image upload ${imgRes.status}`);

      // 2. Append metadata + commit gallery.json
      const entry: GalleryItem = {
        id, title: title.trim(), src: `/gallery/${id}.${ext}`,
        ...(caption.trim() && { caption: caption.trim() }),
        ...(category.trim() && { category: category.trim() }),
        ...(date.trim() && { date: date.trim() }),
      };
      const next = [entry, ...items];
      await putJson(next, `gallery: add "${entry.title}"`);

      setItems(next);
      setFile(null); setTitle(""); setCaption(""); setCategory(""); setDate("");
      setResult({ ok: true, msg: "Uploaded! Live in ~2 min after the rebuild." });
    } catch (e) {
      setResult({ ok: false, msg: `Upload failed: ${(e as Error).message}` });
    } finally { setBusy(false); }
  }

  async function remove(id: string) {
    if (!confirm("Remove this photo from the gallery? (the image file stays in the repo)")) return;
    setBusy(true); setResult(null);
    try {
      const next = items.filter((i) => i.id !== id);
      await putJson(next, `gallery: remove ${id}`);
      setItems(next);
      setResult({ ok: true, msg: "Removed." });
    } catch (e) {
      setResult({ ok: false, msg: `Remove failed: ${(e as Error).message}` });
    } finally { setBusy(false); }
  }

  const inputCls = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:border-accent transition-colors";

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2.5">
        <div className="w-0.5 h-3.5 rounded-full bg-gradient-to-b from-violet-500 to-indigo-500 shrink-0" />
        <h2 className="text-xs font-bold uppercase tracking-widest text-fg-faint">Gallery — Upload Photos</h2>
      </div>

      {/* PAT + load */}
      <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
        <div>
          <label className="text-xs font-medium text-fg-subtle mb-1.5 block">GitHub Personal Access Token (repo scope)</label>
          <input type="password" value={pat} onChange={(e) => savePat(e.target.value)} placeholder="ghp_…" className={inputCls} />
        </div>
        <button onClick={load} disabled={busy} className="rounded-lg bg-fg text-bg px-4 py-2 text-sm font-semibold hover:opacity-80 disabled:opacity-50 transition-opacity">
          {busy ? "Working…" : loaded ? "Reload gallery" : "Load gallery"}
        </button>
      </div>

      {/* Upload form */}
      {loaded && (
        <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-fg-faint">Add a photo</p>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-fg-muted file:mr-3 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:opacity-80" />
          {file && <p className="text-[11px] text-fg-faint">{file.name} · {(file.size / 1024).toFixed(0)} KB</p>}
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (e.g. Qualcomm Hackathon — Winner)" className={inputCls} />
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption (optional)" className={inputCls} />
          <div className="grid grid-cols-2 gap-3">
            <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category (Awards, Events…)" className={inputCls} />
            <input value={date} onChange={(e) => setDate(e.target.value)} placeholder="Date (e.g. Nov 2024)" className={inputCls} />
          </div>
          <button onClick={addPhoto} disabled={busy} className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-50 transition-colors inline-flex items-center gap-2">
            {busy ? "Uploading…" : "Upload photo"}
          </button>
        </div>
      )}

      {result && (
        <p className={`text-xs rounded-lg px-3 py-2 border ${result.ok ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400" : "border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400"}`}>
          {result.msg}
        </p>
      )}

      {/* Existing items */}
      {loaded && (
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-fg-faint mb-3">{items.length} photo{items.length !== 1 ? "s" : ""}</p>
          {items.length === 0 ? (
            <p className="text-sm text-fg-faint">No photos yet.</p>
          ) : (
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {items.map((it) => (
                <li key={it.id} className="group relative rounded-lg border border-border overflow-hidden bg-surface-raised">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.src} alt={it.title} className="w-full aspect-[4/3] object-cover" />
                  <div className="p-2">
                    <p className="text-[11px] font-medium text-fg truncate">{it.title}</p>
                    {it.category && <p className="text-[10px] text-fg-faint">{it.category}</p>}
                  </div>
                  <button onClick={() => remove(it.id)} disabled={busy} aria-label="Remove"
                    className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 hover:bg-rose-500 transition-all">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api/client";

interface LabLink { label: string; url: string }

interface LabRow {
  id: number;
  slug: string;
  title: string;
  status: "active" | "paused" | "shipped";
  description: string;
  started_at: string;
  updated_at: string;
  tech: string[];
  links: LabLink[];
  content: string;
}

const todayISO = new Date().toISOString().slice(0, 10);

interface LabForm {
  slug: string;
  title: string;
  status: "active" | "paused" | "shipped";
  description: string;
  started_at: string;
  updated_at: string;
  tech: string;
  links: LabLink[];
  content: string;
}

const EMPTY_FORM: LabForm = {
  slug: "",
  title: "",
  status: "active",
  description: "",
  started_at: todayISO,
  updated_at: todayISO,
  tech: "",
  links: [{ label: "", url: "" }],
  content: "",
};

function adminToken(): string {
  return typeof window !== "undefined" ? localStorage.getItem("avocado_admin_token") ?? "" : "";
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${adminToken()}`,
  };
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function Result({ result }: { result: { ok: boolean; message: string } | null }) {
  if (!result) return null;
  return (
    <p className={`text-xs mt-2 ${result.ok ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"}`}>
      {result.ok ? "✓" : "✗"} {result.message}
    </p>
  );
}

const STATUS_COLORS: Record<string, string> = {
  active:  "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400",
  paused:  "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400",
  shipped: "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400",
};

export default function ContentLabEditor() {
  const [entries, setEntries] = useState<LabRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  async function loadEntries() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/content/lab`);
      if (res.ok) setEntries(await res.json());
    } catch { /* silent */ }
    setLoading(false);
  }

  useEffect(() => { loadEntries(); }, []);

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingSlug(null);
    setResult(null);
  }

  function startEdit(e: LabRow) {
    setEditingSlug(e.slug);
    setForm({
      slug: e.slug,
      title: e.title,
      status: e.status,
      description: e.description,
      started_at: e.started_at,
      updated_at: e.updated_at,
      tech: e.tech.join(", "),
      links: e.links.length > 0 ? e.links : [{ label: "", url: "" }],
      content: e.content,
    });
    setResult(null);
  }

  function handleTitleChange(title: string) {
    setForm((f) => ({
      ...f,
      title,
      slug: editingSlug ? f.slug : slugify(title),
    }));
  }

  function updateLink(idx: number, field: keyof LabLink, value: string) {
    setForm((f) => {
      const links = [...f.links];
      links[idx] = { ...links[idx], [field]: value };
      return { ...f, links };
    });
  }

  function addLink() {
    setForm((f) => ({ ...f, links: [...f.links, { label: "", url: "" }] }));
  }

  function removeLink(idx: number) {
    setForm((f) => ({ ...f, links: f.links.filter((_, i) => i !== idx) }));
  }

  async function handleSave() {
    if (!form.slug.trim() || !form.title.trim()) {
      setResult({ ok: false, message: "Slug and title are required." });
      return;
    }
    setSaving(true);
    setResult(null);
    const body = {
      slug: form.slug.trim(),
      title: form.title.trim(),
      status: form.status,
      description: form.description.trim(),
      started_at: form.started_at,
      updated_at: form.updated_at,
      tech: form.tech.split(",").map((t) => t.trim()).filter(Boolean),
      links: form.links.filter((l) => l.label.trim() && l.url.trim()),
      content: form.content,
    };
    try {
      const url = editingSlug
        ? `${API_BASE_URL}/content/lab/${editingSlug}`
        : `${API_BASE_URL}/content/lab`;
      const res = await fetch(url, {
        method: editingSlug ? "PUT" : "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setResult({ ok: true, message: editingSlug ? "Updated!" : "Entry created — live immediately." });
        resetForm();
        await loadEntries();
      } else {
        const err = await res.json().catch(() => ({}));
        setResult({ ok: false, message: (err as { detail?: string }).detail ?? `Error ${res.status}` });
      }
    } catch (e: unknown) {
      setResult({ ok: false, message: (e as Error).message });
    }
    setSaving(false);
  }

  async function handleDelete(slug: string) {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/content/lab/${slug}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (res.ok || res.status === 204) {
        setResult({ ok: true, message: "Deleted." });
        setConfirmDelete(null);
        if (editingSlug === slug) resetForm();
        await loadEntries();
      } else {
        setResult({ ok: false, message: `Error ${res.status}` });
      }
    } catch (e: unknown) {
      setResult({ ok: false, message: (e as Error).message });
    }
    setSaving(false);
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-base font-bold text-fg mb-1">Lab — Content API</h2>
        <p className="text-xs text-fg-faint mb-6">Changes are live immediately — no git push, no rebuild.</p>

        {/* Form */}
        <div className="space-y-4 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-fg-faint mb-1 uppercase tracking-wider">Title</label>
              <input
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="My experiment"
                className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-fg-faint mb-1 uppercase tracking-wider">Slug</label>
              <input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="my-experiment"
                disabled={!!editingSlug}
                className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-fg font-mono placeholder:text-fg-faint focus:outline-none focus:border-accent disabled:opacity-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-fg-faint mb-1 uppercase tracking-wider">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "active" | "paused" | "shipped" }))}
                className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-fg focus:outline-none focus:border-accent"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="shipped">Shipped</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-fg-faint mb-1 uppercase tracking-wider">Started</label>
              <input
                type="date"
                value={form.started_at}
                onChange={(e) => setForm((f) => ({ ...f, started_at: e.target.value }))}
                className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-fg focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-fg-faint mb-1 uppercase tracking-wider">Last Updated</label>
              <input
                type="date"
                value={form.updated_at}
                onChange={(e) => setForm((f) => ({ ...f, updated_at: e.target.value }))}
                className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-fg focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-fg-faint mb-1 uppercase tracking-wider">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              placeholder="Short description shown in lab index"
              className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:border-accent resize-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-fg-faint mb-1 uppercase tracking-wider">Tech (comma-separated)</label>
            <input
              value={form.tech}
              onChange={(e) => setForm((f) => ({ ...f, tech: e.target.value }))}
              placeholder="React, TypeScript, FastAPI"
              className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:border-accent"
            />
          </div>

          {/* Links */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[11px] font-semibold text-fg-faint uppercase tracking-wider">Links</label>
              {form.links.length < 5 && (
                <button onClick={addLink} className="text-[10px] text-accent hover:text-accent/80 transition-colors">
                  + Add link
                </button>
              )}
            </div>
            <div className="space-y-2">
              {form.links.map((link, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    value={link.label}
                    onChange={(e) => updateLink(idx, "label", e.target.value)}
                    placeholder="Label"
                    className="w-1/3 rounded-xl border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:border-accent"
                  />
                  <input
                    value={link.url}
                    onChange={(e) => updateLink(idx, "url", e.target.value)}
                    placeholder="https://..."
                    className="flex-1 rounded-xl border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:border-accent"
                  />
                  {form.links.length > 1 && (
                    <button
                      onClick={() => removeLink(idx)}
                      className="text-[11px] text-rose-500 hover:text-rose-600 px-2 shrink-0"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-fg-faint mb-1 uppercase tracking-wider">Content (Markdown)</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              rows={10}
              placeholder="Write lab entry details in Markdown..."
              className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-fg font-mono placeholder:text-fg-faint focus:outline-none focus:border-accent resize-y"
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving…" : editingSlug ? "Update Entry" : "Add Entry"}
            </button>
            {editingSlug && (
              <button onClick={resetForm} className="text-xs text-fg-faint hover:text-fg transition-colors">
                Cancel
              </button>
            )}
          </div>

          <Result result={result} />
        </div>

        {/* Entry list */}
        <h3 className="text-xs font-bold uppercase tracking-wider text-fg-faint mb-3">
          {loading ? "Loading…" : `${entries.length} entries`}
        </h3>
        <div className="space-y-2">
          {entries.map((e) => (
            <div key={e.slug} className="flex items-start gap-3 rounded-xl border border-border bg-bg p-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-fg leading-snug truncate">{e.title}</p>
                <p className="text-[11px] text-fg-faint mt-0.5 font-mono">/{e.slug}</p>
                <div className="flex gap-2 mt-1 flex-wrap items-center">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[e.status] ?? "bg-surface-raised text-fg-muted"}`}>
                    {e.status}
                  </span>
                  <span className="text-[10px] text-fg-faint">{e.started_at}</span>
                  {e.tech.slice(0, 3).map((t) => (
                    <span key={t} className="text-[10px] bg-surface-raised px-2 py-0.5 rounded-full text-fg-muted">{t}</span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => startEdit(e)}
                  className="text-[11px] text-accent hover:text-accent/80 transition-colors"
                >
                  Edit
                </button>
                {confirmDelete === e.slug ? (
                  <span className="flex gap-1">
                    <button
                      onClick={() => handleDelete(e.slug)}
                      className="text-[11px] text-rose-600 hover:text-rose-500"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="text-[11px] text-fg-faint"
                    >
                      Cancel
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(e.slug)}
                    className="text-[11px] text-fg-faint hover:text-rose-600 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

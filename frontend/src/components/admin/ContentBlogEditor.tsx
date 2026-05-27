"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api/client";

interface BlogRow {
  id: number;
  slug: string;
  title: string;
  date: string;
  published_at: string;
  description: string;
  tags: string[];
  content: string;
  published: boolean;
}

const todayISO = new Date().toISOString().slice(0, 10);

const EMPTY_FORM = {
  slug: "",
  title: "",
  date: todayISO,
  published_at: todayISO,
  description: "",
  tags: "",
  content: "",
  published: true,
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

export default function ContentBlogEditor() {
  const [posts, setPosts] = useState<BlogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  async function loadPosts() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/content/blog/drafts`, {
        headers: { Authorization: `Bearer ${adminToken()}` },
      });
      if (res.ok) setPosts(await res.json());
    } catch { /* silent */ }
    setLoading(false);
  }

  useEffect(() => { loadPosts(); }, []);

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingSlug(null);
    setResult(null);
    setPreview(false);
  }

  function startEdit(p: BlogRow) {
    setEditingSlug(p.slug);
    setForm({
      slug: p.slug,
      title: p.title,
      date: p.date,
      published_at: p.published_at,
      description: p.description,
      tags: p.tags.join(", "),
      content: p.content,
      published: p.published,
    });
    setResult(null);
    setPreview(false);
  }

  function handleTitleChange(title: string) {
    setForm((f) => ({
      ...f,
      title,
      slug: editingSlug ? f.slug : slugify(title),
    }));
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
      date: form.date,
      published_at: form.published_at,
      description: form.description.trim(),
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      content: form.content,
      published: form.published,
    };
    try {
      const url = editingSlug
        ? `${API_BASE_URL}/content/blog/${editingSlug}`
        : `${API_BASE_URL}/content/blog`;
      const res = await fetch(url, {
        method: editingSlug ? "PUT" : "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setResult({ ok: true, message: editingSlug ? "Updated!" : "Post created — live immediately if published." });
        resetForm();
        await loadPosts();
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
      const res = await fetch(`${API_BASE_URL}/content/blog/${slug}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (res.ok || res.status === 204) {
        setResult({ ok: true, message: "Deleted." });
        setConfirmDelete(null);
        if (editingSlug === slug) resetForm();
        await loadPosts();
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
        <h2 className="text-base font-bold text-fg mb-1">Blog — Content API</h2>
        <p className="text-xs text-fg-faint mb-6">
          Posts publish immediately — no git push, no rebuild. Use plain Markdown for content (no MDX components).
        </p>

        {/* Form */}
        <div className="space-y-4 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-fg-faint mb-1 uppercase tracking-wider">Title</label>
              <input
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="My new post"
                className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-fg-faint mb-1 uppercase tracking-wider">Slug (URL)</label>
              <input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="my-new-post"
                disabled={!!editingSlug}
                className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-fg font-mono placeholder:text-fg-faint focus:outline-none focus:border-accent disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-fg-faint mb-1 uppercase tracking-wider">Description</label>
            <input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="One-line summary shown in blog index"
              className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:border-accent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-fg-faint mb-1 uppercase tracking-wider">Display Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-fg focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-fg-faint mb-1 uppercase tracking-wider">Published At (sort key)</label>
              <input
                type="date"
                value={form.published_at}
                onChange={(e) => setForm((f) => ({ ...f, published_at: e.target.value }))}
                className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-fg focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-fg-faint mb-1 uppercase tracking-wider">Tags (comma-separated)</label>
              <input
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                placeholder="react, typescript, web"
                className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Content + preview toggle */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-semibold text-fg-faint uppercase tracking-wider">Content (Markdown)</label>
              <button
                onClick={() => setPreview((p) => !p)}
                className="text-[10px] text-accent hover:text-accent/80 transition-colors"
              >
                {preview ? "Edit" : "Preview"}
              </button>
            </div>
            {preview ? (
              <div className="prose max-w-none rounded-xl border border-border bg-bg px-4 py-3 min-h-[200px] text-sm">
                <p className="text-fg-faint text-xs italic">(Live preview not available — install react-markdown in admin component)</p>
                <pre className="text-xs text-fg-muted whitespace-pre-wrap">{form.content || "No content yet."}</pre>
              </div>
            ) : (
              <textarea
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                rows={14}
                placeholder="Write your post in Markdown..."
                className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-fg font-mono placeholder:text-fg-faint focus:outline-none focus:border-accent resize-y"
              />
            )}
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm text-fg">Published (live immediately)</span>
            </label>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving…" : editingSlug ? "Update Post" : "Publish Post"}
            </button>
            {editingSlug && (
              <button onClick={resetForm} className="text-xs text-fg-faint hover:text-fg transition-colors">
                Cancel
              </button>
            )}
          </div>

          <Result result={result} />
        </div>

        {/* Post list */}
        <h3 className="text-xs font-bold uppercase tracking-wider text-fg-faint mb-3">
          {loading ? "Loading…" : `${posts.length} posts (including drafts)`}
        </h3>
        <div className="space-y-2">
          {posts.map((p) => (
            <div key={p.slug} className="flex items-start gap-3 rounded-xl border border-border bg-bg p-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-fg leading-snug truncate">{p.title}</p>
                <p className="text-[11px] text-fg-faint mt-0.5 font-mono">/{p.slug}</p>
                <div className="flex gap-2 mt-1 flex-wrap">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${p.published ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400" : "bg-surface-raised text-fg-muted"}`}>
                    {p.published ? "Live" : "Draft"}
                  </span>
                  <span className="text-[10px] text-fg-faint">{p.date}</span>
                  {p.tags.slice(0, 3).map((t) => (
                    <span key={t} className="text-[10px] bg-surface-raised px-2 py-0.5 rounded-full text-fg-muted">#{t}</span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => startEdit(p)}
                  className="text-[11px] text-accent hover:text-accent/80 transition-colors"
                >
                  Edit
                </button>
                {confirmDelete === p.slug ? (
                  <span className="flex gap-1">
                    <button
                      onClick={() => handleDelete(p.slug)}
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
                    onClick={() => setConfirmDelete(p.slug)}
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

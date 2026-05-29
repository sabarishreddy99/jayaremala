import { useState } from "react";

const REPO    = "sabarishreddy99/jayaremala";
const PAT_KEY = "avocado_github_pat";
const BASE    = `https://api.github.com/repos/${REPO}/contents`;

export function useGitHubFile(filePath: string) {
  const [pat, setPat]           = useState(() => typeof window !== "undefined" ? localStorage.getItem(PAT_KEY) ?? "" : "");
  const [patVisible, setPatVisible] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [loaded, setLoaded]     = useState(false);
  const [result, setResult]     = useState<{ ok: boolean; message: string } | null>(null);

  function updatePat(v: string) {
    const t = v.trim();
    if (typeof window !== "undefined") localStorage.setItem(PAT_KEY, t);
    setPat(t);
  }

  function gh() {
    return { Authorization: `Bearer ${pat}`, Accept: "application/vnd.github+json" };
  }

  async function load<T = unknown>(): Promise<T | null> {
    if (!pat) return null;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${BASE}/${filePath}`, { headers: gh() });
      if (!res.ok) { setResult({ ok: false, message: `GitHub ${res.status}: ${res.statusText}` }); return null; }
      const d = await res.json();
      const bytes = Uint8Array.from(atob(d.content.replace(/\n/g, "")), c => c.charCodeAt(0));
      const parsed = JSON.parse(new TextDecoder("utf-8").decode(bytes)) as T;
      setLoaded(true);
      return parsed;
    } catch (e: unknown) {
      setResult({ ok: false, message: `Error: ${(e as Error).message}` });
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function save(data: unknown, message: string): Promise<boolean> {
    if (!pat || !loaded) return false;
    setSaving(true);
    setResult(null);
    try {
      const getRes = await fetch(`${BASE}/${filePath}`, { headers: gh() });
      if (!getRes.ok) throw new Error(`GET failed: ${getRes.status}`);
      const fileData = await getRes.json();
      const encoded  = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2) + "\n")));
      const putRes   = await fetch(`${BASE}/${filePath}`, {
        method: "PUT",
        headers: { ...gh(), "Content-Type": "application/json" },
        body: JSON.stringify({ message, content: encoded, sha: fileData.sha, branch: "main" }),
      });
      if (putRes.ok) {
        setResult({ ok: true, message: "Saved! GH Actions rebuilds the site in ~2 min." });
        return true;
      }
      const err = await putRes.json().catch(() => ({ message: putRes.statusText }));
      setResult({ ok: false, message: `GitHub: ${(err as { message?: string }).message ?? putRes.statusText}` });
      return false;
    } catch (e: unknown) {
      setResult({ ok: false, message: `Error: ${(e as Error).message}` });
      return false;
    } finally {
      setSaving(false);
    }
  }

  return { pat, patVisible, setPatVisible, updatePat, loading, saving, loaded, result, load, save };
}

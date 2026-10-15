"use client";

import { createContext, useCallback, useContext, useState } from "react";

const REPO = "sabarishreddy99/jayaremala";
const PAT_KEY = "avocado_github_pat";
const API = `https://api.github.com/repos/${REPO}`;

function decodeBase64Utf8(b64: string): string {
  const bytes = Uint8Array.from(atob(b64.replace(/\n/g, "")), (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

export function getPat(): string {
  return typeof window !== "undefined" ? localStorage.getItem(PAT_KEY) ?? "" : "";
}

/**
 * A staged file is either a whole replacement (`patch` false — list files like
 * experience.json) or a set of top-level keys to change (`patch` true — the
 * many editors that each own a slice of profile.json or site.json).
 *
 * Patches are merged with each other as they are staged, and applied to the
 * *latest* copy on GitHub at publish time. So two editors never undo each
 * other, and a direct commit made meanwhile (the Now / Availability editors)
 * is never reverted by an older staged copy.
 */
type StagedFile = { data: unknown; message: string; patch?: boolean };
type Staged = Record<string, StagedFile>;

interface StagingCtx {
  staged: Staged;
  count: number;
  stage: (path: string, data: unknown, message: string) => void;
  stagePatch: (path: string, patch: Record<string, unknown>, message: string) => void;
  unstage: (path: string) => void;
  clear: () => void;
  publishAll: () => Promise<boolean>;
  publishing: boolean;
  result: { ok: boolean; message: string } | null;
  dismissResult: () => void;
}

const Ctx = createContext<StagingCtx | null>(null);

export function GitHubStagingProvider({ children }: { children: React.ReactNode }) {
  const [staged, setStaged] = useState<Staged>({});
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const stage = useCallback((path: string, data: unknown, message: string) => {
    setStaged((prev) => ({ ...prev, [path]: { data, message } }));
  }, []);
  const stagePatch = useCallback((path: string, patch: Record<string, unknown>, message: string) => {
    setStaged((prev) => {
      const before = prev[path];
      if (before && !before.patch) {
        // A whole-file edit is already staged: fold the patch into it.
        return { ...prev, [path]: { data: { ...(before.data as object), ...patch }, message: `${before.message}; ${message}` } };
      }
      const data = { ...((before?.data as object) ?? {}), ...patch };
      const msg = before ? `${before.message}; ${message}` : message;
      return { ...prev, [path]: { data, message: msg, patch: true } };
    });
  }, []);
  const unstage = useCallback((path: string) => {
    setStaged((prev) => {
      const next = { ...prev };
      delete next[path];
      return next;
    });
  }, []);
  const clear = useCallback(() => setStaged({}), []);
  const dismissResult = useCallback(() => setResult(null), []);

  const publishAll = useCallback(async (): Promise<boolean> => {
    const pat = getPat();
    const entries = Object.entries(staged);
    if (!pat) {
      setResult({ ok: false, message: "Add your GitHub token in any editor first." });
      return false;
    }
    if (entries.length === 0) return false;

    setPublishing(true);
    setResult(null);
    const headers = {
      Authorization: `Bearer ${pat}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    };
    const j = async (res: Response) => {
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((body as { message?: string }).message || `GitHub ${res.status}`);
      return body;
    };
    try {
      // 1. latest commit on main + its base tree
      const ref = await j(await fetch(`${API}/git/ref/heads/main`, { headers }));
      const latest = ref.object.sha as string;
      const baseCommit = await j(await fetch(`${API}/git/commits/${latest}`, { headers }));
      const baseTree = baseCommit.tree.sha as string;

      // 2. one tree with every staged file (GitHub creates the blobs).
      //    Patches are applied to the file as it is on main right now.
      const tree = await Promise.all(entries.map(async ([path, { data, patch }]) => {
        let content = data;
        if (patch) {
          const res = await fetch(`${API}/contents/${path}?ref=${latest}`, { headers });
          const current = res.ok ? JSON.parse(decodeBase64Utf8((await res.json()).content)) : {};
          content = { ...current, ...(data as object) };
        }
        return { path, mode: "100644", type: "blob", content: JSON.stringify(content, null, 2) + "\n" };
      }));
      const newTree = await j(
        await fetch(`${API}/git/trees`, { method: "POST", headers, body: JSON.stringify({ base_tree: baseTree, tree }) }),
      );

      // 3. one commit, 4. move main to it
      const message =
        `chore(admin): update ${entries.length} section${entries.length > 1 ? "s" : ""}\n\n` +
        entries.map(([p, { message }]) => `- ${p}: ${message}`).join("\n");
      const commit = await j(
        await fetch(`${API}/git/commits`, { method: "POST", headers, body: JSON.stringify({ message, tree: newTree.sha, parents: [latest] }) }),
      );
      await j(
        await fetch(`${API}/git/refs/heads/main`, { method: "PATCH", headers, body: JSON.stringify({ sha: commit.sha }) }),
      );

      setResult({ ok: true, message: `Published ${entries.length} change${entries.length > 1 ? "s" : ""} in one commit, CI redeploys in ~2 min.` });
      setStaged({});
      return true;
    } catch (e) {
      setResult({ ok: false, message: `Publish failed: ${(e as Error).message}` });
      return false;
    } finally {
      setPublishing(false);
    }
  }, [staged]);

  return (
    <Ctx.Provider value={{ staged, count: Object.keys(staged).length, stage, stagePatch, unstage, clear, publishAll, publishing, result, dismissResult }}>
      {children}
    </Ctx.Provider>
  );
}

/** Null when used outside the admin provider. */
export function useGitHubStaging(): StagingCtx | null {
  return useContext(Ctx);
}

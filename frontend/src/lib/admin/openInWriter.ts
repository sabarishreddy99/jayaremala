/**
 * Hand a repo-backed (MDX) post or lab entry to the GitHub writer.
 *
 * The Live editors cannot change MDX entries (the API refuses: the repo file
 * would overwrite the edit on the next deploy). This stashes which entry to
 * open, then switches the admin to the right writer, which picks it up.
 */
const KEY = "avocado_open_in_writer";

export type WriterKind = "blog" | "lab";

export function openInWriter(kind: WriterKind, slug: string): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ kind, slug }));
  } catch { /* storage blocked — the writer simply opens empty */ }
  window.location.hash = kind === "blog" ? "write-blog" : "write-lab";
}

/** The slug waiting to be opened in this writer, if any (read once). */
export function takePendingWrite(kind: WriterKind): string | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const pending = JSON.parse(raw) as { kind: WriterKind; slug: string };
    if (pending.kind !== kind) return null;
    sessionStorage.removeItem(KEY);
    return pending.slug;
  } catch {
    return null;
  }
}

"""One-off scraper: VIT policy PDFs -> the gradeVITian rulebook knowledge base.

Run manually (NOT at app startup):
    pip install pymupdf
    python backend/scripts/parse_regulations.py

Scrapes every document in DOCS and merges them into one retrieval corpus used by
the "Ask the Rulebook" assistant.

Outputs (into backend/data/gradevitian/):
  - regulation_chunks.json  : atomic retrieval corpus. Shape:
                              [{id, section, heading, text, type, source}].
                              Server-only (never shipped to the frontend bundle).
  - _<key>_raw.txt          : full extracted text per document, for inspection /
                              hand-curating the structured regulations.json.

The structured regulations.json (grade scale, attendance %, etc.) is curated by
hand from the raw text — automated structured extraction from arbitrary PDF layout
is too unreliable for numbers the calculators depend on.
"""
from __future__ import annotations

import json
import re
import sys
import urllib.request
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parents[1] / "data" / "gradevitian"
CHUNKS_JSON = OUT_DIR / "regulation_chunks.json"

# Each document is scraped, prefixed with its `key` (so chunk ids never collide)
# and tagged with its `label` as the cited `source`.
DOCS = [
    {
        "key": "reg",
        "label": "Academic Regulations",
        "url": "https://vit.ac.in/sites/default/files/academic/Academic-Regulations.pdf",
    },
    {
        "key": "coc",
        "label": "Student Code of Conduct",
        "url": "https://vit.ac.in/wp-content/uploads/2023/11/Student-Code-of-Conduct.pdf",
    },
]

# A heading looks like "1", "1.2", "5.3.1" optionally followed by a title, OR an
# ALL-CAPS line. Tuned to be permissive; we re-chunk oversized sections below.
_NUM_HEADING = re.compile(r"^\s*(\d+(?:\.\d+){0,3})\.?\s+([A-Z][^\n]{2,80})$")
_CAPS_HEADING = re.compile(r"^\s*([A-Z][A-Z0-9 ,&/()\-]{6,70})\s*$")

_MAX_CHARS = 1200  # split sections longer than this into overlapping windows


def _download(url: str, dest: Path) -> Path:
    if dest.exists() and dest.stat().st_size > 10_000:
        print(f"using cached PDF: {dest.name}")
        return dest
    print(f"downloading {url} ...")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (gradeVITian scraper)"})
    with urllib.request.urlopen(req, timeout=60) as r, dest.open("wb") as f:
        f.write(r.read())
    print(f"saved {dest.name} ({dest.stat().st_size // 1024} KB)")
    return dest


def _extract_text(pdf_path: Path) -> str:
    try:
        import fitz  # PyMuPDF
    except ImportError:
        sys.exit("PyMuPDF not installed. Run: pip install pymupdf")
    doc = fitz.open(pdf_path)
    pages = [page.get_text("text") for page in doc]
    doc.close()
    print(f"  extracted {len(pages)} pages")
    return "\n".join(pages)


def _clean(text: str) -> str:
    text = text.replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _window(text: str, size: int = _MAX_CHARS, overlap: int = 150) -> list[str]:
    if len(text) <= size:
        return [text]
    out, i = [], 0
    while i < len(text):
        out.append(text[i : i + size])
        i += size - overlap
    return out


def _build_chunks(text: str, key: str, label: str) -> list[dict]:
    lines = text.split("\n")
    sections: list[dict] = []
    cur = {"section": "", "heading": "Preamble", "lines": []}

    for line in lines:
        m = _NUM_HEADING.match(line) or _CAPS_HEADING.match(line)
        if m:
            if cur["lines"]:
                sections.append(cur)
            if m.re is _NUM_HEADING:
                cur = {"section": m.group(1), "heading": m.group(2).strip(), "lines": []}
            else:
                cur = {"section": "", "heading": m.group(1).strip().title(), "lines": []}
        else:
            cur["lines"].append(line)
    if cur["lines"]:
        sections.append(cur)

    chunks: list[dict] = []
    for sec in sections:
        body = _clean("\n".join(sec["lines"]))
        if len(body) < 40:  # drop noise / page numbers / empty headers
            continue
        for j, win in enumerate(_window(f"{sec['heading']}. {body}")):
            slug = (sec["section"] or re.sub(r"[^a-z0-9]+", "-", sec["heading"].lower())[:24]).strip("-")
            cid = f"{key}_{slug}" + (f"_{j}" if j else "")
            chunks.append({
                "id": cid,
                "section": sec["section"],
                "heading": sec["heading"],
                "text": win,
                "type": "regulation",
                "source": label,
            })
    return chunks


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    all_chunks: list[dict] = []
    seen_ids: set[str] = set()

    for doc in DOCS:
        key, label, url = doc["key"], doc["label"], doc["url"]
        print(f"\n── {label} ──")
        pdf_path = _download(url, OUT_DIR / f"_{key}.pdf")
        raw = _clean(_extract_text(pdf_path))
        (OUT_DIR / f"_{key}_raw.txt").write_text(raw, encoding="utf-8")
        chunks = _build_chunks(raw, key, label)
        # Guard against duplicate ids within a doc.
        for c in chunks:
            base = c["id"]
            n = 1
            while c["id"] in seen_ids:
                c["id"] = f"{base}_{n}"
                n += 1
            seen_ids.add(c["id"])
        print(f"  {len(chunks)} chunks")
        all_chunks.extend(chunks)

    CHUNKS_JSON.write_text(json.dumps(all_chunks, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nwrote {CHUNKS_JSON} ({len(all_chunks)} chunks from {len(DOCS)} docs)")


if __name__ == "__main__":
    main()

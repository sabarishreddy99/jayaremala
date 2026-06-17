"""Lightweight, dependency-free moderation for gradeVITian feedback.

Returns one of: "approved" (publish), "pending" (hold for admin review), "rejected"
(never shown). It blocks abuse/profanity/slurs and holds spam signals — it does NOT
judge sentiment, so honest negative feedback still gets published.
"""
from __future__ import annotations

import re

# ── Obfuscation normalization ─────────────────────────────────────────────────
_LEET = str.maketrans({"0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b", "@": "a", "$": "s", "|": "i"})


def _collapse(token: str) -> str:
    # runs of 3+ identical chars -> 1 ("fuuuck"->"fuck", "shiiit"->"shit"); keeps real doubles
    return re.sub(r"(.)\1{2,}", r"\1", token)


def _variants(text: str) -> tuple[set[str], str]:
    """Build a robust token set that defeats common obfuscation:
      - leet-speak (5h1t -> shit)
      - in-token punctuation (f*cking -> fcking, f.u.c.k handled below)
      - spacing (f u c k -> fuck, by joining runs of single letters)
    Whole-token matching avoids the Scunthorpe problem (class ≠ ass).
    Also returns the fully concatenated letters for slur substring checks.
    """
    lowered = text.lower().translate(_LEET)
    tokens: set[str] = set()

    # whitespace tokens with in-token punctuation stripped
    for t in lowered.split():
        letters = re.sub(r"[^a-z]", "", t)
        if letters:
            tokens.add(_collapse(letters))

    # join runs of 3+ single-letter fragments (defeats "f u c k", "f.u.c.k")
    frags = [x for x in re.split(r"[^a-z]+", lowered) if x]
    buf: list[str] = []
    for x in frags:
        if len(x) == 1:
            buf.append(x)
        else:
            if len(buf) >= 3:
                tokens.add(_collapse("".join(buf)))
            buf = []
    if len(buf) >= 3:
        tokens.add(_collapse("".join(buf)))

    return tokens, "".join(frags)


# ── Lexicons (base forms + common obfuscation variants; matched as whole tokens) ─
_PROFANITY = {
    "fuck", "fucking", "fuckin", "fucker", "motherfucker", "fck", "fcking", "fuk", "fukin",
    "shit", "sht", "bullshit", "bitch", "btch", "bastard", "asshole", "dick", "dickhead",
    "prick", "cunt", "slut", "whore", "wanker", "bollocks", "pussy", "cock",
    # Hindi/regional roman script common in the VIT context
    "madarchod", "behenchod", "bhenchod", "bsdk", "chutiya", "chutiye", "gandu", "lund", "lawda", "randi",
}
# Hate slurs → reject (also substring-checked on concatenated letters: "n i g g e r").
_SLURS = {"nigger", "nigga", "faggot", "retard", "chink", "spic", "kike", "tranny"}


def _has_link(text: str) -> bool:
    return bool(re.search(r"(https?://|www\.|\b[a-z0-9-]+\.(?:com|net|org|in|io|xyz|ru|info|biz|shop|link)\b)", text, re.I))


def _shouting(text: str) -> bool:
    letters = [c for c in text if c.isalpha()]
    if len(letters) < 16:
        return False
    caps = sum(1 for c in letters if c.isupper())
    return caps / len(letters) > 0.7


def classify(name: str, body: str) -> tuple[str, str]:
    """Return (status, reason). status ∈ {approved, pending, rejected}."""
    # Process name and body separately so single-letter runs can't merge across them.
    t_name, c_name = _variants(name)
    t_body, c_body = _variants(body)
    tokens = t_name | t_body
    concat = c_name + c_body

    # 1. Hard block — slurs and profanity.
    if tokens & _SLURS or any(s in concat for s in _SLURS):
        return "rejected", "hate_slur"
    if tokens & _PROFANITY:
        return "rejected", "profanity"

    # 2. Hold for review — spam signals (often legit, so don't hard-block).
    if _has_link(body):
        return "pending", "link"
    if _shouting(body):
        return "pending", "shouting"
    if re.search(r"(.)\1{9,}", body):  # 10+ same char in a row
        return "pending", "char_flood"
    if len(re.findall(r"\d", body)) >= 10:  # phone/spam digit runs
        return "pending", "digits"

    # 3. Clean (including honest negative feedback) — publish.
    return "approved", "clean"


# ── LLM second pass — catches nuanced abuse with no banned words ──────────────

_LLM_SYSTEM = "You are a strict but fair content moderator for a student feedback wall."

_LLM_PROMPT = """Classify this feedback comment. Reply with EXACTLY ONE word:
- TOXIC: insults, harassment, hate speech, threats, sexual abuse, or profanity aimed at people.
- SPAM: advertising, promotional links, scams, or gibberish.
- OK: everything else, INCLUDING honest negative feedback, criticism, complaints, or bug reports.

Honest criticism is OK, never TOXIC.

Name: {name}
Comment: {body}

One word (TOXIC, SPAM, or OK):"""


def llm_classify(name: str, body: str) -> str | None:
    """Return 'toxic' | 'spam' | 'ok', or None if unavailable/uncertain."""
    from app.core.settings import settings
    if not settings.gv_llm_moderation:
        return None
    try:
        from app.routers.ai import _generate
        raw = _generate(_LLM_SYSTEM, _LLM_PROMPT.format(name=name[:80], body=body[:1000])).strip().lower()
    except Exception:
        return None
    if "toxic" in raw:
        return "toxic"
    if "spam" in raw:
        return "spam"
    if "ok" in raw or "clean" in raw:
        return "ok"
    return None


def moderate(name: str, body: str) -> tuple[str, str]:
    """Full pipeline: keyword filter first, then an LLM second pass that can only
    ESCALATE (approved → pending/rejected), never weaken a keyword verdict."""
    status, reason = classify(name, body)
    if status == "rejected":
        return status, reason  # already clearly blocked — skip the LLM call
    llm = llm_classify(name, body)
    if llm == "toxic":
        return "rejected", "llm_toxic"
    if llm == "spam" and status == "approved":
        return "pending", "llm_spam"
    return status, reason

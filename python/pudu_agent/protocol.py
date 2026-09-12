from __future__ import annotations

import json
import sys
from typing import Any

PROTOCOL_VERSION = 1

INTENTS = ("TEXT", "STRUCTURAL", "RELATIONSHIP", "IMPACT", "SEMANTIC", "UNKNOWN")

IMPACT_HINTS = (
    "impact of",
    "what breaks",
    "if i change",
    "if i modify",
    "affected tests",
    "what can break",
)
RELATIONSHIP_HINTS = (
    "who calls",
    "callers of",
    "depends on",
    "dependencies of",
    "path between",
    "connected to",
    "imports of",
    "what depends",
)
SEMANTIC_HINTS = ("similar to", "like this code", "meaning of")


def read_request(raw: str | None = None) -> dict[str, Any]:
    text = sys.stdin.read() if raw is None else raw
    text = text.strip()
    if not text:
        raise ValueError("empty request")
    data = json.loads(text)
    if not isinstance(data, dict):
        raise ValueError("request must be a JSON object")
    return data


def write_response(payload: dict[str, Any]) -> None:
    sys.stdout.write(json.dumps(payload, ensure_ascii=False))
    sys.stdout.write("\n")
    sys.stdout.flush()


def error_response(message: str, **extra: Any) -> dict[str, Any]:
    body: dict[str, Any] = {
        "schemaVersion": PROTOCOL_VERSION,
        "ok": False,
        "error": message,
    }
    body.update(extra)
    return body


def classify_intent(
    query: str | None,
    structural_pattern: str | None,
    explicit: str | None,
) -> str:
    if explicit:
        value = explicit.strip().upper()
        if value in INTENTS and value != "UNKNOWN":
            return value
    if structural_pattern:
        return "STRUCTURAL"
    q = (query or "").strip()
    if any(token in q for token in ("$$$", "$")):
        return "STRUCTURAL"
    low = q.lower()
    if any(hint in low for hint in IMPACT_HINTS):
        return "IMPACT"
    if any(hint in low for hint in RELATIONSHIP_HINTS):
        return "RELATIONSHIP"
    if any(hint in low for hint in SEMANTIC_HINTS):
        return "SEMANTIC"
    if explicit and explicit.strip().upper() == "UNKNOWN":
        return "UNKNOWN"
    if q:
        return "TEXT"
    return "UNKNOWN"


def strategies_for(intent: str) -> list[str]:
    if intent == "TEXT":
        return ["rg"]
    if intent == "STRUCTURAL":
        return ["ast-grep"]
    if intent in {"RELATIONSHIP", "IMPACT"}:
        return ["graph"]
    if intent == "SEMANTIC":
        return []
    return ["rg", "ast-grep"]

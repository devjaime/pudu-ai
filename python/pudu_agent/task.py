"""Validated text-only task contracts for the local task worker."""

from dataclasses import dataclass
from enum import Enum
from typing import Any, Mapping


class TaskKind(str, Enum):
    ANALYSIS = "analysis"
    SUMMARY = "summary"
    CODE_REVIEW = "code_review"
    TEST_GENERATION = "test_generation"
    DOCUMENTATION = "documentation"


@dataclass(frozen=True)
class Task:
    kind: TaskKind
    text: str

    def __post_init__(self) -> None:
        if not isinstance(self.kind, TaskKind):
            raise ValueError("kind must be a supported TaskKind")
        if not isinstance(self.text, str) or not self.text.strip():
            raise ValueError("text must be a non-empty string")

    @classmethod
    def from_dict(cls, value: Mapping[str, Any]) -> "Task":
        if not isinstance(value, Mapping):
            raise ValueError("task must be an object")
        try:
            kind = TaskKind(value.get("kind"))
        except (ValueError, TypeError):
            raise ValueError("kind must be one of: " + ", ".join(item.value for item in TaskKind)) from None
        return cls(kind=kind, text=value.get("text"))

    def to_dict(self) -> dict[str, str]:
        return {"kind": self.kind.value, "text": self.text}

"""Validated text-only task contracts for the local task worker."""

from copy import deepcopy
from dataclasses import dataclass, field
from enum import Enum
from types import MappingProxyType
from typing import Any, Mapping
from uuid import uuid4


class TaskKind(str, Enum):
    ANALYSIS = "analysis"
    SUMMARY = "summary"
    CODE_REVIEW = "code_review"
    TEST_GENERATION = "test_generation"
    DOCUMENTATION = "documentation"


@dataclass(frozen=True)
class Task:
    kind: TaskKind
    prompt: str
    id: str = field(default_factory=lambda: uuid4().hex)
    repository: str | None = None
    effort: str | None = None
    model: str | None = None
    metadata: Mapping[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if not isinstance(self.id, str) or not self.id.strip():
            raise ValueError("id must be non-empty text")
        if not isinstance(self.kind, TaskKind):
            raise ValueError("kind must be a supported TaskKind")
        if not isinstance(self.prompt, str) or not self.prompt.strip():
            raise ValueError("prompt must be non-empty text")
        for name in ("repository", "effort", "model"):
            value = getattr(self, name)
            if value is not None and (not isinstance(value, str) or not value.strip()):
                raise ValueError(f"{name} must be non-empty text or None")
        if not isinstance(self.metadata, Mapping):
            raise ValueError("metadata must be an object")
        object.__setattr__(self, "metadata", MappingProxyType(deepcopy(dict(self.metadata))))

    @classmethod
    def from_dict(cls, value: Mapping[str, Any]) -> "Task":
        if not isinstance(value, Mapping):
            raise ValueError("task must be an object")
        try:
            kind = TaskKind(value.get("kind"))
        except (ValueError, TypeError):
            raise ValueError("kind must be one of: " + ", ".join(item.value for item in TaskKind)) from None
        return cls(
            id=value.get("id", uuid4().hex),
            kind=kind,
            prompt=value.get("prompt"),
            repository=value.get("repository"),
            effort=value.get("effort"),
            model=value.get("model"),
            metadata=value.get("metadata", {}),
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "kind": self.kind.value,
            "prompt": self.prompt,
            "repository": self.repository,
            "effort": self.effort,
            "model": self.model,
            "metadata": deepcopy(dict(self.metadata)),
        }

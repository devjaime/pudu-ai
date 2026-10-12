"""Structural-only response verification; it does not check factual correctness."""

import json
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class VerificationResult:
    level: str
    status: str
    checks: list[str]
    factual_correctness_checked: bool = False


def verify_response(content: str, *, min_length: int = 1, json_schema: dict[str, Any] | None = None,
                    required_fields: list[str] | None = None) -> VerificationResult:
    if not isinstance(min_length, int) or isinstance(min_length, bool) or min_length < 1:
        raise ValueError("min_length must be a positive integer")
    if json_schema is not None and not isinstance(json_schema, dict):
        raise ValueError("json_schema must be an object")
    if required_fields is not None and (not isinstance(required_fields, list) or
                                        any(not isinstance(name, str) for name in required_fields)):
        raise ValueError("required_fields must be a list of strings")
    checks: list[str] = []
    passed = True
    if not isinstance(content, str) or not content.strip():
        checks.append("response is non-empty text: failed")
        passed = False
    else:
        checks.append("response is non-empty text: passed")
        if len(content.strip()) < min_length:
            checks.append(f"response meets minimum length {min_length}: failed")
            passed = False
        else:
            checks.append(f"response meets minimum length {min_length}: passed")
    required = required_fields
    if json_schema is not None:
        if json_schema.get("type", "object") != "object":
            checks.append("JSON schema type is object: failed")
            passed = False
        schema_required = json_schema.get("required", [])
        if not isinstance(schema_required, list) or any(not isinstance(item, str) for item in schema_required):
            checks.append("JSON schema required fields are valid: failed")
            passed = False
        else:
            required = list(dict.fromkeys((required or []) + schema_required))
        properties = json_schema.get("properties", {})
        if not isinstance(properties, dict):
            checks.append("JSON schema properties are valid: failed")
            passed = False
            properties = {}
    if json_schema is not None or required:
        try:
            parsed = json.loads(content)
        except (TypeError, json.JSONDecodeError):
            checks.append("response parses as JSON object: failed")
            passed = False
        else:
            if not isinstance(parsed, dict):
                checks.append("response parses as JSON object: failed")
                passed = False
            else:
                missing = [name for name in required if name not in parsed]
                checks.append("required fields present: " + ("passed" if not missing else "failed: " + ", ".join(missing)))
                passed = passed and not missing
                for name, specification in properties.items():
                    if name not in parsed:
                        continue
                    expected = specification.get("type") if isinstance(specification, dict) else None
                    if expected is None:
                        continue
                    valid = _matches_type(parsed[name], expected)
                    checks.append(f"field {name} has structural type {expected}: {'passed' if valid else 'failed'}")
                    passed = passed and valid
    return VerificationResult("STRUCTURAL", "passed" if passed else "failed", checks)


def _matches_type(value: Any, expected: Any) -> bool:
    if isinstance(expected, list):
        return any(_matches_type(value, item) for item in expected)
    types = {"object": dict, "array": list, "string": str, "boolean": bool, "null": type(None)}
    if expected == "integer":
        return isinstance(value, int) and not isinstance(value, bool)
    if expected == "number":
        return isinstance(value, (int, float)) and not isinstance(value, bool)
    return isinstance(expected, str) and expected in types and isinstance(value, types[expected])

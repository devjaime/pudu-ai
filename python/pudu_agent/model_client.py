"""Small, bounded stdlib HTTP client for a local Ollama instance."""

import json
from dataclasses import dataclass
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit, urlunsplit
from urllib.request import HTTPHandler, HTTPRedirectHandler, OpenerDirector, Request


MAX_RESPONSE_BYTES = 2 * 1024 * 1024


class OllamaError(RuntimeError):
    """The local Ollama service was unavailable or returned invalid data."""


def validate_endpoint(endpoint: str) -> str:
    if not isinstance(endpoint, str):
        raise ValueError("endpoint must be a URL")
    try:
        parsed = urlsplit(endpoint.strip())
        host = (parsed.hostname or "").lower()
        port = parsed.port
    except ValueError:
        raise ValueError("endpoint must be a valid loopback URL") from None
    if parsed.scheme != "http" or host not in {"localhost", "127.0.0.1", "::1"}:
        raise ValueError("Ollama endpoint must use HTTP on loopback")
    if parsed.username is not None or parsed.password is not None:
        raise ValueError("endpoint credentials are not allowed")
    if parsed.query or parsed.fragment:
        raise ValueError("endpoint query and fragment are not allowed")
    if parsed.path not in {"", "/"}:
        raise ValueError("endpoint must not include a path")
    netloc = f"[{host}]" if ":" in host else host
    if port is not None:
        netloc += f":{port}"
    return urlunsplit(("http", netloc, "", "", ""))


class _NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


_opener = OpenerDirector()
_opener.add_handler(_NoRedirect())
_opener.add_handler(HTTPHandler())


def urlopen(request: Request, timeout: float):
    """Open without environment proxies or redirect following."""
    return _opener.open(request, timeout=timeout)


@dataclass(frozen=True)
class GenerateResult:
    text: str
    total_duration: int | None = None
    load_duration: int | None = None
    prompt_eval_count: int | None = None
    eval_count: int | None = None
    eval_duration: int | None = None


class OllamaClient:
    def __init__(self, endpoint: str = "http://localhost:11434", *, timeout: float = 10.0,
                 max_response_bytes: int = MAX_RESPONSE_BYTES):
        if timeout <= 0:
            raise ValueError("timeout must be positive")
        if max_response_bytes <= 0:
            raise ValueError("max_response_bytes must be positive")
        self.endpoint = validate_endpoint(endpoint)
        self.timeout = timeout
        self.max_response_bytes = max_response_bytes

    def _request(self, path: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
        data = json.dumps(payload).encode("utf-8") if payload is not None else None
        request = Request(self.endpoint + path, data=data, headers={"Content-Type": "application/json"}, method="POST" if data else "GET")
        try:
            with urlopen(request, timeout=self.timeout) as response:
                raw = response.read(self.max_response_bytes + 1)
            if len(raw) > self.max_response_bytes:
                raise OllamaError("Ollama response exceeded configured size limit")
            parsed = json.loads(raw.decode("utf-8"))
        except OllamaError:
            raise
        except (HTTPError, URLError, OSError, TimeoutError, UnicodeError, json.JSONDecodeError) as exc:
            raise OllamaError(f"Ollama request failed: {exc}") from exc
        if not isinstance(parsed, dict):
            raise OllamaError("Ollama response must be a JSON object")
        return parsed

    def health(self) -> bool:
        self._request("/api/tags")
        return True

    def list_models(self) -> list[str]:
        data = self._request("/api/tags")
        models = data.get("models")
        if not isinstance(models, list):
            raise OllamaError("Ollama model response is missing models")
        names = []
        for item in models:
            name = item.get("name") if isinstance(item, dict) else None
            if not isinstance(name, str) or not name:
                raise OllamaError("Ollama returned an invalid model entry")
            if _is_cloud_tag(name):
                raise OllamaError("cloud model tags are not supported")
            names.append(name)
        return names

    def select_model(self, preferred: str | None = None) -> str | None:
        models = self.list_models()
        if preferred is not None and _is_cloud_tag(preferred):
            raise OllamaError("cloud model tags are not supported")
        return preferred if preferred in models else (models[0] if models else None)

    def generate(self, model: str, prompt: str) -> GenerateResult:
        if not isinstance(model, str) or not model or _is_cloud_tag(model):
            raise ValueError("a local model name is required")
        if not isinstance(prompt, str) or not prompt:
            raise ValueError("prompt must be non-empty text")
        data = self._request("/api/generate", {"model": model, "prompt": prompt, "stream": False})
        text = data.get("response")
        if not isinstance(text, str):
            raise OllamaError("Ollama generate response is missing text")
        metrics = {}
        for field in GenerateResult.__dataclass_fields__:
            if field == "text":
                continue
            value = data.get(field)
            if value is not None and (not isinstance(value, int) or isinstance(value, bool) or value < 0):
                raise OllamaError(f"Ollama returned invalid metric: {field}")
            metrics[field] = value
        return GenerateResult(text=text, **metrics)


def _is_cloud_tag(name: str) -> bool:
    return name.rsplit(":", 1)[-1].lower() == "cloud"

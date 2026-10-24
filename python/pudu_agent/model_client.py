"""Small, bounded stdlib HTTP client for a local Ollama instance."""

import json
import re
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
    if parsed.scheme != "http" or host not in {"127.0.0.1", "::1"}:
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
    model: str
    content: str
    prompt_tokens: int | None = None
    completion_tokens: int | None = None
    total_tokens: int | None = None
    total_duration: int | None = None
    load_duration: int | None = None
    eval_duration: int | None = None
    tokens_per_second: float | None = None


@dataclass(frozen=True)
class ModelInfo:
    """Installed model identity used for reproducibility manifests."""

    tag: str
    digest: str | None


class OllamaClient:
    """Local Ollama client; timeout bounds socket operations, not total wall time.

    urllib can continue an in-flight response while socket reads keep making progress;
    it does not provide a synchronous end-to-end cancellation deadline.
    """

    def __init__(self, endpoint: str = "http://127.0.0.1:11434", *, timeout: float = 10.0,
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
        return [model.tag for model in self.list_model_details()]

    def list_model_details(self) -> list[ModelInfo]:
        """List local installed models with their API-provided digest when present."""
        data = self._request("/api/tags")
        models = data.get("models")
        if not isinstance(models, list):
            raise OllamaError("Ollama model response is missing models")
        details = []
        for item in models:
            name = item.get("name") if isinstance(item, dict) else None
            if not isinstance(name, str) or not name:
                raise OllamaError("Ollama returned an invalid model entry")
            if _is_cloud_tag(name):
                continue
            digest = item.get("digest")
            if digest is not None and (not isinstance(digest, str) or not digest):
                raise OllamaError("Ollama returned an invalid model digest")
            details.append(ModelInfo(tag=name, digest=digest))
        return details

    def server_version(self) -> str:
        """Return the bounded server version reported by ``/api/version``."""
        data = self._request("/api/version")
        version = data.get("version")
        if (not isinstance(version, str) or not version.strip() or len(version) > 128
                or any(ord(character) < 32 or ord(character) == 127 for character in version)):
            raise OllamaError("Ollama version response has an invalid version")
        return version

    def select_model(self, preferred: str | None = None) -> str | None:
        if preferred is not None and _is_cloud_tag(preferred):
            raise OllamaError("cloud model tags are not supported")
        models = self.list_models()
        if preferred is not None:
            if preferred not in models:
                raise OllamaError("requested local model is not installed")
            return preferred
        return models[0] if models else None

    def generate(self, model: str, prompt: str, *, format: str | None = None,
                 options: dict[str, Any] | None = None) -> GenerateResult:
        if not isinstance(model, str) or not model or _is_cloud_tag(model):
            raise ValueError("a local model name is required")
        if not isinstance(prompt, str) or not prompt:
            raise ValueError("prompt must be non-empty text")
        if format is not None and format != "json":
            raise ValueError("format must be 'json' when specified")
        validated_options = _validate_generation_options(options)
        payload: dict[str, Any] = {"model": model, "prompt": prompt, "stream": False}
        if format is not None:
            payload["format"] = format
        if validated_options is not None:
            payload["options"] = validated_options
        data = self._request("/api/generate", payload)
        content = data.get("response")
        if not isinstance(content, str):
            raise OllamaError("Ollama generate response is missing text")
        response_model = data.get("model", model)
        if not isinstance(response_model, str) or not response_model:
            raise OllamaError("Ollama generate response has invalid model")
        metrics = {}
        for field, source in (("prompt_tokens", "prompt_eval_count"), ("completion_tokens", "eval_count"),
                              ("total_duration", "total_duration"), ("load_duration", "load_duration"),
                              ("eval_duration", "eval_duration")):
            value = data.get(source)
            if value is not None and (not isinstance(value, int) or isinstance(value, bool) or value < 0):
                raise OllamaError(f"Ollama returned invalid metric: {source}")
            metrics[field] = value
        prompt_tokens = metrics.pop("prompt_tokens")
        completion_tokens = metrics.pop("completion_tokens")
        total_tokens = prompt_tokens + completion_tokens if prompt_tokens is not None and completion_tokens is not None else None
        eval_duration = metrics["eval_duration"]
        tokens_per_second = None
        if completion_tokens is not None and eval_duration is not None and eval_duration > 0:
            tokens_per_second = completion_tokens / (eval_duration / 1_000_000_000)
        return GenerateResult(model=response_model, content=content, prompt_tokens=prompt_tokens,
                              completion_tokens=completion_tokens, total_tokens=total_tokens,
                              tokens_per_second=tokens_per_second, **metrics)


def _is_cloud_tag(name: str) -> bool:
    return re.search(r"(?::cloud|-cloud)$", name, re.IGNORECASE) is not None


def _validate_generation_options(options: dict[str, Any] | None) -> dict[str, int | float] | None:
    if options is None:
        return None
    if not isinstance(options, dict):
        raise ValueError("generation options must be an object")
    allowed = {"temperature", "seed"}
    if set(options) - allowed:
        raise ValueError("generation options contain an unsupported field")
    result: dict[str, int | float] = {}
    if "temperature" in options:
        temperature = options["temperature"]
        if (not isinstance(temperature, (int, float)) or isinstance(temperature, bool)
                or not 0 <= temperature <= 2):
            raise ValueError("temperature must be a finite number between 0 and 2")
        result["temperature"] = temperature
    if "seed" in options:
        seed = options["seed"]
        if not isinstance(seed, int) or isinstance(seed, bool) or not 0 <= seed <= 2**31 - 1:
            raise ValueError("seed must be a non-negative 32-bit integer")
        result["seed"] = seed
    return result

# Pudu-AI

Open-source terminal lab for discovering, inspecting, benchmarking, and comparing local AI models.

- GitHub repository: `pudu-ai`
- npm package / CLI: `pudu-ai`
- Primary command: `npx pudu-ai`

## Problem

People run local models without knowing whether their machine can handle them, how fast they actually are, or how they compare. Estimates and measurements get mixed. Hardware details are guessed.

## Solution

A professional TUI plus machine-readable CLI that:

1. Detects the computer (CPU, GPU, RAM / unified memory, runtimes).
2. Discovers installed local models (Ollama, llama.cpp GGUF paths).
3. Grades compatibility (S–F) via CanIRun.ai when online, with a local fallback cache.
4. Benchmarks with real `llama-bench` while streaming system telemetry.
5. Persists history locally and never uploads machine identifiers.

## Non-negotiables

- Estimated vs Measured are never mixed.
- Unavailable metrics display `N/A` — never invented.
- Apple unified memory is never called VRAM.
- Business logic does not depend on Ink.
- Network is optional (`--no-network`).
- Benchmark data stays in `~/.pudu-ai/` by default.
- Default UI language is English; Spanish is available via `--lang es`.

## Phases

| Phase | Scope |
| --- | --- |
| 1 (MVP) | macOS Apple Silicon: hardware, Ollama, GGUF, llama-bench, live TUI, CanIRun, history, JSON |
| 2 | Compare, LM Studio, MLX, energy efficiency, Markdown reports |
| 3 | Linux NVIDIA/AMD, Windows, opt-in community database |

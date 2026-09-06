# Contributing

Thanks for helping with Pudu-AI (`npx pudu-ai`).

## Setup

```bash
git clone https://github.com/devjaime/pudu-ai.git
cd pudu-ai
npm install
npm test
npm run typecheck
npm run dev
```

Requires Node.js 20+.

## Guidelines

- Keep business logic out of Ink components (`src/tui`).
- Do not invent metrics. Use `N/A` when a value cannot be measured.
- Label estimated vs measured performance.
- Never call Apple unified memory “VRAM”.
- Add fixtures for command output parsers. Unit tests must not require real GPUs.
- Integration tests that call Ollama / llama-bench should skip when the binary is missing.
- Do not copy source from CanIRun.ai, basitop, or other projects. Credit ideas and APIs.

## Commit style

Keep commits focused. Semantic versioning: features MINOR, fixes PATCH, breaking MAJOR.

## Pull requests

1. Tests and `npm run typecheck` pass.
2. Update CHANGELOG.md.
3. Describe platform coverage (macOS / Linux / Windows).

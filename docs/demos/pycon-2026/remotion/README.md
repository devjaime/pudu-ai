# PyCon Agent Lab demo

This nested Remotion package builds a 90-second, 1920×1080, 30fps captions-only segment for the virtual PyCon talk. It uses no voiceover or remote media. The source composition applies only deterministic frame-based interpolation/springs and local assets.

## Build and verify

From this directory:

```sh
npm ci
npm test
npm run typecheck
npm run compositions
npm run render
```

The renderer writes `../pycon-2026-agent-lab-demo.mp4`. The composition is `PyConAgentLab`. Remotion, CLI, and transitions are pinned to 4.0.537; React and ReactDOM are pinned to 18.3.1.

## Evidence shown

The public Python fixture is `tests/fixtures/repos/python-small`. During implementation these local CLI commands were run and their JSON output inspected:

```sh
npm run pudu-ai -- repo search validate_user --repo tests/fixtures/repos/python-small --json
npm run pudu-ai -- repo graph --repo tests/fixtures/repos/python-small --json
```

Observed search result: ripgrep strategy, four literal matches at `notes.txt:2`, `auth.py:1`, `auth.py:7`, and `auth.py:12`. The comment match is intentionally included: this is literal text search, not a claim that all results are semantic references.

Observed graph result: Python standard-library AST backend, eight nodes and nine edges. Two resolved call edges point from `authenticate` and `UserService.check` to `validate_user`. The video shows only those captured relations. Graph extraction describes source structure; it is not a factual guarantee.

The renderer includes one captured `durationMs` observation in process output, but runtime duration is variable and is not presented as a fixed benchmark or expected result. Authored headings and takeaway are presentation copy.

## Assets and accessibility

`public/assets/worker-diagram-dark.png` is copied from the repository's existing dark local-worker diagram preview and shown with deterministic pan/zoom. Captions are both burned into the image and provided in `../captions.es.vtt`. Text uses high-contrast foregrounds and panel boundaries so meaning is not conveyed by color alone.

## Current render artifact

The verified local MP4 is `../pycon-2026-agent-lab-demo.mp4` (11,603,273 bytes; SHA-256 `22f18a46a1cd936c174a719dc97547e2eb066afe7d164b3679f185e30497a3ae`). It is kept locally and ignored by Git; regenerate it with `npm run render`.

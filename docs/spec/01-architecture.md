# Architecture

```
Hardware detection
        ↓
Model discovery
        ↓
Compatibility
        ↓
Benchmark engine
        ↓
Telemetry
        ↓
Result normalization
        ↓
Storage
        ↓
TUI / JSON / CSV
```

## Layers

| Layer | Path | Depends on UI? |
| --- | --- | --- |
| CLI parse + dispatch | `src/cli` | no |
| Hardware | `src/hardware`, `src/platform/*` | no |
| Runtimes / adapters | `src/runtimes`, `src/adapters` | no |
| Models | `src/models` | no |
| Compatibility | `src/compatibility` | no |
| Benchmark | `src/benchmark` | no |
| Telemetry | `src/telemetry` | no |
| Storage | `src/storage` | no |
| Session composition | `src/session` | no |
| TUI | `src/tui` | Ink only |

The same session + benchmark engine powers interactive TUI, `--json`, and future UIs.

## Adapters

```ts
interface ModelRuntime {
  id: string
  detect(): Promise<boolean>
  listModels(): Promise<LocalModel[]>
  resolveModel(id: string): Promise<ModelArtifact | undefined>
  benchmarkCapabilities(): Promise<BenchmarkCapability[]>
}
```

Platform code lives under `src/platform/{macos,linux,windows}`. Core types stay OS-agnostic.

## Subprocess rules

- Timeouts on every exec.
- Track child PIDs; SIGINT kills llama-bench, telemetry, and restores the terminal.
- No zombie processes.

## Storage

```
~/.localmeter/
  config.json
  models.json
  cache/canirun-models.json
  benchmarks/
  telemetry/
```

Schemas are versioned (`schemaVersion: 1`).

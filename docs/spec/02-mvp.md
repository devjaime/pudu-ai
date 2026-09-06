# MVP (Phase 1) — macOS Apple Silicon

## First run (`npx pudu`)

1. Inspect hardware.
2. Detect Ollama, llama.cpp, llama-bench, LM Studio, MLX (detect-only).
3. List installed models.
4. Cache CanIRun catalog when network is allowed.
5. Show recommendations.
6. Interactive dashboard with [B][M][R][H][C][Q].

## Commands

- `pudu` dashboard
- `hardware` `models` `recommend` `benchmark [model]` `compare` `history` `doctor` `report`
- `models add-path <dir>`
- Flags: `--json` `--csv` `--no-network` `--no-color` `--verbose` `--preset quick|standard|stress` `--lang en|es`

## Mini benchmark

```
llama-bench -m MODEL -p 512 -n 128 -r 3 -o json
```

Presets: Quick (512/128/3), Standard (2048/256/5), Stress (4096/512/10).

## Live dashboard

Update 500ms–1s: prompt t/s, generation t/s, CPU, GPU, memory, swap, power, thermals when available. Otherwise `N/A`.

## Definition of done

From a clean machine with Node 20+ and local models:

```
npx pudu
```

shows chip, unified memory, installed models, recommendations, and can run a benchmark that persists to `~/.pudu/benchmarks`.

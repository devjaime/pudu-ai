# Transformers impact evidence

**Question:** What code is a candidate impact surface if GenerationMixin.generate changes?
**Target:** `GenerationMixin.generate`

## Pinned repository

- Repository: `huggingface/transformers`
- Tag: `v5.20.2`
- Commit: `18329f1065382e54db698e242cf98bd3f3e5a766`

## Investigation stages

| Stage | Status | Detail |
|---|---|---|
| `FIXTURE_IDENTITY` | **VERIFIED** | Collector validated the exact Git checkout root, commit, and tag. |
| `BOUNDED_PYTHON_AST_EVIDENCE` | **COMPLETED** | Collector inspected configured source paths and bounded sorted model/test Python file sets. |
| `REPORT_AND_CONTEXT_MEASUREMENT` | **COMPLETED** | Report generated from the in-memory evidence object; byte measurement covers cited files only. |
| `RUNTIME_TESTS` | **NOT_RUN** | This report command does not execute Transformers tests or model code. |
| `MODEL_ANALYSIS` | **NOT_RUN** | No model call was performed for this artifact. |

## Context-size measurement

Compared metadata size: **3,682 bytes**; full cited source files: **816,502 bytes** across 13 files.
Deterministic byte reduction: **99.55%**.
_A deterministic byte-size comparison only; metadata is not semantically equivalent to source code and bytes are not tokens._

## Claims and source evidence

### CONFIRMED — GenerationMixin.generate definition

The pinned source defines GenerationMixin and its generate method.

- `src/transformers/generation/utils.py#L495-L4342` — defines generation mixin (**CONFIRMED**).
- `src/transformers/generation/utils.py#L2569-L2999` — defines generate method (**CONFIRMED**).

### CONFIRMED — Text-generation pipeline caller

The text-generation pipeline contains a lexical call to model.generate.

- `src/transformers/pipelines/text_generation.py#L394-L394` — calls generate on model (**CONFIRMED**).

### INFERRED — Model inheritance candidates

The bounded AST scan found 8 model classes declaring GenerationMixin inheritance; runtime participation is not established.

- `src/transformers/models/afmoe/modeling_afmoe.py#L590-L666` — inherits from GenerationMixin (**CONFIRMED**).
- `src/transformers/models/afmoe/modular_afmoe.py#L394-L453` — inherits from GenerationMixin (**CONFIRMED**).
- `src/transformers/models/apertus/modeling_apertus.py#L404-L475` — inherits from GenerationMixin (**CONFIRMED**).
- `src/transformers/models/arcee/modeling_arcee.py#L406-L477` — inherits from GenerationMixin (**CONFIRMED**).
- `src/transformers/models/aria/modeling_aria.py#L701-L773` — inherits from GenerationMixin (**CONFIRMED**).
- `src/transformers/models/aria/modeling_aria.py#L979-L1116` — inherits from GenerationMixin (**CONFIRMED**).
- `src/transformers/models/audioflamingo3/modeling_audioflamingo3.py#L566-L638` — inherits from GenerationMixin (**CONFIRMED**).
- `src/transformers/models/auto/modeling_auto.py#L35-L36` — inherits from GenerationMixin (**CONFIRMED**).

### CONFIRMED — Generation configuration contract

The public GenerationConfig declaration is present in the pinned source.

- `src/transformers/generation/configuration_utils.py#L100-L1376` — defines the public generation configuration contract (**CONFIRMED**).

### CONFIRMED — Test source references

The bounded AST scan found 8 lexical generate() test call sites; tests were not executed by this collector.

- `tests/generation/test_continuous_batching.py#L224-L224` — test invokes generate (**CONFIRMED**).
- `tests/generation/test_continuous_batching.py#L1297-L1299` — test invokes generate (**CONFIRMED**).
- `tests/generation/test_continuous_batching.py#L1462-L1467` — test invokes generate (**CONFIRMED**).
- `tests/generation/test_flash_attention_parity.py#L64-L64` — test invokes generate (**CONFIRMED**).
- `tests/generation/test_flash_attention_parity.py#L72-L72` — test invokes generate (**CONFIRMED**).
- `tests/generation/test_flash_attention_parity.py#L108-L110` — test invokes generate (**CONFIRMED**).
- `tests/generation/test_streamers.py#L59-L59` — test invokes generate (**CONFIRMED**).
- `tests/generation/test_streamers.py#L76-L76` — test invokes generate (**CONFIRMED**).

### UNRESOLVED — Complete runtime impact

Static source evidence cannot prove complete runtime impact or dynamic dispatch.

- Qualification: Candidate impact only.

## Limitations

- AST evidence does not resolve dynamic dispatch, registries, generated mappings, native extensions, or all runtime paths.
- The bounded test scan returns at most eight lexical generate() call sites; it does not execute tests or prove assertions.
- Model inheritance and pipeline calls are candidate impact, not proof that a specific runtime uses these paths.
- Evidence is a bounded source-level candidate-impact set, not a complete dependency graph or runtime proof.
- Context reduction is a file-byte comparison of metadata against full cited source files, not a token or semantic-equivalence measurement.
- Model analysis is NOT_RUN; no model inference or weights were used.

# Local workbench — Gemma 4, Antigravity, vault graphs, Obsidian

[English](05-local-workbench.md) · [Español](05-local-workbench.es.md)

Status: spec only. Not a release. Do not publish until the slice has tests and the seam below is accepted.

Related (do not replace):

- `00-overview.md` — hardware lab, estimated vs measured
- `03-scoring.md` — Pudu-AI Score is hardware only
- `04-privacy.md` — local-first, `--no-network`
- `agent-lab.md` — code graph and task score, mostly unimplemented past search/graph/harness

## Problem Statement

A local operator wants the next Pudu-AI slice to do three jobs without turning the lab into another coding agent:

1. See whether **Gemma 4** can run **on this machine** for a local task, and wire **Antigravity** to that local model only when the hardware gate passes.
2. Keep a **local graph** of the repo (already started) and of a notes vault, with edges that were parsed, never guessed.
3. Drop that graph into **Obsidian** as files they already own, without uploading notes or inventing a quality score.

Today the lab can launch OpenCode, OpenClaw, Hermes, and Claude Code through Ollama, but only as an explain-first gate. It knows Gemma 3 tags, not Gemma 4. The code graph is Python AST plus an optional Graphify file. Tasks print prompts; they do not run a model. There is no vault graph and no Obsidian export.

## Solution

One eligibility decision and one graph export. Nothing else.

- Classify a model tag as local, cloud, or unknown. Cloud Gemma 4 tags are never "local".
- Recommend a Gemma 4 size that fits unified memory. Explain Antigravity as a loopback OpenAI-compatible client of Ollama, or as detect-only for a LiteRT checkpoint. Do not pretend `ollama launch` knows Antigravity.
- Default remains explain-only. `--yes` may write a local config snippet or print the exact local endpoint. It must not install Antigravity, pip-install an SDK, or download a checkpoint.
- Build a vault graph from markdown wikilinks the same way the code graph builds EXTRACTED edges. Export either graph as Obsidian markdown only when the user passes an explicit directory and `--yes`.

Pudu-AI Score stays a hardware score. Task quality stays `N/A` until a real task trace exists.

## User Stories

1. As a local operator, I want `tasks` and `launch` to recognize Gemma 4 tags (`gemma4:e2b`, `e4b`, `12b`, `26b`, `31b`, and MLX variants), so that a catalog name is not treated as unpullable when Ollama has a real tag.
2. As a local operator, I want cloud tags (`gemma4:cloud`, `gemma4:31b-cloud`) marked cloud and blocked as a local task target, so that `--no-network` cannot be bypassed by a tag.
3. As a local operator, I want a size recommendation from unified memory, so that a 26B / 31B tag is not offered on a machine that cannot hold it.
4. As a local operator, I want Antigravity detected (`agy` or the app) without installing it, so that a missing tool is `not detected` and not a crash.
5. As a local operator, I want an explain-only decision for Antigravity, so that I see the model, grade, origin (measured or estimated), and the loopback URL before anything is written.
6. As a local operator, I want `--yes` to write only a local config that points at `http://127.0.0.1:11434/v1` and a non-cloud Gemma 4 tag, so that Antigravity uses this machine's Ollama.
7. As a local operator, I want LiteRT / `.litertlm` treated as detect-only, so that Pudu-AI never downloads the ~17 GB checkpoint or runs `pip install`.
8. As a local operator, I want the Antigravity installer left alone, so that Pudu-AI never curl-pipes `antigravity.google`.
9. As a local operator, I want a blocked launch when the grade is below the allowed set or measured t/s is below the agent floor, so that a weak estimate cannot pull or start an agent.
10. As a local operator, I want the existing Ollama integrations unchanged, so that OpenCode / OpenClaw / Hermes / Claude keep their current gates.
11. As a local operator, I want `repo graph` to keep writing a code graph with EXTRACTED / RESOLVED / INFERRED edges, so that Python repos do not regress.
12. As a local operator, I want a vault graph of markdown notes (wikilinks, headings, attachments that exist on disk), so that an Obsidian vault is not forced through the Python AST.
13. As a local operator, I want unresolved wikilinks reported as unresolved, not invented as edges, so that a missing note is not a relationship.
14. As a local operator, I want semantic "related note" edges out of this slice, so that an LLM cannot smuggle INFERRED links into the EXTRACTED count.
15. As a local operator, I want `repo graph --vault PATH` (or equivalent) to refuse to walk outside the given root, so that `~` or `/` is not silently indexed.
16. As a local operator, I want an Obsidian export of the graph as markdown notes plus a link index, so that I can open a folder as a vault.
17. As a local operator, I want export to be a no-op unless `--out` and `--yes` are both set, so that my existing vault is not overwritten by surprise.
18. As a local operator, I want export to skip `.obsidian/` and not write plugins, so that Pudu-AI does not become an Obsidian plugin installer.
19. As a local operator, I want JSON for eligibility, graph, and export, so that the TUI is not required to verify the slice.
20. As a local operator, I want Spanish and English strings for the new messages, so that `--lang` stays a UI locale and not a graph-language flag.
21. As a local operator, I want missing metrics as `N/A` / `null`, so that a missing benchmark is not filled with Gemma 4's published scores.
22. As a local operator, I want hardware commands to keep working if Python, Antigravity, or Obsidian are absent, so that the lab does not grow a hard dependency.

## Implementation Decisions

- **One seam.** Extend the integration decision so a host is `ollama-launch` (existing four tools), `openai-compatible-local` (Antigravity against loopback Ollama), or `detect-only` (LiteRT checkpoint, Obsidian app). Do not add Antigravity as a fifth `ollama launch` id. Ollama's Gemma 4 application list does not include Antigravity.
- **Tag table, not a live catalog scrape.** Add Gemma 4 local tags next to the existing Gemma 3 rules. A tag ending in `-cloud` or equal to `gemma4:cloud` is cloud. Unknown tags stay unresolved; the CLI prints `N/A` and does not invent a pull command.
- **Fit before recommend.** Gemma 4 E2B / E4B are the default local task candidates. 12B is optional when memory headroom exists. 26B (MoE, ~17 GB checkpoint, ~24 GB unified memory recommended by Antigravity's LiteRT notes) and 31B are ineligible below that headroom. This fit is a compatibility grade, not a Pudu-AI Score.
- **Endpoint is loopback only.** The written config uses `127.0.0.1:11434` (Ollama) or the already-detected LM Studio port. Non-loopback base URLs are rejected. `--no-network` still allows loopback and forbids cloud tags.
- **No installer, no SDK spawn.** This slice does not run `agy`, does not import `google.antigravity`, and does not apply `policy.allow_all()`. Printing a sample is allowed. Executing an agent that edits the repo is not.
- **Two graph producers, one edge contract.** Code graph stays Python AST + optional Graphify. Vault graph is a separate producer over markdown. Both emit nodes, edges, confidence, and evidence. A vault edge is EXTRACTED only when both notes exist and the wikilink was parsed. Missing targets are counted, not linked.
- **Export is a pure function of that JSON.** Input is the graph document. Output is a directory of markdown the user named. No network. No write into the source vault unless `--out` is that vault and `--yes` is set. Refuse to clobber a note whose content is not a previous Pudu export.
- **Tasks stay a planner.** Gemma 4 may appear in the task plan as an installed or catalog model. That plan still does not call the model. Running a task through Antigravity is a later Agent Lab phase.
- **i18n.** New user-visible strings in both catalogs. JSON keys stay English camelCase.
- **Privacy.** Vault paths, note titles, and graph files stay on disk. Nothing is uploaded. Export does not embed machine identifiers.

### Metrics composition (binding)

Three numbers must not be added together.

| Quantity | Origin | May enter |
| --- | --- | --- |
| `ollama list` shows a Gemma 4 tag | MEASURED | eligibility only |
| tag suffix `:cloud` / `-cloud` | MEASURED | blocks local eligibility |
| parameter count, context window from the tag table | ESTIMATED | compatibility grade only |
| generation t/s from llama-bench | MEASURED | Pudu-AI Score speed dimension |
| package power, thermals, swap during a bench | MEASURED or `N/A` | Pudu-AI Score, unchanged weights |
| Google's published MMLU, LiveCodeBench, Tau2, or similar | external, not measured here | neither score |
| Antigravity binary present | MEASURED | eligibility only |
| graph file count, edge count, duration | MEASURED | not a score |
| vault note count, resolved wikilink count | MEASURED | not a score |
| task pass/fail, tokens, retries | absent in this slice | Task Score stays `N/A` |
| human baseline | absent unless the user passes it | `N/A` |

Pudu Task Effort may later be DERIVED from measured graph size. It must not be recomputed from Gemma 4's advertised quality. A compatibility grade of S does not mean the task succeeded.

If a bench of the chosen Gemma 4 tag does not exist, speed is `N/A` and eligibility may use only the grade-from-fit path, labelled estimated. A weak estimate still must not pull or launch, matching the current launch gate.

## Testing Decisions

Good tests assert external behavior of pure functions: tag class, eligibility reasons, vault edges, export files. They do not spawn Ollama, Antigravity, Ink, or the network.

- Tag resolver: Gemma 4 local tags resolve; cloud tags are classified cloud; Gemma 3 tags still resolve; a catalog display name without a tag stays unresolved.
- Eligibility: Antigravity is eligible only with a local tag, grade in the allowed set, loopback endpoint, and — when a bench exists — t/s at or above the existing agent floor. Cloud tag, missing Ollama, grade F, and non-loopback URL are blocked. `--yes` is not required to *explain*; it is required to *write*.
- Vault graph: a fixture of three notes with one real wikilink and one dangling link yields one EXTRACTED edge and one unresolved count. No edge is invented. Paths outside the root are ignored.
- Export: without `--yes` the writer reports the plan and writes nothing. With `--yes` and `--out` it writes markdown and a second run does not destroy a hand-edited note.
- Prior art: launch decision tests, Ollama tag tests, and the Python graph fixture tests. New cases belong next to those, not in a TUI snapshot.

## Out of Scope

- Implementing this spec in the same change as publishing a release.
- Running an Antigravity agent, LiteRT server, or `litert-lm import`.
- `pip install`, curl-piped installers, or `ollama pull` without the existing `--yes` gate.
- Treating Antigravity as `ollama launch antigravity`.
- Folding Gemma 4 benchmark tables into Pudu-AI Score or into a Task Score.
- TypeScript / JavaScript AST graphs. That is a later code-graph backend, not this vault slice.
- LLM "related notes", embeddings, or Obsidian Smart Connections.
- Obsidian plugins, Sync, Publish, or reading `.obsidian/` secrets.
- Agent Lab phases already deferred: context packs, mini-agents, experiment runner, task score.
- Linux/Windows hardware expansion.

## Further Notes

### Why this shape

Antigravity's own local-model contract is `LocalOpenAIAgentConfig` (Ollama / LM Studio loopback) or `LiteRTAgentConfig` (on-device checkpoint). The first fits Pudu's Ollama adapter. The second is a new runtime and stays detect-only until a later spec says otherwise. Copying the OpenCode `ollama launch` path would report a command Ollama does not document for Antigravity.

Obsidian is a viewer of local markdown. Pudu should hand it a folder, not embed a second graph product. The code graph and the vault graph share an edge contract so export and metrics stay one function. They do not share a score.

### Composition risks rejected

- One "local intelligence" score that adds t/s, wikilink count, and Gemma 4's published accuracy. Those are different origins. Adding them hides a failed task behind a fast chip.
- Launching Antigravity with `policy.allow_all()` from a lab command. That is an agent with shell and edit rights, which this CLI is not.
- Indexing an Obsidian vault with the Python AST walker. Markdown is not Python. The result would be an empty graph presented as success.
- Using the task planner as proof the model did the task. A printed prompt is not a trace.

### Publish gate

This document is the spec. A feature release happens only after the tests in Testing Decisions pass, typecheck stays green, and the user asks to publish. Until then, version stays 0.2.23 and changelog stays untouched.

### Seam to confirm

The highest existing seam is the integration decision plus the graph JSON document. Antigravity hangs off the decision. Obsidian hangs off the graph document. If that split is wrong — for example if Antigravity must be a real `agy` session in slice 1 — stop and revise this spec before any code.

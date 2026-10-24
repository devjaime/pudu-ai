# Evidence snapshot

`report.json` and `report.md` are deterministic projections generated from one
bounded source-evidence collection. Regenerate them from the pinned Transformers
checkout with:

```sh
PYTHONPATH=python python3 -m pudu_agent.transformers_report /path/to/transformers --output-dir docs/demos/pycon-2026/evidence
```

The report distinguishes direct source facts from inferred candidate impact and
unresolved runtime behavior. `MODEL_ANALYSIS` and `RUNTIME_TESTS` are `NOT_RUN`;
no model inference or Transformers tests are executed by this command. Context
reduction reports metadata bytes versus the full bytes of cited source files,
not tokens or semantic equivalence.

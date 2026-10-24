# Deterministic Transformers evidence

Run from the Pudu repository root with Python 3 (standard library only):

```sh
PYTHONPATH=python python3 -m pudu_agent.transformers_evidence /path/to/transformers
```

The command accepts only the Transformers `v5.20.2` checkout at commit
`18329f1065382e54db698e242cf98bd3f3e5a766`. It prints stable JSON with source
locations for the generation definition, text-generation pipeline caller, a
bounded set of model inheritance examples, generation configuration, and test
calls. Model/test scans sort paths, inspect at most 600 Python files per tree,
and return no more than eight locations per category. No weights or additional
packages are needed.

This is candidate impact evidence, not complete runtime proof: AST scanning does
not resolve dynamic dispatch, registries, generated mappings, native extensions,
or prove which path a particular invocation takes. Test references are not
executed by the evidence command.

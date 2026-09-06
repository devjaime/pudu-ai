# Security

Report vulnerabilities privately via GitHub Security Advisories on
https://github.com/devjaime/pudu-ai/security.

Do not open public issues for undisclosed vulnerabilities.

Pudu runs local subprocesses (`ollama`, `llama-bench`, `sysctl`, `vm_stat`).
It does not upload prompts, model paths, usernames, machine identifiers, or
benchmark history. Network access is limited to the optional CanIRun catalog.

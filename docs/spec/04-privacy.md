# Privacy

Local-first. Default: no upload of prompts, model paths, usernames, machine identifiers, or benchmark history.

Network is used only for optional CanIRun catalog/compatibility (`https://canirun.ai/api/*`).

`--no-network` disables all outbound requests. Cached catalog may still be used.

Hardware detection strips serial numbers, hardware UUID, and provisioning UDID.

Estimated catalog/compatibility data comes from [CanIRun.ai](https://canirun.ai) by [midudev](https://midu.dev) ([repository](https://github.com/midudev/canirun.ai)). Pudu does not copy that project’s source. Measured data never leaves the machine.

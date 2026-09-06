export const HELP = `LocalMeter AI — local AI hardware & benchmark lab

Usage:
  npx localmeter-ai
  npx localmeter-ai hardware
  npx localmeter-ai models
  npx localmeter-ai models add-path ~/Models
  npx localmeter-ai recommend
  npx localmeter-ai benchmark [model]
  npx localmeter-ai compare
  npx localmeter-ai history
  npx localmeter-ai doctor
  npx localmeter-ai report --markdown

Flags:
  --json          Machine-readable JSON (no TUI)
  --csv           CSV output
  --no-network    Skip CanIRun API; use cache/local estimates
  --no-color      Disable ANSI color
  --verbose       Debug logs to stderr
  --preset        quick | standard | stress
`;

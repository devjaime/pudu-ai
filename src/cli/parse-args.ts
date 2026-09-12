export type CliCommand =
  | "dashboard"
  | "hardware"
  | "models"
  | "recommend"
  | "benchmark"
  | "compare"
  | "history"
  | "doctor"
  | "report"
  | "tasks"
  | "launch"
  | "setup"
  | "repo";

export type CliArgs = {
  command: CliCommand;
  positional: string[];
  json: boolean;
  csv: boolean;
  network: boolean;
  color: boolean;
  verbose: boolean;
  preset?: string;
  markdown: boolean;
  help: boolean;
  addPath?: string;
  lang?: string;
  forKinds?: string;
  scope?: string;
  priority?: string;
  yes: boolean;
  install: boolean;
  link?: string;
  structural?: string;
  repo?: string;
  intent?: string;
  limit?: number;
  globs: string[];
};

const VALUE_FLAGS = new Set([
  "--preset",
  "--lang",
  "--locale",
  "--for",
  "--scope",
  "--priority",
  "--link",
  "--structural",
  "--repo",
  "--intent",
  "--limit",
  "--glob",
]);

function flagValue(args: string[], name: string): string | undefined {
  const index = args.findIndex((a) => a === name);
  if (index < 0) return undefined;
  const value = args[index + 1];
  if (!value || value.startsWith("-")) return undefined;
  return value;
}

function flagValues(args: string[], name: string): string[] {
  const values: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === name) {
      const value = args[i + 1];
      if (value && !value.startsWith("-")) values.push(value);
    }
  }
  return values;
}

export function parseArgs(argv: string[]): CliArgs {
  const args = argv.slice(2);
  const flags = new Set(args.filter((a) => a.startsWith("-")));
  const consumed = new Set<number>();
  for (let i = 0; i < args.length; i++) {
    const current = args[i];
    if (current && VALUE_FLAGS.has(current) && args[i + 1] && !args[i + 1]!.startsWith("-")) {
      consumed.add(i + 1);
    }
  }
  const rest = args.filter((a, i) => !a.startsWith("-") && !consumed.has(i));
  const command = (rest[0] as CliCommand | undefined) ?? "dashboard";
  const known: CliCommand[] = [
    "dashboard",
    "hardware",
    "models",
    "recommend",
    "benchmark",
    "compare",
    "history",
    "doctor",
    "report",
    "tasks",
    "launch",
    "setup",
    "repo",
  ];
  const isKnown = known.includes(command);
  let addPath: string | undefined;
  if (command === "models" && rest[1] === "add-path") addPath = rest[2];

  const limitRaw = flagValue(args, "--limit");
  const limit = limitRaw && /^\d+$/.test(limitRaw) ? Number(limitRaw) : undefined;

  return {
    command: isKnown ? command : "dashboard",
    positional: isKnown ? rest.slice(1) : rest,
    json: flags.has("--json"),
    csv: flags.has("--csv"),
    network: !flags.has("--no-network"),
    color: !flags.has("--no-color"),
    verbose: flags.has("--verbose"),
    preset: flagValue(args, "--preset"),
    markdown: flags.has("--markdown"),
    help: flags.has("-h") || flags.has("--help"),
    addPath,
    lang: flagValue(args, "--lang") ?? flagValue(args, "--locale"),
    forKinds: flagValue(args, "--for"),
    scope: flagValue(args, "--scope"),
    priority: flagValue(args, "--priority"),
    yes: flags.has("--yes"),
    install: flags.has("--install"),
    link: flagValue(args, "--link"),
    structural: flagValue(args, "--structural"),
    repo: flagValue(args, "--repo"),
    intent: flagValue(args, "--intent"),
    limit,
    globs: flagValues(args, "--glob"),
  };
}

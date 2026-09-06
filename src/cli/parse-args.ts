export type CliCommand =
  | "dashboard"
  | "hardware"
  | "models"
  | "recommend"
  | "benchmark"
  | "compare"
  | "history"
  | "doctor"
  | "report";

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
};

export function parseArgs(argv: string[]): CliArgs {
  const args = argv.slice(2);
  const flags = new Set(args.filter((a) => a.startsWith("-")));
  const rest = args.filter((a) => !a.startsWith("-"));
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
  ];
  const isKnown = known.includes(command);
  let addPath: string | undefined;
  if (command === "models" && rest[1] === "add-path") addPath = rest[2];

  const presetIndex = args.findIndex((a) => a === "--preset");
  const preset = presetIndex >= 0 ? args[presetIndex + 1] : undefined;
  const langIndex = args.findIndex((a) => a === "--lang" || a === "--locale");
  const lang = langIndex >= 0 ? args[langIndex + 1] : undefined;

  return {
    command: isKnown ? command : "dashboard",
    positional: isKnown ? rest.slice(1) : rest,
    json: flags.has("--json"),
    csv: flags.has("--csv"),
    network: !flags.has("--no-network"),
    color: !flags.has("--no-color"),
    verbose: flags.has("--verbose"),
    preset,
    markdown: flags.has("--markdown"),
    help: flags.has("-h") || flags.has("--help"),
    addPath,
    lang,
  };
}

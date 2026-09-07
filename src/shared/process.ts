import { execa, type Options, type ResultPromise } from "execa";

const children = new Set<ResultPromise>();
let installed = false;

function installSignalHandlers(): void {
  if (installed) return;
  installed = true;
  const stop = (): void => {
    void killAll("SIGTERM");
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
}

export function spawnTracked(file: string, args: string[] = [], options: Options = {}): ResultPromise {
  installSignalHandlers();
  const subprocess = execa(file, args, {
    reject: false,
    timeout: options.timeout === undefined ? 30_000 : options.timeout === 0 ? undefined : options.timeout,
    ...options,
  });
  children.add(subprocess);
  void subprocess.finally(() => {
    children.delete(subprocess);
  });
  return subprocess;
}

export function toText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Uint8Array) return Buffer.from(value).toString("utf8");
  if (Array.isArray(value)) return value.map(String).join("\n");
  if (value == null) return "";
  return String(value);
}

export async function runCommand(
  file: string,
  args: string[] = [],
  options: Options = {},
): Promise<{ stdout: string; stderr: string; exitCode: number | undefined; timedOut: boolean }> {
  const result = await spawnTracked(file, args, options);
  return {
    stdout: toText(result.stdout),
    stderr: toText(result.stderr),
    exitCode: result.exitCode,
    timedOut: Boolean(result.timedOut),
  };
}

export async function killAll(signal: NodeJS.Signals = "SIGTERM"): Promise<void> {
  for (const child of [...children]) {
    child.kill(signal);
  }
}

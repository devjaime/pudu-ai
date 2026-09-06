export type LogLevel = "silent" | "info" | "verbose";

let level: LogLevel = "info";

export function setLogLevel(next: LogLevel): void {
  level = next;
}

export function verbose(message: string): void {
  if (level === "verbose") {
    process.stderr.write(`[pudu] ${message}\n`);
  }
}

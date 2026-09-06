import { access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

export async function commandExists(name: string): Promise<string | undefined> {
  if (name.includes("/") || name.includes("\\")) {
    try {
      await access(name, constants.X_OK);
      return name;
    } catch {
      return undefined;
    }
  }
  const pathEnv = process.env.PATH ?? "";
  const parts = pathEnv.split(path.delimiter);
  for (const dir of parts) {
    const candidate = path.join(dir, name);
    try {
      await access(candidate, constants.X_OK);
      return candidate;
    } catch {
      continue;
    }
  }
  return undefined;
}

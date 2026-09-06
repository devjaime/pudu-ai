#!/usr/bin/env node
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { access } from "node:fs/promises";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const distEntry = path.join(root, "dist", "cli", "index.js");
const srcEntry = path.join(root, "src", "cli", "index.ts");
const tsxCli = path.join(root, "node_modules", "tsx", "dist", "cli.mjs");

async function main() {
  let argv = [distEntry, ...process.argv.slice(2)];
  try {
    await access(distEntry);
  } catch {
    argv = [tsxCli, srcEntry, ...process.argv.slice(2)];
  }
  const child = spawn(process.execPath, argv, {
    stdio: "inherit",
    cwd: root,
    env: process.env,
  });
  child.on("exit", (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 1);
  });
}

void main();

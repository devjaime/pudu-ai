#!/usr/bin/env node
import { parseArgs } from "./parse-args.js";
import { run } from "./run.js";

const args = parseArgs(process.argv);
run(args)
  .then((code) => {
    process.exit(code);
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exit(1);
  });

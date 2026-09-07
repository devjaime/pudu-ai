import { readFileSync, writeFileSync } from "node:fs";

const path = "dist/cli/index.js";
const source = readFileSync(path, "utf8").replace(/^#!.*\r?\n/gm, "");
writeFileSync(path, `#!/usr/bin/env node\n${source}`);

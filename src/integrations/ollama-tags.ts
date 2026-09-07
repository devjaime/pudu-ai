const RULES: Array<{ test: RegExp; tag: string }> = [
  { test: /qwen\s*3\.5\s*[-:]?\s*8b/i, tag: "qwen3.5:8b" },
  { test: /qwen\s*3\.5\s*[-:]?\s*4b/i, tag: "qwen3.5:4b" },
  { test: /qwen\s*3\s*[-:]?\s*14b/i, tag: "qwen3:14b" },
  { test: /qwen\s*3\s*[-:]?\s*8b/i, tag: "qwen3:8b" },
  { test: /qwen\s*3\s*[-:]?\s*4b/i, tag: "qwen3:4b" },
  { test: /qwen\s*2\.5\s*[-:]?\s*coder\s*[-:]?\s*7b/i, tag: "qwen2.5-coder:7b" },
  { test: /gemma\s*3\s*[-:]?\s*12b/i, tag: "gemma3:12b" },
  { test: /gemma\s*3\s*[-:]?\s*4b/i, tag: "gemma3:4b" },
  { test: /gemma\s*3\s*[-:]?\s*1b/i, tag: "gemma3:1b" },
  { test: /llama\s*3\.2\s*[-:]?\s*3b/i, tag: "llama3.2:3b" },
  { test: /llama\s*3\.2\s*[-:]?\s*1b/i, tag: "llama3.2:1b" },
  { test: /llama\s*3\.1\s*[-:]?\s*8b/i, tag: "llama3.1:8b" },
  { test: /deepseek[- ]r1\s*[-:]?\s*8b|deepseek-r1-distill.*8b/i, tag: "deepseek-r1:8b" },
  { test: /deepseek[- ]r1\s*[-:]?\s*7b/i, tag: "deepseek-r1:7b" },
  { test: /mistral\s*[-:]?\s*7b|mistral-nemo/i, tag: "mistral:7b" },
  { test: /phi\s*4|phi-4/i, tag: "phi4" },
];

export function resolveOllamaTag(...parts: Array<string | undefined>): string | undefined {
  const haystack = parts.filter(Boolean).join(" ");
  if (!haystack.trim()) return undefined;
  if (/^[a-z0-9._-]+:[a-z0-9._-]+$/i.test(haystack.trim())) return haystack.trim();
  for (const rule of RULES) {
    if (rule.test.test(haystack)) return rule.tag;
  }
  return undefined;
}

export function toOllamaTag(id: string): string {
  return resolveOllamaTag(id) ?? id;
}

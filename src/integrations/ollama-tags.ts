const RULES: Array<{ test: RegExp; tag: string }> = [
  { test: /qwen3\.5[-:]?4b/i, tag: "qwen3.5:4b" },
  { test: /qwen3\.5[-:]?8b/i, tag: "qwen3.5:8b" },
  { test: /qwen3[-:]?14b/i, tag: "qwen3:14b" },
  { test: /qwen3[-:]?8b/i, tag: "qwen3:8b" },
  { test: /qwen3[-:]?4b/i, tag: "qwen3:4b" },
  { test: /qwen2\.5[-:]?coder[-:]?7b/i, tag: "qwen2.5-coder:7b" },
  { test: /gemma3[-:]?12b/i, tag: "gemma3:12b" },
  { test: /gemma3[-:]?4b/i, tag: "gemma3:4b" },
  { test: /gemma3[-:]?1b/i, tag: "gemma3:1b" },
  { test: /llama3\.2[-:]?3b/i, tag: "llama3.2:3b" },
  { test: /llama3\.2[-:]?1b/i, tag: "llama3.2:1b" },
  { test: /llama3\.1[-:]?8b/i, tag: "llama3.1:8b" },
  { test: /deepseek-r1[-:]?8b|deepseek-r1-distill.*8b/i, tag: "deepseek-r1:8b" },
  { test: /deepseek-r1[-:]?7b/i, tag: "deepseek-r1:7b" },
  { test: /mistral[-:]?7b|mistral-nemo/i, tag: "mistral:7b" },
  { test: /phi4|phi-4/i, tag: "phi4" },
  { test: /ministral[-:]?8b/i, tag: "mistral:7b" },
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

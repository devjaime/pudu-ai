export const GEMMA4_LOCAL_TAGS = ["gemma4:e2b", "gemma4:e4b", "gemma4:12b", "gemma4:26b", "gemma4:31b"] as const;

export type TagClass = "local" | "cloud" | "unknown";

const RULES: Array<{ test: RegExp; tag: string }> = [
  { test: /gemma\s*4\s*[-:]?\s*e2b/i, tag: "gemma4:e2b" },
  { test: /gemma\s*4\s*[-:]?\s*e4b/i, tag: "gemma4:e4b" },
  { test: /gemma\s*4\s*[-:]?\s*31b/i, tag: "gemma4:31b" },
  { test: /gemma\s*4\s*[-:]?\s*26b/i, tag: "gemma4:26b" },
  { test: /gemma\s*4\s*[-:]?\s*12b/i, tag: "gemma4:12b" },
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

const KNOWN_LOCAL = new Set<string>([...GEMMA4_LOCAL_TAGS, ...RULES.map((rule) => rule.tag)]);

export function isCloudTag(raw: string): boolean {
  const value = raw.trim().toLowerCase();
  if (!value) return false;
  if (value.endsWith("-cloud") || value.endsWith(":cloud")) return true;
  return /\bcloud\b/.test(value);
}

export function canonicalLocalTag(raw: string): string | undefined {
  const trimmed = raw.trim();
  if (!trimmed || isCloudTag(trimmed)) return undefined;
  const lower = trimmed.toLowerCase();
  const stripped = lower.replace(/-mlx$/, "");
  if (KNOWN_LOCAL.has(stripped)) return lower.endsWith("-mlx") ? `${stripped}-mlx` : stripped;
  if (/^[a-z0-9._-]+:[a-z0-9._-]+$/i.test(trimmed) && KNOWN_LOCAL.has(lower)) return lower;
  for (const rule of RULES) {
    if (rule.test.test(trimmed)) return rule.tag;
  }
  return undefined;
}

export function classifyOllamaTag(raw: string): TagClass {
  const trimmed = raw.trim();
  if (!trimmed) return "unknown";
  if (isCloudTag(trimmed)) return "cloud";
  return canonicalLocalTag(trimmed) ? "local" : "unknown";
}

export function resolveOllamaTag(...parts: Array<string | undefined>): string | undefined {
  const haystack = parts.filter(Boolean).join(" ");
  if (!haystack.trim()) return undefined;
  if (isCloudTag(haystack)) return undefined;
  const known = canonicalLocalTag(haystack);
  if (known) return known;
  if (/^[a-z0-9._-]+:[a-z0-9._-]+$/i.test(haystack.trim())) return haystack.trim();
  for (const rule of RULES) {
    if (rule.test.test(haystack)) return rule.tag;
  }
  return undefined;
}

export function toOllamaTag(id: string): string {
  return resolveOllamaTag(id) ?? id;
}

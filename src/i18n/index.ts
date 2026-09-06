import { en, type MessageId } from "./en.js";
import { es } from "./es.js";

const locales = { en, es } as const;
export type Locale = keyof typeof locales;

let current: Locale = "en";

export function resolveLocale(raw?: string): Locale {
  const value = (raw ?? process.env.PUDU_AI_LANG ?? process.env.PUDU_LANG ?? process.env.LANG ?? "en").toLowerCase();
  if (value.startsWith("es")) return "es";
  return "en";
}

export function setLocale(locale: Locale): void {
  current = locale in locales ? locale : "en";
}

export function getLocale(): Locale {
  return current;
}

export function t(id: MessageId, vars?: Record<string, string | number>): string {
  const table = locales[current] ?? locales.en;
  let text: string = table[id] ?? locales.en[id];
  if (vars) {
    for (const [key, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${key}}`, String(value));
    }
  }
  return text;
}

export { en, es };
export type { MessageId };

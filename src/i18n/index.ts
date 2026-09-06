import { en, type MessageId } from "./en.js";

const locales = { en } as const;
export type Locale = keyof typeof locales;

let current: Locale = "en";

export function setLocale(locale: Locale): void {
  current = locale in locales ? locale : "en";
}

export function t(id: MessageId, vars?: Record<string, string | number>): string {
  let text: string = locales[current][id] ?? locales.en[id];
  if (vars) {
    for (const [key, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${key}}`, String(value));
    }
  }
  return text;
}

export { en };
export type { MessageId };

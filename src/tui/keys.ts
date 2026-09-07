export type Screen =
  | "home"
  | "models"
  | "hardware"
  | "recommend"
  | "compare"
  | "benchmark"
  | "history"
  | "tasks"
  | "setup";

export type AppKeyResult =
  | { type: "ignore" }
  | { type: "quit" }
  | { type: "home" }
  | { type: "screen"; screen: Screen };

function globalNav(letter: string): AppKeyResult | undefined {
  if (letter === "b") return { type: "screen", screen: "benchmark" };
  if (letter === "m") return { type: "screen", screen: "models" };
  if (letter === "r") return { type: "screen", screen: "recommend" };
  if (letter === "h") return { type: "screen", screen: "hardware" };
  if (letter === "c") return { type: "screen", screen: "compare" };
  if (letter === "l") return { type: "screen", screen: "history" };
  if (letter === "t") return { type: "screen", screen: "tasks" };
  if (letter === "s") return { type: "screen", screen: "setup" };
  return undefined;
}

export function handleAppKey(
  screen: Screen,
  input: string,
  key: { escape?: boolean; return?: boolean },
): AppKeyResult {
  const letter = input.toLowerCase();
  if (screen === "benchmark") return { type: "ignore" };
  if (letter === "q") return { type: "quit" };
  if (key.escape) return screen === "home" ? { type: "quit" } : { type: "home" };

  if (screen === "setup") {
    if ("i123456".includes(letter)) return { type: "ignore" };
  }

  const nav = globalNav(letter);
  if (nav) return nav;
  if (letter === "i" && screen === "home") return { type: "screen", screen: "setup" };
  if (key.return && screen === "home") return { type: "screen", screen: "benchmark" };
  return { type: "ignore" };
}

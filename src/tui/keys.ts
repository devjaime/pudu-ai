export type Screen =
  | "home"
  | "models"
  | "hardware"
  | "recommend"
  | "compare"
  | "benchmark"
  | "history"
  | "tasks";

export type AppKeyResult =
  | { type: "ignore" }
  | { type: "quit" }
  | { type: "home" }
  | { type: "screen"; screen: Screen };

export function handleAppKey(
  screen: Screen,
  input: string,
  key: { escape?: boolean; return?: boolean },
): AppKeyResult {
  const letter = input.toLowerCase();
  if (screen === "benchmark") return { type: "ignore" };
  if (screen === "recommend" || screen === "tasks") {
    if (letter === "q") return { type: "quit" };
    if (key.escape) return { type: "home" };
    return { type: "ignore" };
  }
  if (letter === "q" || key.escape) return { type: "quit" };
  if (letter === "b") return { type: "screen", screen: "benchmark" };
  if (letter === "m") return { type: "screen", screen: "models" };
  if (letter === "r") return { type: "screen", screen: "recommend" };
  if (letter === "h") return { type: "screen", screen: "hardware" };
  if (letter === "c") return { type: "screen", screen: "compare" };
  if (letter === "l") return { type: "screen", screen: "history" };
  if (letter === "t") return { type: "screen", screen: "tasks" };
  if (key.return && screen === "home") return { type: "screen", screen: "benchmark" };
  return { type: "ignore" };
}

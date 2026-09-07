import { useStdout } from "ink";

export function useCols(): number {
  const { stdout } = useStdout();
  const cols = stdout?.columns ?? 80;
  return Math.max(40, Math.min(cols - 2, 100));
}

export function fit(text: string, width: number): string {
  if (text.length <= width) return text;
  if (width <= 1) return "…";
  return `${text.slice(0, width - 1)}…`;
}

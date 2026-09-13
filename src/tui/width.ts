import { useStdout } from "ink";
import { fit } from "./fit.js";

export { fit };

export function useCols(): number {
  const { stdout } = useStdout();
  const cols = stdout?.columns ?? 80;
  return Math.max(40, Math.min(cols - 2, 100));
}

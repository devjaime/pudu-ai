import { commandExists } from "../../shared/which.js";
import type { ModelRuntime } from "../../runtimes/types.js";

export const mlxAdapter: ModelRuntime = {
  id: "mlx",
  label: "MLX",
  async detect() {
    return Boolean(await commandExists("mlx_lm"));
  },
  async version() {
    return undefined;
  },
  async listModels() {
    return [];
  },
  async resolveModel() {
    return undefined;
  },
  async benchmarkCapabilities() {
    return ["none"];
  },
};

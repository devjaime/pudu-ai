import { detectHardware } from "../hardware/detect.js";
import type { HardwareProfile } from "../hardware/types.js";
import { discoverLocalModels } from "../models/discovery.js";
import type { LocalModel } from "../models/types.js";
import { detectRuntimes } from "../runtimes/registry.js";
import type { RuntimeStatus } from "../runtimes/types.js";
import {
  compatibilityFor,
  loadCatalog,
  matchCatalog,
  recommendForMachine,
} from "../compatibility/service.js";
import type { CatalogModel, CompatibilityResult, Recommendation } from "../compatibility/types.js";
import { listBenchmarks, type BenchmarkRecord } from "../storage/benchmarks.js";
import { commandExists } from "../shared/which.js";
import { detectAgents, type AgentStatus } from "../integrations/agents.js";

export type ModelRow = {
  local: LocalModel;
  catalog?: CatalogModel;
  compatibility?: CompatibilityResult;
  lastBenchmark?: BenchmarkRecord;
};

export type Session = {
  hardware: HardwareProfile;
  runtimes: RuntimeStatus[];
  models: LocalModel[];
  catalog: CatalogModel[];
  rows: ModelRow[];
  recommendations: Recommendation[];
  history: BenchmarkRecord[];
  llamaBench: boolean;
  networkUsed: boolean;
  agents: AgentStatus[];
};

export async function loadSession(options: { network: boolean }): Promise<Session> {
  const hardware = await detectHardware();
  const [runtimes, models, catalogState, history, llamaBench, agents] = await Promise.all([
    detectRuntimes(),
    discoverLocalModels(),
    loadCatalog(options.network),
    listBenchmarks(),
    commandExists("llama-bench").then(Boolean),
    detectAgents(),
  ]);

  const rows: ModelRow[] = [];
  for (const local of models) {
    const catalog = matchCatalog(catalogState.catalog, local);
    const compatibility = catalog
      ? await compatibilityFor(hardware, catalog, options.network)
      : undefined;
    const lastBenchmark = [...history].reverse().find((b) => b.model.id === local.id);
    rows.push({ local, catalog, compatibility, lastBenchmark });
  }

  const recommendations = await recommendForMachine(hardware, catalogState.catalog, options.network);

  return {
    hardware,
    runtimes,
    models,
    catalog: catalogState.catalog,
    rows,
    recommendations,
    history,
    llamaBench,
    networkUsed: catalogState.networkUsed,
    agents,
  };
}

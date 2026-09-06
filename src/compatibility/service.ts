import { fetchCatalog, fetchCompatibility, fetchRecommendations } from "../adapters/canirun/index.js";
import type { HardwareProfile } from "../hardware/types.js";
import { idsLikelyMatch, normalizeModelId } from "../models/match.js";
import type { LocalModel } from "../models/types.js";
import { loadCatalogCache, saveCatalogCache } from "../storage/cache.js";
import { t } from "../i18n/index.js";
import { localCompatibility } from "./local.js";
import type { CatalogModel, CompatibilityResult, Recommendation } from "./types.js";

export type CompatibilityService = {
  catalog: CatalogModel[];
  networkUsed: boolean;
};

const FALLBACK_CATALOG: CatalogModel[] = [
  { id: "gemma3-4b", name: "Gemma 3 4B", provider: "Google", paramsBillions: 4, useCase: ["chat"] },
  { id: "qwen3-8b", name: "Qwen 3 8B", provider: "Alibaba", paramsBillions: 8, useCase: ["code", "chat", "reasoning"] },
  { id: "qwen3-4b", name: "Qwen 3 4B", provider: "Alibaba", paramsBillions: 4, useCase: ["chat"] },
  { id: "qwen3.5-4b", name: "Qwen 3.5 4B", provider: "Alibaba", paramsBillions: 4, useCase: ["chat"] },
  { id: "deepseek-r1-8b", name: "DeepSeek R1 8B", provider: "DeepSeek", paramsBillions: 8, useCase: ["reasoning"] },
  { id: "qwen3-14b", name: "Qwen 3 14B", provider: "Alibaba", paramsBillions: 14, useCase: ["chat", "reasoning"] },
  { id: "llama3.1-8b", name: "Llama 3.1 8B", provider: "Meta", paramsBillions: 8, useCase: ["chat", "code"] },
];

export async function loadCatalog(network: boolean): Promise<CompatibilityService> {
  if (network) {
    try {
      const models = await fetchCatalog();
      await saveCatalogCache(models);
      return { catalog: models, networkUsed: true };
    } catch {
      const cached = await loadCatalogCache();
      if (cached?.length) return { catalog: cached, networkUsed: false };
    }
  }
  const cached = await loadCatalogCache();
  return { catalog: cached?.length ? cached : FALLBACK_CATALOG, networkUsed: false };
}

export function matchCatalog(catalog: CatalogModel[], local: LocalModel): CatalogModel | undefined {
  return catalog.find((model) => idsLikelyMatch(model.id, local.id) || idsLikelyMatch(model.name, local.name));
}

export async function compatibilityFor(
  hardware: HardwareProfile,
  catalogModel: CatalogModel,
  network: boolean,
): Promise<CompatibilityResult> {
  if (network) {
    try {
      return await fetchCompatibility(hardware, catalogModel.id);
    } catch {
      return localCompatibility(hardware, catalogModel);
    }
  }
  return localCompatibility(hardware, catalogModel);
}

export async function recommendForMachine(
  hardware: HardwareProfile,
  catalog: CatalogModel[],
  network: boolean,
): Promise<Recommendation[]> {
  const useCases = ["code", "chat", "reasoning", "edge"];
  if (network) {
    try {
      const rows: Recommendation[] = [];
      for (const useCase of useCases) {
        const found = await fetchRecommendations(hardware, useCase, 1);
        rows.push(...found.map((item) => ({ ...item, useCase: labelUseCase(useCase) })));
      }
      if (rows.length) return rows;
    } catch {
      // fall through
    }
  }
  const ranked = catalog
    .map((model) => ({ model, result: localCompatibility(hardware, model) }))
    .filter((row) => row.result.grade !== "F")
    .sort((a, b) => a.result.grade.localeCompare(b.result.grade));

  const picks: Recommendation[] = [];
  const used = new Set<string>();
  for (const useCase of useCases) {
    const hit = ranked.find((row) => {
      if (used.has(row.model.id)) return false;
      if (useCase === "chat") return row.model.useCase?.includes("chat") ?? true;
      return row.model.useCase?.some((u) => u.includes(useCase)) ?? false;
    });
    if (!hit) continue;
    used.add(hit.model.id);
    picks.push({
      useCase: labelUseCase(useCase),
      model: hit.model,
      grade: hit.result.grade,
      estimatedTokensPerSecond: hit.result.estimatedTokensPerSecond,
    });
  }
  return picks;
}

function labelUseCase(useCase: string): string {
  if (useCase === "code") return t("useCaseCoding");
  if (useCase === "reasoning") return t("useCaseReasoning");
  if (useCase === "edge") return t("useCaseLightweight");
  return t("useCaseGeneral");
}

export function catalogIdFromLocal(id: string): string {
  return normalizeModelId(id);
}

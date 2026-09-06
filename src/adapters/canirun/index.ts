import { bytesToGiB } from "../../shared/bytes.js";
import type { HardwareProfile } from "../../hardware/types.js";
import type { CatalogModel, CompatibilityResult, Recommendation } from "../../compatibility/types.js";
import {
  catalogResponseSchema,
  compatibilityResponseSchema,
  recommendResponseSchema,
} from "./schema.js";

const BASE = "https://canirun.ai";

function hardwarePayload(hardware: HardwareProfile) {
  return {
    cpu: {
      name: hardware.cpu.name,
      cores: hardware.cpu.physicalCores,
      threads: hardware.cpu.logicalCores,
    },
    ramGb: Number(bytesToGiB(hardware.memory.totalBytes).toFixed(1)),
    gpu: hardware.gpu.name ? { name: hardware.gpu.name } : undefined,
  };
}

async function postJson(path: string, body: unknown, timeoutMs: number): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`CanIRun ${path} ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function getJson(path: string, timeoutMs: number): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${BASE}${path}`, {
      headers: { accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`CanIRun ${path} ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchCatalog(): Promise<CatalogModel[]> {
  const json = await getJson("/api/models", 15000);
  const parsed = catalogResponseSchema.parse(json);
  return parsed.models;
}

export async function fetchCompatibility(
  hardware: HardwareProfile,
  modelId: string,
): Promise<CompatibilityResult> {
  const json = await postJson(
    "/api/compatibility",
    { hardware: hardwarePayload(hardware), modelId },
    15000,
  );
  const parsed = compatibilityResponseSchema.parse(json);
  return {
    modelId: parsed.modelId ?? modelId,
    source: "estimated",
    grade: parsed.grade,
    status: parsed.status,
    recommendedQuantization: parsed.recommendedQuantization ?? parsed.quantization,
    estimatedTokensPerSecond: parsed.estimated?.tokensPerSecond,
    estimatedRamGb: parsed.estimated?.ramRequiredGb ?? parsed.estimated?.vramRequiredGb,
    notes: parsed.notes,
  };
}

export async function fetchRecommendations(
  hardware: HardwareProfile,
  useCase?: string,
  limit = 5,
): Promise<Recommendation[]> {
  const json = await postJson(
    "/api/recommend",
    { hardware: hardwarePayload(hardware), useCase, limit },
    15000,
  );
  const parsed = recommendResponseSchema.parse(json);
  const items = parsed.recommendations ?? [];
  return items.map((item) => ({
    useCase: useCase ?? "general",
    model: {
      id: String(item.modelId ?? item.id ?? "unknown"),
      name: String(item.name ?? item.modelId ?? item.id ?? "unknown"),
    },
    grade: item.grade ?? "C",
    quantization: item.quantization,
    estimatedTokensPerSecond: item.estimated?.tokensPerSecond,
  }));
}

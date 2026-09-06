import { readFile, writeFile } from "node:fs/promises";
import { canirunCachePath, ensureStorage } from "./paths.js";
import type { CatalogModel } from "../compatibility/types.js";

type CatalogCache = {
  savedAt: string;
  models: CatalogModel[];
};

export async function saveCatalogCache(models: CatalogModel[]): Promise<void> {
  await ensureStorage();
  const payload: CatalogCache = { savedAt: new Date().toISOString(), models };
  await writeFile(canirunCachePath(), `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

export async function loadCatalogCache(): Promise<CatalogModel[] | undefined> {
  try {
    const raw = await readFile(canirunCachePath(), "utf8");
    const parsed = JSON.parse(raw) as CatalogCache;
    return parsed.models;
  } catch {
    return undefined;
  }
}

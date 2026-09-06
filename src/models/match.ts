export function normalizeModelId(id: string): string {
  return id
    .toLowerCase()
    .replace(/[:/]/g, "-")
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function idsLikelyMatch(a: string, b: string): boolean {
  const na = normalizeModelId(a);
  const nb = normalizeModelId(b);
  return na === nb || na.includes(nb) || nb.includes(na);
}

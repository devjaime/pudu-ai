import { z } from "zod";
import type { SearchResult } from "./types.js";

export const metricOriginSchema = z.enum(["MEASURED", "ESTIMATED", "DERIVED"]);

export const searchIntentSchema = z.enum([
  "TEXT",
  "STRUCTURAL",
  "RELATIONSHIP",
  "IMPACT",
  "SEMANTIC",
  "UNKNOWN",
]);

export const toolAvailabilitySchema = z.object({
  available: z.boolean(),
  path: z.string().nullable(),
  version: z.string().nullable(),
});

export const searchMatchSchema = z.object({
  file: z.string(),
  line: z.number().nullable(),
  column: z.number().nullable(),
  endLine: z.number().nullable(),
  endColumn: z.number().nullable(),
  text: z.string(),
  strategy: z.enum(["rg", "ast-grep"]),
  language: z.string().nullable(),
  metavariables: z.record(z.string()),
});

export const searchResultSchema = z.object({
  schemaVersion: z.literal(1),
  ok: z.boolean(),
  op: z.literal("search"),
  repo: z.string(),
  query: z.string().nullable(),
  structuralPattern: z.string().nullable(),
  intent: searchIntentSchema,
  strategy: z.enum(["rg", "ast-grep", "graph", "hybrid"]),
  matches: z.array(searchMatchSchema),
  tools: z.object({
    rg: toolAvailabilitySchema,
    astGrep: toolAvailabilitySchema,
    graph: toolAvailabilitySchema,
  }),
  errors: z.array(
    z.object({
      tool: z.string(),
      message: z.string(),
      origin: metricOriginSchema,
    }),
  ),
  metrics: z.object({
    durationMs: z.number(),
    matchCount: z.number(),
    rgQueries: z.number(),
    astQueries: z.number(),
    graphQueries: z.number(),
    origin: metricOriginSchema,
  }),
  unavailable: z.array(z.string()),
});

export function parseSearchResult(value: unknown): SearchResult {
  return searchResultSchema.parse(value);
}

import { z } from "zod";

export const catalogModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.string().optional(),
  family: z.string().optional(),
  params: z.string().optional(),
  paramsBillions: z.number().optional(),
  architecture: z.string().optional(),
  useCase: z.array(z.string()).optional(),
  url: z.string().optional(),
});

export const catalogResponseSchema = z.object({
  count: z.number().optional(),
  models: z.array(catalogModelSchema),
});

export const compatibilityResponseSchema = z.object({
  compatible: z.boolean().optional(),
  status: z.string().optional(),
  grade: z.enum(["S", "A", "B", "C", "D", "F"]),
  score: z.number().optional(),
  modelId: z.string().optional(),
  quantization: z.string().optional(),
  recommendedQuantization: z.string().optional(),
  estimated: z
    .object({
      tokensPerSecond: z.number().optional(),
      modelSizeGb: z.number().optional(),
      vramRequiredGb: z.number().optional(),
      ramRequiredGb: z.number().optional(),
      memoryHeadroomGb: z.number().optional(),
    })
    .optional(),
  notes: z.array(z.string()).optional(),
});

export const recommendItemSchema = z.object({
  modelId: z.string().optional(),
  id: z.string().optional(),
  name: z.string().optional(),
  grade: z.enum(["S", "A", "B", "C", "D", "F"]).optional(),
  quantization: z.string().optional(),
  useCase: z.array(z.string()).optional(),
  estimated: z
    .object({
      tokensPerSecond: z.number().optional(),
    })
    .optional(),
}).passthrough();

export const recommendResponseSchema = z.object({
  recommendations: z.array(recommendItemSchema).optional(),
}).passthrough();

export type CanIRunCatalogModel = z.infer<typeof catalogModelSchema>;

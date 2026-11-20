import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(100),
});

export const createProductSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional(),
  priceCents: z.number().int().positive().max(100_000_000),
  stock: z.number().int().min(0).max(1_000_000),
  categoryId: z.number().int().positive(),
});

export const listProductsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
    q: z.string().trim().min(1).max(100).optional(),
    categoryId: z.coerce.number().int().positive().optional(),
    minPriceCents: z.coerce.number().int().min(0).optional(),
    maxPriceCents: z.coerce.number().int().min(0).optional(),
    sort: z.enum(["newest", "price_asc", "price_desc"]).default("newest"),
  })
  .refine(
    (v) =>
      v.minPriceCents === undefined ||
      v.maxPriceCents === undefined ||
      v.minPriceCents <= v.maxPriceCents,
    { message: "minPriceCents must be <= maxPriceCents", path: ["minPriceCents"] },
  );

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
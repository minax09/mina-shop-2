import type { Request, Response } from "express";
import { z } from "zod";
import { parseOrThrow } from "../../lib/validate.js";
import { listProductsQuerySchema } from "./products.schemas.js";
import { getProduct, listProducts } from "./products.service.js";

const idParamSchema = z.object({
  id: z.coerce.number().int().positive().max(2_147_483_647),
});

export async function list(req: Request, res: Response) {
  const query = parseOrThrow(listProductsQuerySchema, req.query);
  res.json(await listProducts(query));
}

export async function getOne(req: Request, res: Response) {
  const { id } = parseOrThrow(idParamSchema, req.params);
  res.json({ product: await getProduct(id) });
}
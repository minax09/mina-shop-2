import { Prisma } from "../../generated/prisma/client.js";
import { AppError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import type { ListProductsQuery } from "./products.schemas.js";

const productSelect = {
  id: true,
  name: true,
  description: true,
  priceCents: true,
  stock: true,
  createdAt: true,
  category: { select: { id: true, name: true } },
} satisfies Prisma.ProductSelect;

const orderByMap: Record<
  ListProductsQuery["sort"],
  Prisma.ProductOrderByWithRelationInput[]
> = {
  newest: [{ createdAt: "desc" }, { id: "desc" }],
  price_asc: [{ priceCents: "asc" }, { id: "asc" }],
  price_desc: [{ priceCents: "desc" }, { id: "desc" }],
};

export async function listProducts(query: ListProductsQuery) {
  const where: Prisma.ProductWhereInput = { isActive: true };

  if (query.q) {
    where.name = { contains: query.q, mode: "insensitive" };
  }
  if (query.categoryId !== undefined) {
    where.categoryId = query.categoryId;
  }
  if (query.minPriceCents !== undefined || query.maxPriceCents !== undefined) {
    where.priceCents = {
      ...(query.minPriceCents !== undefined && { gte: query.minPriceCents }),
      ...(query.maxPriceCents !== undefined && { lte: query.maxPriceCents }),
    };
  }

  const [items, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      select: productSelect,
      orderBy: orderByMap[query.sort],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function getProduct(id: number) {
  const product = await prisma.product.findFirst({
    where: { id, isActive: true },
    select: productSelect,
  });

  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }

  return product;
}
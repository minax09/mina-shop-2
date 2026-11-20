import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { resetDatabase } from "./helpers.js";

async function seed() {
  const books = await prisma.category.create({ data: { name: "Books" } });
  const toys = await prisma.category.create({ data: { name: "Toys" } });

  await prisma.product.createMany({
    data: [
      { name: "Blue Notebook", priceCents: 1500, stock: 10, categoryId: books.id },
      { name: "Red Pen", priceCents: 500, stock: 50, categoryId: books.id },
      { name: "Toy Robot", priceCents: 4500, stock: 5, categoryId: toys.id },
      {
        name: "Secret Hidden Item",
        priceCents: 999,
        stock: 1,
        categoryId: toys.id,
        isActive: false,
      },
    ],
  });

  return { books, toys };
}

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("GET /products", () => {
  it("returns an empty page when there are no products", async () => {
    const res = await request(app).get("/products");

    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.pagination.total).toBe(0);
  });

  it("hides inactive products", async () => {
    await seed();
    const res = await request(app).get("/products");

    const names = res.body.items.map((p: { name: string }) => p.name);
    expect(res.body.pagination.total).toBe(3);
    expect(names).not.toContain("Secret Hidden Item");
  });

  it("filters by category", async () => {
    const { books } = await seed();
    const res = await request(app).get("/products").query({ categoryId: books.id });

    expect(res.body.pagination.total).toBe(2);
    for (const p of res.body.items) {
      expect(p.category.name).toBe("Books");
    }
  });

  it("searches by name, ignoring case", async () => {
    await seed();
    const res = await request(app).get("/products").query({ q: "NOTEBOOK" });

    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].name).toBe("Blue Notebook");
  });

  it("filters by price range and sorts ascending", async () => {
    await seed();
    const res = await request(app)
      .get("/products")
      .query({ minPriceCents: 500, maxPriceCents: 1500, sort: "price_asc" });

    const names = res.body.items.map((p: { name: string }) => p.name);
    expect(names).toEqual(["Red Pen", "Blue Notebook"]);
  });

  it("paginates results", async () => {
    await seed();
    const res = await request(app)
      .get("/products")
      .query({ limit: 2, page: 2, sort: "price_asc" });

    const names = res.body.items.map((p: { name: string }) => p.name);
    expect(names).toEqual(["Toy Robot"]);
    expect(res.body.pagination).toEqual({
      page: 2,
      limit: 2,
      total: 3,
      totalPages: 2,
    });
  });

  it("rejects an oversized limit with 400", async () => {
    const res = await request(app).get("/products").query({ limit: 1000 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("GET /products/:id", () => {
  it("returns a single product without internal fields", async () => {
    await seed();
    const product = await prisma.product.findFirstOrThrow({
      where: { name: "Red Pen" },
    });

    const res = await request(app).get(`/products/${product.id}`);

    expect(res.status).toBe(200);
    expect(res.body.product.name).toBe("Red Pen");
    expect(res.body.product.category.name).toBe("Books");
    expect(res.body.product).not.toHaveProperty("isActive");
  });

  it("returns 404 for an inactive product", async () => {
    await seed();
    const hidden = await prisma.product.findFirstOrThrow({
      where: { name: "Secret Hidden Item" },
    });

    const res = await request(app).get(`/products/${hidden.id}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("PRODUCT_NOT_FOUND");
  });

  it("returns 400 for a non-numeric id", async () => {
    const res = await request(app).get("/products/abc");

    expect(res.status).toBe(400);
  });

  it("returns 400 for an id beyond the integer range", async () => {
    const res = await request(app).get("/products/99999999999");

    expect(res.status).toBe(400);
  });
});
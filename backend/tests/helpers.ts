import { prisma } from "../src/lib/prisma.js";

export async function resetDatabase() {
  await prisma.$executeRaw`
    TRUNCATE TABLE
      "reviews",
      "wishlist_items",
      "order_items",
      "orders",
      "cart_items",
      "products",
      "categories",
      "users"
    RESTART IDENTITY CASCADE
  `;
}
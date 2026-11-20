import argon2 from "argon2";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const inputSchema = z.object({
  ADMIN_NAME: z.string().trim().min(1).default("Admin"),
  ADMIN_EMAIL: z.string().trim().toLowerCase().pipe(z.email()),
  ADMIN_PASSWORD: z.string().min(12).max(128),
});

const parsed = inputSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "Invalid input. Set ADMIN_EMAIL and ADMIN_PASSWORD (min 12 chars):",
    z.flattenError(parsed.error).fieldErrors,
  );
  process.exit(1);
}

const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = parsed.data;

const existing = await prisma.user.findUnique({
  where: { email: ADMIN_EMAIL },
});

if (existing) {
  await prisma.user.update({
    where: { id: existing.id },
    data: { role: "ADMIN" },
  });
  console.log(`Existing user ${ADMIN_EMAIL} promoted to ADMIN.`);
} else {
  await prisma.user.create({
    data: {
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      passwordHash: await argon2.hash(ADMIN_PASSWORD),
      role: "ADMIN",
    },
  });
  console.log(`Admin ${ADMIN_EMAIL} created.`);
}

await prisma.$disconnect();
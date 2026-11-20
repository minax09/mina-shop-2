import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { resetDatabase } from "./helpers.js";

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

const validUser = {
  name: "Mina",
  email: "Mina@Example.com",
  password: "StrongPass123",
};

describe("POST /auth/register", () => {
  it("creates a customer and never returns the password hash", async () => {
    const res = await request(app).post("/auth/register").send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe("mina@example.com");
    expect(res.body.user.role).toBe("CUSTOMER");
    expect(res.body.user).not.toHaveProperty("passwordHash");
  });

  it("rejects a duplicate email with 409", async () => {
    await request(app).post("/auth/register").send(validUser);

    const res = await request(app)
      .post("/auth/register")
      .send({ ...validUser, email: "mina@example.com" });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("EMAIL_TAKEN");
  });
});
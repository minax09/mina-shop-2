import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { resetDatabase } from "./helpers.js";

const credentials = {
  name: "Mina",
  email: "mina@example.com",
  password: "StrongPass123",
};

beforeEach(async () => {
  await resetDatabase();
  await request(app).post("/auth/register").send(credentials);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("POST /auth/login", () => {
  it("logs in and sets an httpOnly cookie", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "MINA@example.com", password: credentials.password });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("mina@example.com");
    expect(res.body.user).not.toHaveProperty("passwordHash");

    const cookies = res.headers["set-cookie"] as unknown as string[];
    expect(cookies[0]).toMatch(/^token=/);
    expect(cookies[0]).toMatch(/HttpOnly/i);
  });

  it("rejects a wrong password with 401", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: credentials.email, password: "WrongPassword1" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("rejects an unknown email with 401", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "nobody@example.com", password: credentials.password });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("returns the same error for wrong password and unknown email", async () => {
    const wrongPassword = await request(app)
      .post("/auth/login")
      .send({ email: credentials.email, password: "WrongPassword1" });

    const unknownEmail = await request(app)
      .post("/auth/login")
      .send({ email: "nobody@example.com", password: "WrongPassword1" });

    expect(unknownEmail.status).toBe(wrongPassword.status);
    expect(unknownEmail.body).toEqual(wrongPassword.body);
  });
});
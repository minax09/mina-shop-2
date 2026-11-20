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

async function loggedInAgent() {
  const agent = request.agent(app);
  await agent
    .post("/auth/login")
    .send({ email: credentials.email, password: credentials.password });
  return agent;
}

describe("session and route protection", () => {
  it("rejects /auth/me without a cookie", async () => {
    const res = await request(app).get("/auth/me");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("returns the current user when logged in", async () => {
    const agent = await loggedInAgent();
    const res = await agent.get("/auth/me");

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("mina@example.com");
    expect(res.body.user).not.toHaveProperty("passwordHash");
  });

  it("rejects a forged token", async () => {
    const res = await request(app)
      .get("/auth/me")
      .set("Cookie", "token=this.is.not-a-real-token");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("rejects /auth/me after logout", async () => {
    const agent = await loggedInAgent();

    const logout = await agent.post("/auth/logout");
    expect(logout.status).toBe(200);

    const res = await agent.get("/auth/me");
    expect(res.status).toBe(401);
  });

  it("rejects a valid token whose user no longer exists", async () => {
    const agent = await loggedInAgent();

    await prisma.user.deleteMany();

    const res = await agent.get("/auth/me");
    expect(res.status).toBe(401);
  });
});
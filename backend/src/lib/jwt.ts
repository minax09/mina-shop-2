import { SignJWT, jwtVerify } from "jose";
import { env } from "../config.js";

const secret = new TextEncoder().encode(env.JWT_SECRET);

export async function signToken(userId: number): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<number> {
  const { payload } = await jwtVerify(token, secret, {
    algorithms: ["HS256"],
  });
  return Number(payload.sub);
}
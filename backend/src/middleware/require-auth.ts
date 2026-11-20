import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/errors.js";
import { verifyToken } from "../lib/jwt.js";
import { prisma } from "../lib/prisma.js";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: "CUSTOMER" | "ADMIN";
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const unauthenticated = () =>
  new AppError(401, "UNAUTHENTICATED", "Authentication required");

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const token: unknown = req.cookies?.token;

  if (typeof token !== "string" || token.length === 0) {
    throw unauthenticated();
  }

  let userId: number;
  try {
    userId = await verifyToken(token);
  } catch {
    throw unauthenticated();
  }

  if (!Number.isInteger(userId)) {
    throw unauthenticated();
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!user) {
    throw unauthenticated();
  }

  req.user = user;
  next();
}
import type { Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../../lib/errors.js";
import { env } from "../../config.js";
import { loginSchema, registerSchema } from "./auth.schemas.js";
import { loginUser, registerUser } from "./auth.service.js";

export const AUTH_COOKIE = "token";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.NODE_ENV === "production",
  maxAge: 24 * 60 * 60 * 1000,
  path: "/",
};

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "Invalid input",
      z.flattenError(parsed.error).fieldErrors,
    );
  }

  const user = await registerUser(parsed.data);
  res.status(201).json({ user });
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "Invalid input",
      z.flattenError(parsed.error).fieldErrors,
    );
  }

  const { token, user } = await loginUser(parsed.data);

  res.cookie(AUTH_COOKIE, token, cookieOptions);
  res.json({ user });
}
import type { Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../../lib/errors.js";
import { registerSchema } from "./auth.schemas.js";
import { registerUser } from "./auth.service.js";

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
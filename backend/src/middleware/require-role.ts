import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/errors.js";
import type { AuthUser } from "./require-auth.js";

export function requireRole(...roles: AuthUser["role"][]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError(401, "UNAUTHENTICATED", "Authentication required");
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError(
        403,
        "FORBIDDEN",
        "You do not have permission to perform this action",
      );
    }

    next();
  };
}
import { z } from "zod";
import { AppError } from "./errors.js";

export function parseOrThrow<T extends z.ZodType>(
  schema: T,
  data: unknown,
): z.infer<T> {
  const result = schema.safeParse(data);

  if (!result.success) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "Invalid input",
      z.flattenError(result.error).fieldErrors,
    );
  }

  return result.data;
}
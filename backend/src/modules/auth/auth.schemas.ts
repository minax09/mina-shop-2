import { z } from "zod";

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email());

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: emailField,
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1).max(128),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
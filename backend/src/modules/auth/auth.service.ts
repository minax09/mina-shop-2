import argon2 from "argon2";
import { prisma } from "../../lib/prisma.js";
import { Prisma } from "../../generated/prisma/client.js";
import { AppError } from "../../lib/errors.js";
import { signToken } from "../../lib/jwt.js";
import type { LoginInput, RegisterInput } from "./auth.schemas.js";

const DUMMY_HASH = await argon2.hash("dummy-password-for-timing");

export async function registerUser(input: RegisterInput) {
  const passwordHash = await argon2.hash(input.password);

  try {
    return await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError(409, "EMAIL_TAKEN", "Email is already registered");
    }
    throw error;
  }
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  const valid = await argon2.verify(
    user?.passwordHash ?? DUMMY_HASH,
    input.password,
  );

  if (!user || !valid) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  const token = await signToken(user.id);

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}
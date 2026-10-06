import { createHash, randomBytes } from "node:crypto";
import argon2 from "argon2";
import { AuthError } from "./auth.types.js";
import type { LoginInput, RegisterInput } from "./auth.types.js";
import type { AuthRepository } from "./auth.repository.js";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function createAuthService(repository: AuthRepository) {
  return {
    async register(input: RegisterInput) {
      const normalizedInput = { ...input, email: input.email.trim().toLowerCase(), name: input.name.trim() };
      if (await repository.findUserByEmail(normalizedInput.email)) {
        throw new AuthError("EMAIL_ALREADY_EXISTS");
      }
      const passwordHash = await argon2.hash(input.password);
      const sessionToken = randomBytes(32).toString("base64url");
      const sessionTokenHash = createHash("sha256").update(sessionToken).digest("hex");

      try {
        const user = await repository.register({
          ...normalizedInput,
          passwordHash,
          sessionTokenHash,
          sessionExpiresAt: new Date(Date.now() + SESSION_TTL_MS),
        });
        return { user, sessionToken };
      } catch (error) {
        if (isPrismaUniqueViolation(error)) throw new AuthError("EMAIL_ALREADY_EXISTS");
        throw error;
      }
    },
    async login(input: LoginInput) {
      const user = await repository.findUserByEmail(input.email.trim().toLowerCase());
      if (!user) throw new AuthError("INVALID_CREDENTIALS");

      let isPasswordValid = false;
      try {
        isPasswordValid = await argon2.verify(user.passwordHash, input.password);
      } catch {
        // Treat malformed stored hashes the same as invalid credentials.
      }
      if (!isPasswordValid) throw new AuthError("INVALID_CREDENTIALS");

      const sessionToken = randomBytes(32).toString("base64url");
      await repository.createSession({
        userId: user.id,
        sessionTokenHash: createHash("sha256").update(sessionToken).digest("hex"),
        sessionExpiresAt: new Date(Date.now() + SESSION_TTL_MS),
      });
      return {
        user: { id: user.id, name: user.name, email: user.email },
        sessionToken,
      };
    },
  };
}

function isPrismaUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

export type AuthService = ReturnType<typeof createAuthService>;

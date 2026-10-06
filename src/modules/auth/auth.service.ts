import type { AuthRepository } from "./auth.repository.js";
import type { LoginInput } from "./auth.types.js";

/** Auth use cases live here; this module deliberately has no Fastify dependency. */
export function createAuthService(repository: AuthRepository) {
  return {
    // Login behavior and session creation are implemented in BE-016.
    async login(_input: LoginInput): Promise<never> {
      void repository;
      throw new Error("Authentication login is not implemented yet");
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;

import type { FastifyReply, FastifyRequest } from "fastify";
import type { AuthService } from "./auth.service.js";
import type { LoginInput } from "./auth.types.js";

/** HTTP adapter: Fastify-specific request/reply handling stays in the controller. */
export function createAuthController(_service: AuthService) {
  return {
    async login(_request: FastifyRequest<{ Body: LoginInput }>, _reply: FastifyReply) {
      // Endpoint wiring is introduced with BE-016.
      throw new Error("Authentication login endpoint is not implemented yet");
    },
  };
}

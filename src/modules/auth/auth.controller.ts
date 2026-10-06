import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "../../config/env.js";
import type { AuthService } from "./auth.service.js";
import type { RegisterInput } from "./auth.types.js";

const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

export function createAuthController(service: AuthService) {
  return {
    async register(request: FastifyRequest<{ Body: RegisterInput }>, reply: FastifyReply) {
      try {
        const { user, sessionToken } = await service.register(request.body);
        reply.setCookie(env.SESSION_COOKIE_NAME, sessionToken, {
          httpOnly: true,
          secure: env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: SESSION_TTL_SECONDS,
        });
        return reply.code(201).send({ data: { user } });
      } catch (error) {
        if (error instanceof Error && "code" in error && error.code === "EMAIL_ALREADY_EXISTS") {
          return reply.code(409).send({ error: { code: "EMAIL_ALREADY_EXISTS", message: "Email is already registered" } });
        }
        throw error;
      }
    },
  };
}

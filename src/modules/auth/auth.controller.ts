import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "../../config/env.js";
import type { AuthService } from "./auth.service.js";
import type { LoginInput, RegisterInput } from "./auth.types.js";

const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

export function createAuthController(service: AuthService) {
  return {
    async me(request: FastifyRequest, reply: FastifyReply) {
      if (!request.user) {
        return reply.code(401).send({ error: { code: "UNAUTHORIZED", message: "Authentication required" } });
      }
      const user = await service.getCurrentUser(request.user.id);
      if (!user) {
        return reply.code(401).send({ error: { code: "UNAUTHORIZED", message: "Authentication required" } });
      }
      return reply.code(200).send({ data: user });
    },
    async login(request: FastifyRequest<{ Body: LoginInput }>, reply: FastifyReply) {
      try {
        const { user, sessionToken } = await service.login(request.body);
        reply.setCookie(env.SESSION_COOKIE_NAME, sessionToken, {
          httpOnly: true,
          secure: env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: SESSION_TTL_SECONDS,
        });
        return reply.code(200).send({ data: { user: { id: user.id, email: user.email } } });
      } catch (error) {
        if (error instanceof Error && "code" in error && error.code === "INVALID_CREDENTIALS") {
          return reply.code(401).send({ error: { code: "INVALID_CREDENTIALS", message: "Email atau password salah" } });
        }
        throw error;
      }
    },
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
    async logout(request: FastifyRequest, reply: FastifyReply) {
      await service.logout(request.cookies[env.SESSION_COOKIE_NAME]);
      reply.clearCookie(env.SESSION_COOKIE_NAME, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });
      return reply.code(204).send();
    },
  };
}

import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import type { FastifyError } from "fastify";
import Fastify from "fastify";
import { TypeBoxValidatorCompiler } from "@fastify/type-provider-typebox";
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { env } from "../config/env.js";
import { authRoutes } from "../modules/auth/auth.routes.js";
import type { AuthService } from "../modules/auth/auth.service.js";
import { createSessionMiddleware } from "../modules/auth/session.middleware.js";
import type { SessionLookup } from "../modules/auth/session.middleware.js";
import { healthRoutes } from "../modules/health/health.routes.js";

export function buildApp(authService?: AuthService, sessionLookup?: SessionLookup) {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug",
    },
  })
    .withTypeProvider<TypeBoxTypeProvider>()
    .setValidatorCompiler(TypeBoxValidatorCompiler);

  app.register(cors, {
    origin: env.CORS_ORIGINS,
    credentials: true,
  });
  app.register(cookie);
  app.decorateRequest("user", null);

  if (sessionLookup) {
    app.addHook("preHandler", createSessionMiddleware(sessionLookup));
  }

  app.setErrorHandler((error: FastifyError, request, reply) => {
    const statusCode = error.statusCode && error.statusCode >= 400 ? error.statusCode : 500;
    request.log.error({ err: error }, "Request failed");

    reply.status(statusCode).send({
      error: {
        code: statusCode >= 500 ? "INTERNAL_SERVER_ERROR" : "REQUEST_ERROR",
        message: statusCode >= 500 ? "An unexpected error occurred" : error.message,
      },
    });
  });

  app.register(healthRoutes, { prefix: "/api" });
  app.register(authRoutes, {
    prefix: "/api/auth",
    service: authService ?? {
      register: async () => { throw new Error("Auth service is not configured"); },
      login: async () => { throw new Error("Auth service is not configured"); },
      logout: async () => { throw new Error("Auth service is not configured"); },
    },
  });

  return app;
}

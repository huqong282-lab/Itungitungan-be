import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "typebox";
import { createAuthController } from "./auth.controller.js";
import type { AuthService } from "./auth.service.js";
import { registerBodySchema, registerResponseSchema } from "./auth.schema.js";

type AuthRouteOptions = { service: AuthService };

export const authRoutes: FastifyPluginAsyncTypebox<AuthRouteOptions> = async (app, { service }) => {
  const controller = createAuthController(service);
  app.post("/register", {
    schema: {
      body: registerBodySchema,
      response: {
        201: registerResponseSchema,
        400: Type.Object({ error: Type.Object({ code: Type.String(), message: Type.String() }) }),
        409: Type.Object({ error: Type.Object({ code: Type.String(), message: Type.String() }) }),
      },
    },
  }, controller.register);
};

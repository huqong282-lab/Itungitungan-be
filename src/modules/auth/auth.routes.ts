import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "typebox";
import { createAuthController } from "./auth.controller.js";
import type { AuthService } from "./auth.service.js";
import { currentUserResponseSchema, loginBodySchema, loginResponseSchema, registerBodySchema, registerResponseSchema } from "./auth.schema.js";

type AuthRouteOptions = { service: AuthService };

export const authRoutes: FastifyPluginAsyncTypebox<AuthRouteOptions> = async (app, { service }) => {
  const controller = createAuthController(service);
  app.get("/me", {
    schema: {
      response: {
        200: currentUserResponseSchema,
        401: Type.Object({ error: Type.Object({ code: Type.String(), message: Type.String() }) }),
      },
    },
  }, controller.me);
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
  app.post("/login", {
    schema: {
      body: loginBodySchema,
      response: {
        200: loginResponseSchema,
        400: Type.Object({ error: Type.Object({ code: Type.String(), message: Type.String() }) }),
        401: Type.Object({ error: Type.Object({ code: Type.String(), message: Type.String() }) }),
      },
    },
  }, controller.login);
  app.post("/logout", controller.logout);
};

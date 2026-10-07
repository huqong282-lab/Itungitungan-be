import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { createSettingsController } from "./controller.js";
import type { SettingsService } from "./service.js";
import { settingsErrorSchema, settingsResponseSchema, updateSettingsBodySchema } from "./schema.js";

type SettingsRouteOptions = { service: SettingsService };

export const settingsRoutes: FastifyPluginAsyncTypebox<SettingsRouteOptions> = async (app, { service }) => {
  const controller = createSettingsController(service);
  app.get("/", {
    schema: { response: { 200: settingsResponseSchema, 401: settingsErrorSchema, 404: settingsErrorSchema } },
  }, controller.get);
  app.patch("/", {
    schema: {
      body: updateSettingsBodySchema,
      response: { 200: settingsResponseSchema, 400: settingsErrorSchema, 401: settingsErrorSchema, 404: settingsErrorSchema },
    },
  }, controller.patch);
};

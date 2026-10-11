import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { createMaintenancePlanController } from "./controller.js";
import type { MaintenancePlanService } from "./service.js";
import { maintenancePlanCreateBodySchema, maintenancePlanErrorSchema, maintenancePlanIdParamsSchema, maintenancePlanListQuerySchema, maintenancePlanListResponseSchema, maintenancePlanResponseSchema, maintenancePlanStatusBodySchema, maintenancePlanStatusResponseSchema, maintenancePlanUpdateBodySchema } from "./schema.js";

type MaintenancePlanRouteOptions = { service: MaintenancePlanService };
export const maintenancePlanRoutes: FastifyPluginAsyncTypebox<MaintenancePlanRouteOptions> = async (app, { service }) => {
  const controller = createMaintenancePlanController(service);
  app.get("/", { schema: { querystring: maintenancePlanListQuerySchema, response: { 200: maintenancePlanListResponseSchema, 400: maintenancePlanErrorSchema, 401: maintenancePlanErrorSchema } } }, controller.list);
  app.get("/:id", { schema: { params: maintenancePlanIdParamsSchema, response: { 200: maintenancePlanResponseSchema, 401: maintenancePlanErrorSchema, 404: maintenancePlanErrorSchema } } }, controller.get);
  app.post("/", { schema: { body: maintenancePlanCreateBodySchema, response: { 201: maintenancePlanResponseSchema, 400: maintenancePlanErrorSchema, 401: maintenancePlanErrorSchema } } }, controller.create);
  app.patch("/:id/status", { schema: { params: maintenancePlanIdParamsSchema, body: maintenancePlanStatusBodySchema, response: { 200: maintenancePlanStatusResponseSchema, 400: maintenancePlanErrorSchema, 401: maintenancePlanErrorSchema, 404: maintenancePlanErrorSchema } } }, controller.patchStatus);
  app.patch("/:id", { schema: { params: maintenancePlanIdParamsSchema, body: maintenancePlanUpdateBodySchema, response: { 200: maintenancePlanResponseSchema, 400: maintenancePlanErrorSchema, 401: maintenancePlanErrorSchema, 404: maintenancePlanErrorSchema } } }, controller.patch);
};

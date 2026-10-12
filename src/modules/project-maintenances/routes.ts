import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { createProjectMaintenanceController } from "./controller.js";
import type { ProjectMaintenanceService } from "./service.js";
import { projectMaintenanceCreateBodySchema, projectMaintenanceErrorSchema, projectMaintenanceParamsSchema, projectMaintenanceRelationParamsSchema, projectMaintenanceResponseSchema } from "./schema.js";

export const projectMaintenanceRoutes: FastifyPluginAsyncTypebox<{ service: ProjectMaintenanceService }> = async (app, { service }) => {
  const controller = createProjectMaintenanceController(service);
  app.post("/:projectId/maintenances", { schema: { params: projectMaintenanceParamsSchema, body: projectMaintenanceCreateBodySchema, response: { 201: projectMaintenanceResponseSchema, 400: projectMaintenanceErrorSchema, 401: projectMaintenanceErrorSchema, 404: projectMaintenanceErrorSchema, 409: projectMaintenanceErrorSchema } } }, controller.create);
  app.delete("/:projectId/maintenances/:maintenanceId", { schema: { params: projectMaintenanceRelationParamsSchema, response: { 204: { type: "null" }, 401: projectMaintenanceErrorSchema, 404: projectMaintenanceErrorSchema } } }, controller.remove);
};

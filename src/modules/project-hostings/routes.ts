import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { createProjectHostingController } from "./controller.js";
import type { ProjectHostingService } from "./service.js";
import { projectHostingCreateBodySchema, projectHostingErrorSchema, projectHostingParamsSchema, projectHostingResponseSchema, projectHostingUpdateBodySchema, projectHostingsParamsSchema } from "./schema.js";

export const projectHostingRoutes: FastifyPluginAsyncTypebox<{ service: ProjectHostingService }> = async (app, { service }) => {
  const controller = createProjectHostingController(service);
  app.post("/:projectId/hostings", { schema: { params: projectHostingsParamsSchema, body: projectHostingCreateBodySchema, response: { 201: projectHostingResponseSchema, 400: projectHostingErrorSchema, 401: projectHostingErrorSchema, 404: projectHostingErrorSchema, 422: projectHostingErrorSchema } } }, controller.create);
  app.patch("/:projectId/hostings/:hostingId", { schema: { params: projectHostingParamsSchema, body: projectHostingUpdateBodySchema, response: { 200: projectHostingResponseSchema, 400: projectHostingErrorSchema, 401: projectHostingErrorSchema, 404: projectHostingErrorSchema, 422: projectHostingErrorSchema } } }, controller.patch);
  app.delete("/:projectId/hostings/:hostingId", { schema: { params: projectHostingParamsSchema, response: { 204: { type: "null" }, 401: projectHostingErrorSchema, 404: projectHostingErrorSchema } } }, controller.remove);
};

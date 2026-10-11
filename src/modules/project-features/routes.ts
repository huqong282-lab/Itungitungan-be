import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { createProjectFeatureController } from "./controller.js";
import type { ProjectFeatureService } from "./service.js";
import { projectFeatureCreateBodySchema, projectFeatureErrorSchema, projectFeatureIdParamsSchema, projectFeatureParamsSchema, projectFeatureResponseSchema, projectFeatureUpdateBodySchema, projectSelectionsResponseSchema, replaceSelectionsBodySchema } from "./schema.js";

export const projectFeatureRoutes: FastifyPluginAsyncTypebox<{ service: ProjectFeatureService }> = async (app, { service }) => {
  const controller = createProjectFeatureController(service);
  app.post("/:projectId/features", { schema: { params: projectFeatureParamsSchema, body: projectFeatureCreateBodySchema, response: { 400: projectFeatureErrorSchema, 401: projectFeatureErrorSchema, 404: projectFeatureErrorSchema, 409: projectFeatureErrorSchema, 422: projectFeatureErrorSchema } } }, controller.add);
  app.patch("/:projectId/features/:projectFeatureId", { schema: { params: projectFeatureIdParamsSchema, body: projectFeatureUpdateBodySchema, response: { 200: projectFeatureResponseSchema, 400: projectFeatureErrorSchema, 401: projectFeatureErrorSchema, 404: projectFeatureErrorSchema } } }, controller.patch);
  app.delete("/:projectId/features/:projectFeatureId", { schema: { params: projectFeatureIdParamsSchema, response: { 204: { type: "null" }, 401: projectFeatureErrorSchema, 404: projectFeatureErrorSchema } } }, controller.remove);
  app.put("/:projectId/features/:projectFeatureId/selections", { schema: { params: projectFeatureIdParamsSchema, body: replaceSelectionsBodySchema, response: { 200: projectSelectionsResponseSchema, 400: projectFeatureErrorSchema, 401: projectFeatureErrorSchema, 404: projectFeatureErrorSchema, 422: projectFeatureErrorSchema } } }, controller.putSelections);
};

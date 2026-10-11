import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { createProjectController } from "./controller.js";
import type { ProjectService } from "./service.js";
import { projectCreateBodySchema, projectErrorSchema, projectIdParamsSchema, projectListQuerySchema, projectListResponseSchema, projectResponseSchema, projectUpdateBodySchema } from "./schema.js";

export const projectRoutes: FastifyPluginAsyncTypebox<{ service: ProjectService }> = async (app, { service }) => {
  const controller = createProjectController(service);
  app.get("/", { schema: { querystring: projectListQuerySchema, response: { 200: projectListResponseSchema, 400: projectErrorSchema, 401: projectErrorSchema } } }, controller.list);
  app.get("/:id", { schema: { params: projectIdParamsSchema, response: { 200: projectResponseSchema, 401: projectErrorSchema, 404: projectErrorSchema } } }, controller.get);
  app.post("/", { schema: { body: projectCreateBodySchema, response: { 201: projectResponseSchema, 400: projectErrorSchema, 401: projectErrorSchema } } }, controller.create);
  app.patch("/:id", { schema: { params: projectIdParamsSchema, body: projectUpdateBodySchema, response: { 200: projectResponseSchema, 400: projectErrorSchema, 401: projectErrorSchema, 404: projectErrorSchema } } }, controller.patch);
};

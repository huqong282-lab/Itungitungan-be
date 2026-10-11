import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { createProjectDesignController } from "./controller.js";
import type { ProjectDesignService } from "./service.js";
import { projectDesignErrorSchema, projectDesignParamsSchema, projectDesignResponseSchema, setProjectDesignBodySchema } from "./schema.js";

export const projectDesignRoutes: FastifyPluginAsyncTypebox<{ service: ProjectDesignService }> = async (app, { service }) => {
  const controller = createProjectDesignController(service);
  app.put("/:projectId/design", { schema: { params: projectDesignParamsSchema, body: setProjectDesignBodySchema, response: { 200: projectDesignResponseSchema, 400: projectDesignErrorSchema, 401: projectDesignErrorSchema, 404: projectDesignErrorSchema, 422: projectDesignErrorSchema } } }, controller.put);
  app.delete("/:projectId/design", { schema: { params: projectDesignParamsSchema, response: { 204: { type: "null" }, 401: projectDesignErrorSchema, 404: projectDesignErrorSchema } } }, controller.remove);
};

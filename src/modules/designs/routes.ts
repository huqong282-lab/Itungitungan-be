import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { createDesignController } from "./controller.js";
import type { DesignService } from "./service.js";
import {
  designCreateBodySchema,
  designErrorSchema,
  designIdParamsSchema,
  designListQuerySchema,
  designListResponseSchema,
  designResponseSchema,
  designStatusBodySchema,
  designStatusResponseSchema,
  designUpdateBodySchema,
} from "./schema.js";

type DesignRouteOptions = { service: DesignService };

export const designRoutes: FastifyPluginAsyncTypebox<DesignRouteOptions> = async (app, { service }) => {
  const controller = createDesignController(service);
  app.get("/", {
    schema: { querystring: designListQuerySchema, response: { 200: designListResponseSchema, 400: designErrorSchema, 401: designErrorSchema } },
  }, controller.list);
  app.get("/:id", {
    schema: { params: designIdParamsSchema, response: { 200: designResponseSchema, 401: designErrorSchema, 404: designErrorSchema } },
  }, controller.get);
  app.post("/", {
    schema: { body: designCreateBodySchema, response: { 201: designResponseSchema, 400: designErrorSchema, 401: designErrorSchema } },
  }, controller.create);
  app.patch("/:id/status", {
    schema: { params: designIdParamsSchema, body: designStatusBodySchema, response: { 200: designStatusResponseSchema, 400: designErrorSchema, 401: designErrorSchema, 404: designErrorSchema } },
  }, controller.patchStatus);
  app.patch("/:id", {
    schema: { params: designIdParamsSchema, body: designUpdateBodySchema, response: { 200: designResponseSchema, 400: designErrorSchema, 401: designErrorSchema, 404: designErrorSchema } },
  }, controller.patch);
};

import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { createHostingPlanController } from "./controller.js";
import type { HostingPlanService } from "./service.js";
import {
  hostingPlanCreateBodySchema,
  hostingPlanErrorSchema,
  hostingPlanIdParamsSchema,
  hostingPlanListQuerySchema,
  hostingPlanListResponseSchema,
  hostingPlanResponseSchema,
  hostingPlanStatusBodySchema,
  hostingPlanStatusResponseSchema,
  hostingPlanUpdateBodySchema,
} from "./schema.js";

type HostingPlanRouteOptions = { service: HostingPlanService };

export const hostingPlanRoutes: FastifyPluginAsyncTypebox<HostingPlanRouteOptions> = async (app, { service }) => {
  const controller = createHostingPlanController(service);
  app.get("/", {
    schema: { querystring: hostingPlanListQuerySchema, response: { 200: hostingPlanListResponseSchema, 400: hostingPlanErrorSchema, 401: hostingPlanErrorSchema } },
  }, controller.list);
  app.get("/:id", {
    schema: { params: hostingPlanIdParamsSchema, response: { 200: hostingPlanResponseSchema, 401: hostingPlanErrorSchema, 404: hostingPlanErrorSchema } },
  }, controller.get);
  app.post("/", {
    schema: { body: hostingPlanCreateBodySchema, response: { 201: hostingPlanResponseSchema, 400: hostingPlanErrorSchema, 401: hostingPlanErrorSchema } },
  }, controller.create);
  app.patch("/:id/status", {
    schema: { params: hostingPlanIdParamsSchema, body: hostingPlanStatusBodySchema, response: { 200: hostingPlanStatusResponseSchema, 400: hostingPlanErrorSchema, 401: hostingPlanErrorSchema, 404: hostingPlanErrorSchema } },
  }, controller.patchStatus);
  app.patch("/:id", {
    schema: { params: hostingPlanIdParamsSchema, body: hostingPlanUpdateBodySchema, response: { 200: hostingPlanResponseSchema, 400: hostingPlanErrorSchema, 401: hostingPlanErrorSchema, 404: hostingPlanErrorSchema } },
  }, controller.patch);
};

import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { createFeatureController } from "./controller.js";
import type { FeatureService } from "./service.js";
import {
  featureCreateBodySchema,
  featureDetailResponseSchema,
  featureErrorSchema,
  featureIdParamsSchema,
  featureOptionCreateBodySchema,
  featureOptionFeatureParamsSchema,
  featureOptionParamsSchema,
  featureOptionResponseSchema,
  featureOptionUpdateBodySchema,
  featureListQuerySchema,
  featureListResponseSchema,
  featureStatusBodySchema,
  featureStatusResponseSchema,
  featureSummaryResponseSchema,
  featureUpdateBodySchema,
} from "./schema.js";

type FeatureRouteOptions = { service: FeatureService };

export const featureRoutes: FastifyPluginAsyncTypebox<FeatureRouteOptions> = async (app, { service }) => {
  const controller = createFeatureController(service);
  app.post("/:featureId/options", {
    schema: {
      params: featureOptionFeatureParamsSchema,
      body: featureOptionCreateBodySchema,
      response: { 201: featureOptionResponseSchema, 400: featureErrorSchema, 401: featureErrorSchema, 404: featureErrorSchema },
    },
  }, controller.createOption);
  app.patch("/:featureId/options/:optionId", {
    schema: {
      params: featureOptionParamsSchema,
      body: featureOptionUpdateBodySchema,
      response: { 200: featureOptionResponseSchema, 400: featureErrorSchema, 401: featureErrorSchema, 404: featureErrorSchema },
    },
  }, controller.patchOption);
  app.get("/", {
    schema: {
      querystring: featureListQuerySchema,
      response: { 200: featureListResponseSchema, 400: featureErrorSchema, 401: featureErrorSchema },
    },
  }, controller.list);
  app.get("/:id", {
    schema: {
      params: featureIdParamsSchema,
      response: { 200: featureDetailResponseSchema, 401: featureErrorSchema, 404: featureErrorSchema },
    },
  }, controller.get);
  app.post("/", {
    schema: {
      body: featureCreateBodySchema,
      response: { 400: featureErrorSchema, 401: featureErrorSchema },
    },
  }, controller.create);
  app.patch("/:id/status", {
    schema: {
      params: featureIdParamsSchema,
      body: featureStatusBodySchema,
      response: { 200: featureStatusResponseSchema, 400: featureErrorSchema, 401: featureErrorSchema, 404: featureErrorSchema },
    },
  }, controller.patchStatus);
  app.patch("/:id", {
    schema: {
      params: featureIdParamsSchema,
      body: featureUpdateBodySchema,
      response: { 200: featureSummaryResponseSchema, 400: featureErrorSchema, 401: featureErrorSchema, 404: featureErrorSchema },
    },
  }, controller.patch);
};

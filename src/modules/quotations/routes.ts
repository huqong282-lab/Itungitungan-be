import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { createQuotationController } from "./controller.js";
import type { QuotationService } from "./service.js";
import { createQuotationBodySchema, createQuotationParamsSchema, quotationDetailResponseSchema, quotationErrorSchema, quotationResponseSchema, recalculateQuotationParamsSchema } from "./schema.js";

export const quotationRoutes: FastifyPluginAsyncTypebox<{ service: QuotationService }> = async (app, { service }) => {
  const controller = createQuotationController(service);
  app.post("/:projectId/quotations", {
    schema: {
      params: createQuotationParamsSchema,
      body: createQuotationBodySchema,
      response: {
        201: quotationResponseSchema,
        400: quotationErrorSchema,
        401: quotationErrorSchema,
        404: quotationErrorSchema,
        409: quotationErrorSchema,
        422: quotationErrorSchema,
      },
    },
  }, controller.create);
};

export const quotationRecalculationRoutes: FastifyPluginAsyncTypebox<{ service: QuotationService }> = async (app, { service }) => {
  const controller = createQuotationController(service);
  app.post("/:quotationId/recalculate", {
    schema: {
      params: recalculateQuotationParamsSchema,
      response: {
        200: quotationResponseSchema,
        401: quotationErrorSchema,
        404: quotationErrorSchema,
        422: quotationErrorSchema,
      },
    },
  }, controller.recalculate);
};

export const quotationDetailRoutes: FastifyPluginAsyncTypebox<{ service: QuotationService }> = async (app, { service }) => {
  const controller = createQuotationController(service);
  app.get("/:quotationId", {
    schema: {
      params: recalculateQuotationParamsSchema,
      response: {
        200: quotationDetailResponseSchema,
        401: quotationErrorSchema,
        404: quotationErrorSchema,
      },
    },
  }, controller.detail);
};

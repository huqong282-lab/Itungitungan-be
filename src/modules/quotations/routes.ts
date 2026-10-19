import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { createQuotationController } from "./controller.js";
import type { QuotationService } from "./service.js";
import { createQuotationBodySchema, createQuotationParamsSchema, quotationDetailResponseSchema, quotationErrorSchema, quotationFinalizeResponseSchema, quotationListQuerySchema, quotationListResponseSchema, quotationResponseSchema, recalculateQuotationParamsSchema } from "./schema.js";

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
  app.post("/:quotationId/finalize", {
    schema: {
      params: recalculateQuotationParamsSchema,
      response: {
        200: quotationFinalizeResponseSchema,
        400: quotationErrorSchema,
        401: quotationErrorSchema,
        404: quotationErrorSchema,
        422: quotationErrorSchema,
      },
    },
  }, controller.finalize);
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
  app.get("/", {
    schema: {
      querystring: quotationListQuerySchema,
      response: { 200: quotationListResponseSchema, 400: quotationErrorSchema, 401: quotationErrorSchema, 404: quotationErrorSchema },
    },
  }, controller.list);
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
  app.get("/:quotationId/pdf", {
    schema: {
      params: recalculateQuotationParamsSchema,
      response: { 401: quotationErrorSchema, 404: quotationErrorSchema },
    },
  }, controller.pdf);
};

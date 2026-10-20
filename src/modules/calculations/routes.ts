import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "typebox";
import { createCalculationController } from "./controller.js";
import type { CalculationService } from "./service.js";
import { calculationErrorSchema, calculateProjectBodySchema, calculateProjectParamsSchema, projectCalculationResponseSchema } from "./schema.js";

export const calculationRoutes: FastifyPluginAsyncTypebox<{ service: CalculationService }> = async (app, { service }) => {
  const controller = createCalculationController(service);
  app.post("/:projectId/calculate", {
    schema: {
      params: calculateProjectParamsSchema,
      // Fastify validates an absent body as null; the controller rejects an
      // explicitly supplied null while preserving the contract's body-optional behavior.
      body: Type.Union([calculateProjectBodySchema, Type.Null()]),
      response: {
        200: projectCalculationResponseSchema,
        400: calculationErrorSchema,
        401: calculationErrorSchema,
        404: calculationErrorSchema,
        422: calculationErrorSchema,
      },
    },
  }, controller.calculate);
};

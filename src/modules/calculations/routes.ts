import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { createCalculationController } from "./controller.js";
import type { CalculationService } from "./service.js";
import { calculationErrorSchema, calculateProjectBodySchema, calculateProjectParamsSchema, projectCalculationResponseSchema } from "./schema.js";

export const calculationRoutes: FastifyPluginAsyncTypebox<{ service: CalculationService }> = async (app, { service }) => {
  const controller = createCalculationController(service);
  app.post("/:projectId/calculate", {
    schema: {
      params: calculateProjectParamsSchema,
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

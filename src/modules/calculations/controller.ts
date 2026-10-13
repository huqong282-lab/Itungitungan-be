import type { FastifyReply, FastifyRequest } from "fastify";
import { Value } from "typebox/value";
import type { CalculationService } from "./service.js";
import { calculateProjectBodySchema } from "./schema.js";
import type { CalculateProjectInput } from "./types.js";
import {
  CalculationDataInvalidError,
  CalculationProjectNotFoundError,
  CalculationSettingsNotFoundError,
} from "./types.js";

type CalculateProjectRequest = FastifyRequest<{
  Params: { projectId: string };
  Body: unknown;
}>;

export function createCalculationController(service: CalculationService) {
  return {
    async calculate(request: CalculateProjectRequest, reply: FastifyReply) {
      if (!request.user) return reply.code(401).send({ error: { code: "UNAUTHORIZED", message: "Authentication required" } });
      let input: CalculateProjectInput = {};
      if (request.body !== undefined) {
        try {
          input = Value.Parse(calculateProjectBodySchema, request.body);
        } catch {
          return reply.code(400).send({ error: { code: "REQUEST_ERROR", message: "Invalid calculation request" } });
        }
      }
      try {
        const data = await service.calculateProject(request.user.id, request.params.projectId, input);
        return reply.code(200).send({ data });
      } catch (error) {
        if (error instanceof CalculationProjectNotFoundError) {
          return reply.code(404).send({ error: { code: "PROJECT_NOT_FOUND", message: "Project not found" } });
        }
        if (error instanceof CalculationSettingsNotFoundError) {
          return reply.code(404).send({ error: { code: "SETTINGS_NOT_FOUND", message: "Developer settings not found" } });
        }
        if (error instanceof CalculationDataInvalidError || error instanceof RangeError) {
          return reply.code(422).send({ error: { code: "CALCULATION_INVALID", message: "Project cannot be calculated with its current data" } });
        }
        throw error;
      }
    },
  };
}

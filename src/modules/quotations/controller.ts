import type { FastifyReply, FastifyRequest } from "fastify";
import type { QuotationService } from "./service.js";
import {
  CalculationDataInvalidError,
  CalculationProjectNotFoundError,
  CalculationSettingsNotFoundError,
} from "../calculations/types.js";
import {
  DraftQuotationAlreadyExistsError,
  QuotationDataInvalidError,
  QuotationProjectNotFoundError,
} from "./types.js";

type CreateQuotationRequest = FastifyRequest<{ Params: { projectId: string }; Body: Record<string, never> }>;

export function createQuotationController(service: QuotationService) {
  return {
    async create(request: CreateQuotationRequest, reply: FastifyReply) {
      if (!request.user) return reply.code(401).send({ error: { code: "UNAUTHORIZED", message: "Authentication required" } });
      try {
        const data = await service.createDraftQuotation(request.user.id, request.params.projectId);
        return reply.code(201).send({ data: { ...data, createdAt: data.createdAt.toISOString() } });
      } catch (error) {
        if (error instanceof CalculationProjectNotFoundError || error instanceof QuotationProjectNotFoundError) {
          return reply.code(404).send({ error: { code: "PROJECT_NOT_FOUND", message: "Project not found" } });
        }
        if (error instanceof CalculationSettingsNotFoundError) {
          return reply.code(404).send({ error: { code: "SETTINGS_NOT_FOUND", message: "Developer settings not found" } });
        }
        if (error instanceof DraftQuotationAlreadyExistsError) {
          return reply.code(409).send({ error: { code: "DRAFT_QUOTATION_EXISTS", message: "A draft quotation already exists for this project" } });
        }
        if (error instanceof CalculationDataInvalidError || error instanceof QuotationDataInvalidError || error instanceof RangeError) {
          return reply.code(422).send({ error: { code: "QUOTATION_INVALID", message: "Project cannot be quoted with its current data" } });
        }
        throw error;
      }
    },
  };
}

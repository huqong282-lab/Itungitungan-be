import type { CalculationService } from "../calculations/service.js";
import type { QuotationRepositoryPort } from "./repository.js";
import { QuotationProjectNotFoundError } from "./types.js";

export function createQuotationService(repository: QuotationRepositoryPort, calculationService: CalculationService) {
  return {
    async createDraftQuotation(userId: string, projectId: string) {
      const calculation = await calculationService.calculateProjectSnapshot(userId, projectId, {});
      const quotation = await repository.createDraftQuotation(projectId, userId, calculation);
      if (!quotation) throw new QuotationProjectNotFoundError();
      return quotation;
    },
  };
}

export type QuotationService = ReturnType<typeof createQuotationService>;

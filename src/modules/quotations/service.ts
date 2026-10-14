import type { CalculationService } from "../calculations/service.js";
import type { QuotationRepositoryPort } from "./repository.js";
import { QuotationFinalizedError, QuotationNotFoundError, QuotationProjectNotFoundError } from "./types.js";

export function createQuotationService(repository: QuotationRepositoryPort, calculationService: CalculationService) {
  return {
    async createDraftQuotation(userId: string, projectId: string) {
      const calculation = await calculationService.calculateProjectSnapshot(userId, projectId, {});
      const quotation = await repository.createDraftQuotation(projectId, userId, calculation);
      if (!quotation) throw new QuotationProjectNotFoundError();
      return quotation;
    },
    async recalculateDraftQuotation(userId: string, quotationId: string) {
      const target = await repository.findQuotationForRecalculation(quotationId, userId);
      if (!target) throw new QuotationNotFoundError();
      if (target.status === "FINAL") throw new QuotationFinalizedError();
      const calculation = await calculationService.calculateProjectSnapshot(userId, target.projectId, {});
      const quotation = await repository.recalculateDraftQuotation(quotationId, userId, calculation);
      if (!quotation) throw new QuotationNotFoundError();
      return quotation;
    },
  };
}

export type QuotationService = ReturnType<typeof createQuotationService>;

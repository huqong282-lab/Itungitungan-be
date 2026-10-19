import type { CalculationService } from "../calculations/service.js";
import type { QuotationRepositoryPort } from "./repository.js";
import type { FinalizedQuotation, QuotationDetail, QuotationListQuery, QuotationListResult } from "./types.js";
import { QuotationDetailNotFoundError, QuotationFinalizedError, QuotationNotFoundError, QuotationProjectFilterNotFoundError, QuotationProjectNotFoundError } from "./types.js";

export function createQuotationService(repository: QuotationRepositoryPort, calculationService: CalculationService) {
  return {
    async listQuotations(userId: string, query: QuotationListQuery): Promise<QuotationListResult> {
      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? 20;
      if (query.projectId && !await repository.findOwnedProject(query.projectId, userId)) {
        throw new QuotationProjectFilterNotFoundError();
      }
      const resolved = { ...query, page, pageSize, sort: query.sort ?? "createdAt", order: query.order ?? "desc" };
      const { data, total } = await repository.listByUserId(userId, resolved);
      return {
        data,
        meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      };
    },
    async finalizeQuotation(userId: string, quotationId: string): Promise<FinalizedQuotation> {
      const quotation = await repository.finalizeDraftQuotation(quotationId, userId);
      if (!quotation) throw new QuotationNotFoundError();
      return quotation;
    },
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
    async getQuotationDetail(userId: string, quotationId: string): Promise<QuotationDetail> {
      const quotation = await repository.findQuotationDetail(quotationId, userId);
      if (!quotation) throw new QuotationDetailNotFoundError();
      return {
        header: {
          id: quotation.id,
          quotationNumber: quotation.quotationNumber,
          version: quotation.version,
          status: quotation.status,
          clientName: quotation.clientNameSnapshot,
          projectName: quotation.projectNameSnapshot,
          logoUrl: quotation.logoUrlSnapshot,
          deadline: quotation.deadlineSnapshot?.toISOString() ?? null,
          developerRate: quotation.developerRateSnapshot,
          finalizedAt: quotation.finalizedAt?.toISOString() ?? null,
          createdAt: quotation.createdAt.toISOString(),
          updatedAt: quotation.updatedAt.toISOString(),
        },
        features: quotation.features.map((feature) => ({
          name: feature.featureNameSnapshot,
          baseHours: feature.baseHoursSnapshot,
          estimatedHours: feature.estimatedHours,
          developerRate: feature.developerRateSnapshot,
          developmentCost: feature.developmentCost,
          selections: feature.selections.map((selection) => ({
            optionName: selection.optionNameSnapshot,
            valueLabel: selection.valueLabelSnapshot,
            hours: selection.hoursSnapshot,
          })),
        })),
        design: quotation.design ? { name: quotation.design.nameSnapshot, price: quotation.design.priceSnapshot } : null,
        hostings: quotation.hostings.map((hosting) => ({
          label: hosting.labelSnapshot,
          provider: hosting.providerSnapshot,
          plan: hosting.planSnapshot,
          internalCost: hosting.internalCostSnapshot,
          clientPrice: hosting.clientPriceSnapshot,
          clientProvided: hosting.clientProvided,
          billingPeriod: hosting.billingPeriodSnapshot,
        })),
        maintenances: quotation.maintenances.map((maintenance) => ({
          name: maintenance.nameSnapshot,
          price: maintenance.priceSnapshot,
          billingPeriod: maintenance.billingPeriodSnapshot,
        })),
        timeline: {
          estimatedHours: quotation.developmentHours,
          bufferPercentage: quotation.bufferPercentage.toNumber(),
          bufferedHours: quotation.bufferedHours,
          workingHoursPerDay: quotation.workingHoursPerDaySnapshot,
          workingDays: quotation.workingDays,
        },
        pricing: {
          developmentCost: quotation.developmentCost,
          designCost: quotation.designCost,
          hostingCost: quotation.hostingCost,
          maintenanceCost: quotation.maintenanceCost,
          subtotal: quotation.subtotal,
          marginPercentage: quotation.marginPercentage.toNumber(),
          marginAmount: quotation.marginAmount,
          rushFeePercentage: quotation.rushFeePercentage.toNumber(),
          rushFeeAmount: quotation.rushFeeAmount,
          finalPrice: quotation.finalPrice,
        },
        revisionPolicy: {
          freeRevisionCount: quotation.freeRevisionCount,
          additionalRevisionPrice: quotation.additionalRevisionPrice,
        },
      };
    },
  };
}

export type QuotationService = ReturnType<typeof createQuotationService>;

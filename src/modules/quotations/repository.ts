import { Prisma, QuotationStatus, type PrismaClient } from "../../generated/prisma/client.js";
import type { CreateDraftQuotationInput, CreatedQuotation } from "./types.js";
import { DraftQuotationAlreadyExistsError, QuotationDataInvalidError } from "./types.js";

const QUOTATION_NUMBER_LOCK_ID = 781_234_567;
const quotationResponseSelect = {
  id: true,
  quotationNumber: true,
  version: true,
  status: true,
  finalPrice: true,
  workingDays: true,
  createdAt: true,
} as const;

export function createQuotationRepository(prisma: PrismaClient) {
  return {
    async createDraftQuotation(projectId: string, userId: string, input: CreateDraftQuotationInput): Promise<CreatedQuotation | null> {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          return await prisma.$transaction(async (transaction) => {
        // Serialize numbering and draft checks across app instances, not just requests in one process.
        await transaction.$queryRaw`SELECT pg_advisory_xact_lock(${QUOTATION_NUMBER_LOCK_ID}::bigint) IS NULL AS locked`;

        const project = await transaction.project.findFirst({
          where: { id: projectId, userId },
          select: { id: true },
        });
        if (!project) return null;

        const existingDraft = await transaction.quotation.findFirst({
          where: { projectId, status: QuotationStatus.DRAFT },
          select: { id: true },
        });
        if (existingDraft) throw new DraftQuotationAlreadyExistsError();

        const projectVersions = await transaction.quotation.findMany({
          where: { projectId },
          select: { version: true },
        });
        const version = projectVersions.reduce((max, quotation) => Math.max(max, quotation.version), 0) + 1;
        if (!Number.isSafeInteger(version) || version < 1 || version > 2_147_483_647) {
          throw new QuotationDataInvalidError();
        }

        const existingNumbers = await transaction.quotation.findMany({ select: { quotationNumber: true } });
        const nextNumber = existingNumbers.reduce((max, quotation) => {
          const match = /^QT-(\d+)$/.exec(quotation.quotationNumber);
          if (!match) throw new QuotationDataInvalidError();
          const number = Number(match[1]);
          if (!Number.isSafeInteger(number) || number < 1) throw new QuotationDataInvalidError();
          return Math.max(max, number);
        }, 0) + 1;
        if (!Number.isSafeInteger(nextNumber)) throw new QuotationDataInvalidError();
        const quotationNumber = `QT-${String(nextNumber).padStart(6, "0")}`;
        const { calculation, snapshot } = input;

        const created = await transaction.quotation.create({
          data: {
            projectId,
            quotationNumber,
            version,
            status: QuotationStatus.DRAFT,
            clientNameSnapshot: snapshot.clientName,
            projectNameSnapshot: snapshot.projectName,
            logoUrlSnapshot: snapshot.logoUrl,
            deadlineSnapshot: snapshot.deadline,
            developerRateSnapshot: snapshot.developerRate,
            workingHoursPerDaySnapshot: snapshot.workingHoursPerDay,
            developmentHours: calculation.estimatedHours,
            bufferPercentage: calculation.bufferPercentage,
            bufferedHours: calculation.bufferedHours,
            workingDays: calculation.workingDays,
            developmentCost: calculation.developmentCost,
            designCost: calculation.designCost,
            hostingCost: calculation.hostingCost,
            maintenanceCost: calculation.maintenanceCost,
            subtotal: calculation.subtotal,
            marginPercentage: calculation.marginPercentage,
            marginAmount: calculation.marginAmount,
            rushFeePercentage: calculation.rushFeePercentage,
            rushFeeAmount: calculation.rushFeeAmount,
            freeRevisionCount: calculation.revisionPolicy.freeRevisionCount,
            additionalRevisionPrice: calculation.revisionPolicy.additionalRevisionPrice,
            finalPrice: calculation.finalPrice,
            features: {
              create: snapshot.features.map((feature) => ({
                featureNameSnapshot: feature.name,
                baseHoursSnapshot: feature.baseHours,
                estimatedHours: feature.estimatedHours,
                developerRateSnapshot: snapshot.developerRate,
                developmentCost: feature.developmentCost,
                selections: {
                  create: feature.selections.map((selection) => ({
                    optionNameSnapshot: selection.optionName,
                    valueLabelSnapshot: selection.valueLabel,
                    hoursSnapshot: selection.hours,
                  })),
                },
              })),
            },
            ...(snapshot.design && {
              design: { create: { nameSnapshot: snapshot.design.name, priceSnapshot: snapshot.design.price } },
            }),
            hostings: {
              create: snapshot.hostings.map((hosting) => ({
                labelSnapshot: hosting.label,
                providerSnapshot: hosting.provider,
                planSnapshot: hosting.plan,
                internalCostSnapshot: hosting.internalCost,
                clientPriceSnapshot: hosting.clientPrice,
                clientProvided: hosting.clientProvided,
                billingPeriodSnapshot: hosting.billingPeriod,
              })),
            },
            maintenances: {
              create: snapshot.maintenances.map((maintenance) => ({
                nameSnapshot: maintenance.name,
                priceSnapshot: maintenance.price,
                billingPeriodSnapshot: maintenance.billingPeriod,
              })),
            },
          },
          select: quotationResponseSelect,
        });
        if (created.status !== QuotationStatus.DRAFT) throw new QuotationDataInvalidError();
        return { ...created, status: "DRAFT" as const };
          }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
        } catch (error) {
          if (!isRetryableWriteConflict(error) || attempt === 2) throw error;
        }
      }
      throw new QuotationDataInvalidError();
    },
  };
}

function isRetryableWriteConflict(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("code" in error)) return false;
  return error.code === "P2034" || error.code === "P2002";
}

export type QuotationRepository = ReturnType<typeof createQuotationRepository>;
export type QuotationRepositoryPort = Pick<QuotationRepository, "createDraftQuotation">;

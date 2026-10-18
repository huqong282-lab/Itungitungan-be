import { Prisma, QuotationStatus, type PrismaClient } from "../../generated/prisma/client.js";
import type { CreateDraftQuotationInput, CreatedQuotation } from "./types.js";
import { DraftQuotationAlreadyExistsError, QuotationDataInvalidError, QuotationFinalizedError } from "./types.js";

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
    async findQuotationDetail(quotationId: string, userId: string) {
      return prisma.quotation.findFirst({
        where: { id: quotationId, project: { userId } },
        select: {
          id: true,
          quotationNumber: true,
          version: true,
          status: true,
          clientNameSnapshot: true,
          projectNameSnapshot: true,
          logoUrlSnapshot: true,
          deadlineSnapshot: true,
          developerRateSnapshot: true,
          workingHoursPerDaySnapshot: true,
          developmentHours: true,
          bufferPercentage: true,
          bufferedHours: true,
          workingDays: true,
          developmentCost: true,
          designCost: true,
          hostingCost: true,
          maintenanceCost: true,
          subtotal: true,
          marginPercentage: true,
          marginAmount: true,
          rushFeePercentage: true,
          rushFeeAmount: true,
          freeRevisionCount: true,
          additionalRevisionPrice: true,
          finalPrice: true,
          finalizedAt: true,
          createdAt: true,
          updatedAt: true,
          features: {
            select: {
              featureNameSnapshot: true,
              baseHoursSnapshot: true,
              estimatedHours: true,
              developerRateSnapshot: true,
              developmentCost: true,
              selections: {
                select: {
                  optionNameSnapshot: true,
                  valueLabelSnapshot: true,
                  hoursSnapshot: true,
                },
              },
            },
          },
          design: { select: { nameSnapshot: true, priceSnapshot: true } },
          hostings: {
            select: {
              labelSnapshot: true,
              providerSnapshot: true,
              planSnapshot: true,
              internalCostSnapshot: true,
              clientPriceSnapshot: true,
              clientProvided: true,
              billingPeriodSnapshot: true,
            },
          },
          maintenances: {
            select: {
              nameSnapshot: true,
              priceSnapshot: true,
              billingPeriodSnapshot: true,
            },
          },
        },
      });
    },
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
        const created = await transaction.quotation.create({
          data: {
            projectId,
            quotationNumber,
            version,
            status: QuotationStatus.DRAFT,
            ...snapshotData(input),
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
    async findQuotationForRecalculation(quotationId: string, userId: string): Promise<{ projectId: string; status: "DRAFT" | "FINAL" } | null> {
      const quotation = await prisma.quotation.findFirst({
        where: { id: quotationId, project: { userId } },
        select: { projectId: true, status: true },
      });
      return quotation ? { projectId: quotation.projectId, status: quotation.status } : null;
    },
    async recalculateDraftQuotation(quotationId: string, userId: string, input: CreateDraftQuotationInput): Promise<CreatedQuotation | null> {
      return prisma.$transaction(async (transaction) => {
        const quotation = await transaction.quotation.findFirst({
          where: { id: quotationId, project: { userId } },
          select: { id: true, projectId: true, status: true },
        });
        if (!quotation) return null;
        if (quotation.status === QuotationStatus.FINAL) throw new QuotationFinalizedError();
        const data = snapshotData(input);

        const updated = await transaction.quotation.update({
          where: { id: quotation.id },
          data: {
            ...data,
            features: { deleteMany: {}, create: data.features.create },
            design: {
              ...(input.snapshot.design ? { upsert: { create: data.design!.create, update: data.design!.create } } : { delete: {} }),
            },
            hostings: { deleteMany: {}, create: data.hostings.create },
            maintenances: { deleteMany: {}, create: data.maintenances.create },
          },
          select: quotationResponseSelect,
        });
        if (updated.status !== QuotationStatus.DRAFT) throw new QuotationDataInvalidError();
        return { ...updated, status: "DRAFT" as const };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    },
  };
}

function isRetryableWriteConflict(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("code" in error)) return false;
  return error.code === "P2034" || error.code === "P2002";
}

export type QuotationRepository = ReturnType<typeof createQuotationRepository>;
export type QuotationRepositoryPort = Pick<QuotationRepository, "createDraftQuotation" | "findQuotationForRecalculation" | "recalculateDraftQuotation" | "findQuotationDetail">;

function snapshotData(input: CreateDraftQuotationInput) {
  const { calculation, snapshot } = input;
  return {
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
        selections: { create: feature.selections.map((selection) => ({
          optionNameSnapshot: selection.optionName,
          valueLabelSnapshot: selection.valueLabel,
          hoursSnapshot: selection.hours,
        })) },
      })),
    },
    ...(snapshot.design ? { design: { create: { nameSnapshot: snapshot.design.name, priceSnapshot: snapshot.design.price } } } : {}),
    hostings: { create: snapshot.hostings.map((hosting) => ({
      labelSnapshot: hosting.label,
      providerSnapshot: hosting.provider,
      planSnapshot: hosting.plan,
      internalCostSnapshot: hosting.internalCost,
      clientPriceSnapshot: hosting.clientPrice,
      clientProvided: hosting.clientProvided,
      billingPeriodSnapshot: hosting.billingPeriod,
    })) },
    maintenances: { create: snapshot.maintenances.map((maintenance) => ({
      nameSnapshot: maintenance.name,
      priceSnapshot: maintenance.price,
      billingPeriodSnapshot: maintenance.billingPeriod,
    })) },
  };
}

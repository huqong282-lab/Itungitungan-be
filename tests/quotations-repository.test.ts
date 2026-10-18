import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "../src/generated/prisma/client.js";
import { createQuotationRepository } from "../src/modules/quotations/repository.js";
import type { CreateDraftQuotationInput, CreatedQuotation } from "../src/modules/quotations/types.js";
import { DraftQuotationAlreadyExistsError } from "../src/modules/quotations/types.js";

const input: CreateDraftQuotationInput = {
  calculation: {
    estimatedHours: 44,
    bufferPercentage: 20,
    bufferedHours: 53,
    workingHoursPerDay: 8,
    workingDays: 7,
    deadline: null,
    deadlineStatus: "NORMAL",
    developmentCost: 4_400_000,
    designCost: 1_000_000,
    hostingCost: 200_000,
    maintenanceCost: 500_000,
    subtotal: 6_100_000,
    marginPercentage: 30,
    marginAmount: 1_830_000,
    rushFeePercentage: 0,
    rushFeeAmount: 0,
    finalPrice: 7_930_000,
    revisionPolicy: { freeRevisionCount: 2, additionalRevisionPrice: 200_000 },
  },
  snapshot: {
    clientName: "Client A",
    projectName: "Website",
    logoUrl: null,
    deadline: null,
    developerRate: 100_000,
    workingHoursPerDay: 8,
    features: [{ name: "Authentication", baseHours: 40, estimatedHours: 44, developmentCost: 4_400_000, selections: [{ optionName: "Provider", valueLabel: "Custom", hours: 4 }] }],
    design: { name: "Premium UI", price: 1_000_000 },
    hostings: [{ label: "Production", provider: "Cloud", plan: "VPS", internalCost: 150_000, clientPrice: 200_000, clientProvided: false, billingPeriod: "MONTHLY" }],
    maintenances: [{ name: "Monthly maintenance", price: 500_000, billingPeriod: "MONTHLY" }],
  },
};

const result: CreatedQuotation = {
  id: "quotation-a",
  quotationNumber: "QT-000005",
  version: 3,
  status: "DRAFT",
  finalPrice: 7_930_000,
  workingDays: 7,
  createdAt: new Date("2026-10-14T00:00:00.000Z"),
};

function createRepository(options: { hasDraft?: boolean; failCreate?: boolean; writeConflicts?: number } = {}) {
  let committed = false;
  let transactionAttempts = 0;
  const transaction = {
    $queryRaw: vi.fn(async () => []),
    project: { findFirst: vi.fn(async () => ({ id: "project-a" })) },
    quotation: {
      findFirst: vi.fn(async () => options.hasDraft ? ({ id: "draft-a" }) : null),
      findMany: vi.fn(async (args: { where?: { projectId?: string } }) => args.where?.projectId
        ? [{ version: 1 }, { version: 2 }]
        : [{ quotationNumber: "QT-000004" }]),
      create: vi.fn(async () => {
        if (options.failCreate) throw new Error("database write failed");
        return result;
      }),
    },
  };
  const prisma = {
    $transaction: vi.fn(async (callback: (tx: typeof transaction) => Promise<CreatedQuotation | null>) => {
      transactionAttempts += 1;
      if (transactionAttempts <= (options.writeConflicts ?? 0)) throw { code: "P2034" };
      const value = await callback(transaction);
      committed = true;
      return value;
    }),
  } as unknown as PrismaClient;
  return { repository: createQuotationRepository(prisma), transaction, isCommitted: () => committed, getAttempts: () => transactionAttempts };
}

describe("quotation repository", () => {
  it("queries only saved quotation snapshot fields with ownership through the project", async () => {
    const findFirst = vi.fn(async () => ({ id: "quotation-a", features: [] }));
    const prisma = { quotation: { findFirst } } as unknown as PrismaClient;
    const repository = createQuotationRepository(prisma);

    await expect(repository.findQuotationDetail("quotation-a", "user-a")).resolves.toEqual({ id: "quotation-a", features: [] });
    expect(findFirst).toHaveBeenCalledOnce();
    const args = findFirst.mock.calls[0]?.[0];
    expect(args.where).toEqual({ id: "quotation-a", project: { userId: "user-a" } });
    expect(args.select).toMatchObject({
      clientNameSnapshot: true,
      projectNameSnapshot: true,
      features: { select: { featureNameSnapshot: true, selections: { select: { optionNameSnapshot: true, valueLabelSnapshot: true, hoursSnapshot: true } } } },
      design: { select: { nameSnapshot: true, priceSnapshot: true } },
      hostings: { select: { labelSnapshot: true, clientPriceSnapshot: true } },
      maintenances: { select: { nameSnapshot: true, priceSnapshot: true } },
    });
    expect(args.select.features.select).not.toHaveProperty("feature");
    expect(args.select.design.select).not.toHaveProperty("design");
    expect(args.select.hostings.select).not.toHaveProperty("hostingPlan");
    expect(args.select.maintenances.select).not.toHaveProperty("maintenancePlan");
  });

  it("writes the DRAFT snapshot atomically and assigns next version and QT number", async () => {
    const { repository, transaction } = createRepository();

    await expect(repository.createDraftQuotation("project-a", "user-a", input)).resolves.toEqual(result);
    expect(transaction.$queryRaw).toHaveBeenCalledOnce();
    expect(transaction.project.findFirst).toHaveBeenCalledWith({ where: { id: "project-a", userId: "user-a" }, select: { id: true } });
    expect(transaction.quotation.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        quotationNumber: "QT-000005",
        version: 3,
        status: "DRAFT",
        developmentHours: 44,
        bufferedHours: 53,
        finalPrice: 7_930_000,
        features: { create: [expect.objectContaining({
          featureNameSnapshot: "Authentication",
          estimatedHours: 44,
          selections: { create: [{ optionNameSnapshot: "Provider", valueLabelSnapshot: "Custom", hoursSnapshot: 4 }] },
        })] },
        design: { create: { nameSnapshot: "Premium UI", priceSnapshot: 1_000_000 } },
        hostings: { create: [expect.objectContaining({ labelSnapshot: "Production", clientPriceSnapshot: 200_000 })] },
        maintenances: { create: [{ nameSnapshot: "Monthly maintenance", priceSnapshot: 500_000, billingPeriodSnapshot: "MONTHLY" }] },
      }),
    }));
  });

  it("rejects creation when a DRAFT already exists", async () => {
    const { repository, transaction } = createRepository({ hasDraft: true });

    await expect(repository.createDraftQuotation("project-a", "user-a", input)).rejects.toBeInstanceOf(DraftQuotationAlreadyExistsError);
    expect(transaction.quotation.create).not.toHaveBeenCalled();
  });

  it("does not commit when the atomic quotation write fails", async () => {
    const { repository, isCommitted } = createRepository({ failCreate: true });

    await expect(repository.createDraftQuotation("project-a", "user-a", input)).rejects.toThrow("database write failed");
    expect(isCommitted()).toBe(false);
  });

  it("retries a serializable transaction conflict before allocating the next number", async () => {
    const { repository, transaction, getAttempts } = createRepository({ writeConflicts: 1 });

    await expect(repository.createDraftQuotation("project-a", "user-a", input)).resolves.toEqual(result);
    expect(getAttempts()).toBe(2);
    expect(transaction.quotation.create).toHaveBeenCalledOnce();
  });

  it("atomically replaces snapshot data while retaining quotation identity and version", async () => {
    const updated = { ...result, quotationNumber: "QT-000001", version: 1 };
    const transaction = {
      quotation: {
        findFirst: vi.fn(async () => ({ id: "quotation-a", projectId: "project-a", status: "DRAFT" })),
        update: vi.fn(async () => updated),
      },
    };
    const prisma = {
      quotation: { findFirst: vi.fn(async () => ({ projectId: "project-a", status: "DRAFT" })) },
      $transaction: vi.fn(async (callback: (tx: typeof transaction) => Promise<CreatedQuotation | null>) => callback(transaction)),
    } as unknown as PrismaClient;
    const repository = createQuotationRepository(prisma);

    await expect(repository.findQuotationForRecalculation("quotation-a", "user-a")).resolves.toEqual({ projectId: "project-a", status: "DRAFT" });
    await expect(repository.recalculateDraftQuotation("quotation-a", "user-a", input)).resolves.toEqual(updated);
    expect(transaction.quotation.findFirst).toHaveBeenCalledWith({
      where: { id: "quotation-a", project: { userId: "user-a" } },
      select: { id: true, projectId: true, status: true },
    });
    const updateArgs = transaction.quotation.update.mock.calls[0]?.[0];
    expect(updateArgs).toMatchObject({
      where: { id: "quotation-a" },
      data: {
        developmentHours: 44,
        bufferedHours: 53,
        finalPrice: 7_930_000,
        features: { deleteMany: {}, create: [{
          featureNameSnapshot: "Authentication",
          baseHoursSnapshot: 40,
          estimatedHours: 44,
          developerRateSnapshot: 100_000,
          developmentCost: 4_400_000,
          selections: { create: [{ optionNameSnapshot: "Provider", valueLabelSnapshot: "Custom", hoursSnapshot: 4 }] },
        }] },
      },
    });
    expect(updateArgs.data).not.toHaveProperty("quotationNumber");
    expect(updateArgs.data).not.toHaveProperty("version");
    expect(updateArgs.data).not.toHaveProperty("projectId");
  });

  it("does not update FINAL quotations", async () => {
    const transaction = {
      quotation: {
        findFirst: vi.fn(async () => ({ id: "quotation-a", projectId: "project-a", status: "FINAL" })),
        update: vi.fn(async () => result),
      },
    };
    const prisma = { $transaction: vi.fn(async (callback: (tx: typeof transaction) => Promise<CreatedQuotation | null>) => callback(transaction)) } as unknown as PrismaClient;
    const repository = createQuotationRepository(prisma);
    await expect(repository.recalculateDraftQuotation("quotation-a", "user-a", input)).rejects.toThrow("Final quotations cannot be modified.");
    expect(transaction.quotation.update).not.toHaveBeenCalled();
  });

  it("does not commit when snapshot replacement fails", async () => {
    let committed = false;
    const transaction = {
      quotation: {
        findFirst: vi.fn(async () => ({ id: "quotation-a", projectId: "project-a", status: "DRAFT" })),
        update: vi.fn(async () => { throw new Error("snapshot write failed"); }),
      },
    };
    const prisma = { $transaction: vi.fn(async (callback: (tx: typeof transaction) => Promise<CreatedQuotation | null>) => {
      const value = await callback(transaction);
      committed = true;
      return value;
    }) } as unknown as PrismaClient;
    const repository = createQuotationRepository(prisma);
    await expect(repository.recalculateDraftQuotation("quotation-a", "user-a", input)).rejects.toThrow("snapshot write failed");
    expect(committed).toBe(false);
  });
});

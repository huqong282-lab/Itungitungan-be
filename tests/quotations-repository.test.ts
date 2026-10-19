import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "../src/generated/prisma/client.js";
import { createQuotationRepository } from "../src/modules/quotations/repository.js";
import type { CreateDraftQuotationInput, CreatedQuotation } from "../src/modules/quotations/types.js";
import { DraftQuotationAlreadyExistsError, QuotationFinalizedError } from "../src/modules/quotations/types.js";

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
  it("conditionally finalizes only an owned DRAFT and changes no snapshot fields", async () => {
    const updateManyAndReturn = vi.fn(async () => [{ id: "quotation-a", quotationNumber: "QT-000001", version: 1, status: "FINAL", finalizedAt: new Date("2026-10-19T00:00:00.000Z") }]);
    const findFirst = vi.fn(async () => null);
    const repository = createQuotationRepository({ quotation: { updateManyAndReturn, findFirst } } as unknown as PrismaClient);

    await expect(repository.finalizeDraftQuotation("quotation-a", "user-a")).resolves.toEqual({
      id: "quotation-a", quotationNumber: "QT-000001", version: 1, status: "FINAL", finalizedAt: expect.any(Date),
    });
    expect(updateManyAndReturn).toHaveBeenCalledWith({
      where: { id: "quotation-a", status: "DRAFT", project: { userId: "user-a" } },
      data: { status: "FINAL", finalizedAt: expect.any(Date) },
      select: { id: true, quotationNumber: true, version: true, status: true, finalizedAt: true },
    });
    const updateData = updateManyAndReturn.mock.calls[0]?.[0].data;
    expect(Object.keys(updateData).sort()).toEqual(["finalizedAt", "status"]);
    expect(findFirst).not.toHaveBeenCalled();
  });

  it("masks foreign and missing quotations as not found", async () => {
    const updateManyAndReturn = vi.fn(async () => []);
    const findFirst = vi.fn(async () => null);
    const repository = createQuotationRepository({ quotation: { updateManyAndReturn, findFirst } } as unknown as PrismaClient);

    await expect(repository.finalizeDraftQuotation("foreign-or-missing", "user-a")).resolves.toBeNull();
    expect(findFirst).toHaveBeenCalledWith({ where: { id: "foreign-or-missing", project: { userId: "user-a" } }, select: { status: true } });
  });

  it("rejects an already FINAL quotation without issuing another write", async () => {
    const updateManyAndReturn = vi.fn(async () => []);
    const findFirst = vi.fn(async () => ({ status: "FINAL" }));
    const repository = createQuotationRepository({ quotation: { updateManyAndReturn, findFirst } } as unknown as PrismaClient);

    await expect(repository.finalizeDraftQuotation("quotation-a", "user-a")).rejects.toBeInstanceOf(QuotationFinalizedError);
    expect(updateManyAndReturn).toHaveBeenCalledOnce();
    expect(findFirst).toHaveBeenCalledOnce();
  });

  it("persists a single finalization under concurrent requests and rejects the competing request", async () => {
    const persisted = {
      id: "quotation-a", quotationNumber: "QT-000001", version: 1, status: "DRAFT" as "DRAFT" | "FINAL",
      finalizedAt: null as Date | null, finalPrice: 7_930_000, clientNameSnapshot: "Client A", projectNameSnapshot: "Website",
    };
    const updateManyAndReturn = vi.fn(async (args: { data: { status: "FINAL"; finalizedAt: Date } }) => {
      if (persisted.status !== "DRAFT") return [];
      persisted.status = args.data.status;
      persisted.finalizedAt = args.data.finalizedAt;
      return [{ id: persisted.id, quotationNumber: persisted.quotationNumber, version: persisted.version, status: persisted.status, finalizedAt: persisted.finalizedAt }];
    });
    const findFirst = vi.fn(async () => ({ status: persisted.status }));
    const repository = createQuotationRepository({ quotation: { updateManyAndReturn, findFirst } } as unknown as PrismaClient);

    const results = await Promise.allSettled([
      repository.finalizeDraftQuotation("quotation-a", "user-a"),
      repository.finalizeDraftQuotation("quotation-a", "user-a"),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    expect(persisted).toMatchObject({ status: "FINAL", finalPrice: 7_930_000, clientNameSnapshot: "Client A", projectNameSnapshot: "Website" });
    expect(persisted.finalizedAt).toBeInstanceOf(Date);
  });

  it("lists snapshot summaries with ownership in both rows and count and deterministic sorting", async () => {
    const findMany = vi.fn(async () => [{
      id: "quotation-a", quotationNumber: "QT-000001", projectId: "project-a", version: 1, status: "FINAL",
      clientNameSnapshot: "Client", projectNameSnapshot: "Website", finalPrice: 1000, createdAt: new Date("2026-01-01T00:00:00.000Z"),
    }]);
    const count = vi.fn(async () => 1);
    const projectFindFirst = vi.fn(async () => ({ id: "project-a" }));
    const repository = createQuotationRepository({ quotation: { findMany, count }, project: { findFirst: projectFindFirst } } as unknown as PrismaClient);
    const query = { page: 2, pageSize: 10, search: "Client", status: "FINAL" as const, projectId: "project-a", sort: "finalPrice" as const, order: "asc" as const };

    await expect(repository.findOwnedProject("project-a", "user-a")).resolves.toEqual({ id: "project-a" });
    const result = await repository.listByUserId("user-a", query);

    expect(result.total).toBe(1);
    expect(result.data).toEqual([{ id: "quotation-a", quotationNumber: "QT-000001", projectId: "project-a", version: 1, status: "FINAL", clientName: "Client", projectName: "Website", finalPrice: 1000, createdAt: new Date("2026-01-01T00:00:00.000Z") }]);
    expect(projectFindFirst).toHaveBeenCalledWith({ where: { id: "project-a", userId: "user-a" }, select: { id: true } });
    const args = findMany.mock.calls[0]?.[0];
    expect(args.where).toEqual({
      project: { userId: "user-a" }, projectId: "project-a", status: "FINAL",
      OR: [
        { quotationNumber: { contains: "Client", mode: "insensitive" } },
        { clientNameSnapshot: { contains: "Client", mode: "insensitive" } },
        { projectNameSnapshot: { contains: "Client", mode: "insensitive" } },
      ],
    });
    expect(args.orderBy).toEqual([{ finalPrice: "asc" }, { id: "asc" }]);
    expect(args.skip).toBe(10);
    expect(args.take).toBe(10);
    expect(args.select).not.toHaveProperty("project");
    expect(count).toHaveBeenCalledWith({ where: args.where });
  });

  it("keeps empty search out of the database filter and sorts by creation time by default at the service layer", async () => {
    const findMany = vi.fn(async () => []);
    const count = vi.fn(async () => 0);
    const repository = createQuotationRepository({ quotation: { findMany, count } } as unknown as PrismaClient);
    await repository.listByUserId("user-a", { page: 1, pageSize: 20, search: "   ", sort: "createdAt", order: "desc" });
    expect(findMany.mock.calls[0]?.[0].where).toEqual({ project: { userId: "user-a" } });
    expect(findMany.mock.calls[0]?.[0].orderBy).toEqual([{ createdAt: "desc" }, { id: "desc" }]);
  });

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

  it("creates the next version from current project data while preserving the FINAL version", async () => {
    const previousFinal = {
      id: "quotation-v2",
      projectId: "project-a",
      quotationNumber: "QT-000004",
      version: 2,
      status: "FINAL",
      clientNameSnapshot: "Previous Client",
      projectNameSnapshot: "Previous Website",
      finalPrice: 6_500_000,
      finalizedAt: new Date("2026-10-10T00:00:00.000Z"),
      snapshot: { featureNameSnapshot: "Old Feature", priceSnapshot: 600_000 },
    };
    const originalFinal = structuredClone(previousFinal);
    const stored = [previousFinal];
    const transaction = {
      $queryRaw: vi.fn(async () => []),
      project: { findFirst: vi.fn(async () => ({ id: "project-a" })) },
      quotation: {
        findFirst: vi.fn(async () => null),
        findMany: vi.fn(async (args: { where?: { projectId?: string } }) => args.where?.projectId
          ? stored.map(({ version }) => ({ version }))
          : stored.map(({ quotationNumber }) => ({ quotationNumber }))),
        create: vi.fn(async (args: { data: { projectId: string; quotationNumber: string; version: number; status: string; clientNameSnapshot: string; projectNameSnapshot: string } }) => {
          const next = { ...result, id: "quotation-v3", projectId: args.data.projectId, quotationNumber: args.data.quotationNumber, version: args.data.version, status: "DRAFT" as const };
          stored.push({
            id: next.id,
            projectId: args.data.projectId,
            quotationNumber: args.data.quotationNumber,
            version: args.data.version,
            status: args.data.status,
            clientNameSnapshot: args.data.clientNameSnapshot,
            projectNameSnapshot: args.data.projectNameSnapshot,
            finalPrice: next.finalPrice,
            finalizedAt: null,
            snapshot: { featureNameSnapshot: "Current Feature", priceSnapshot: 1_000_000 },
          });
          return next;
        }),
        update: vi.fn(),
      },
    };
    const prisma = {
      $transaction: vi.fn(async (callback: (tx: typeof transaction) => Promise<CreatedQuotation | null>) => callback(transaction)),
    } as unknown as PrismaClient;
    const repository = createQuotationRepository(prisma);

    const nextVersion = await repository.createDraftQuotation("project-a", "user-a", input);

    expect(nextVersion).toMatchObject({ id: "quotation-v3", quotationNumber: "QT-000005", version: 3, status: "DRAFT" });
    expect(nextVersion?.id).not.toBe(previousFinal.id);
    expect(stored[0]).toEqual(originalFinal);
    expect(stored[1]).toMatchObject({ id: "quotation-v3", version: 3, status: "DRAFT", clientNameSnapshot: "Client A", projectNameSnapshot: "Website" });
    expect(transaction.quotation.update).not.toHaveBeenCalled();
  });

  it("serializes concurrent version creation so only one DRAFT version is created", async () => {
    let lockQueue = Promise.resolve();
    let hasDraft = false;
    const stored = [{ id: "quotation-v1", projectId: "project-a", quotationNumber: "QT-000001", version: 1, status: "FINAL" }];
    const makeTransaction = () => {
      let releaseLock: (() => void) | undefined;
      return {
        $queryRaw: vi.fn(async () => {
          let release!: () => void;
          const previousLock = lockQueue;
          lockQueue = new Promise<void>((resolve) => { release = resolve; });
          await previousLock;
          releaseLock = release;
          return [];
        }),
        project: { findFirst: vi.fn(async () => ({ id: "project-a" })) },
        quotation: {
          findFirst: vi.fn(async () => hasDraft ? ({ id: "quotation-v2" }) : null),
          findMany: vi.fn(async (args: { where?: { projectId?: string } }) => args.where?.projectId
            ? stored.map(({ version }) => ({ version }))
            : stored.map(({ quotationNumber }) => ({ quotationNumber }))),
          create: vi.fn(async (args: { data: { projectId: string; quotationNumber: string; version: number } }) => {
            hasDraft = true;
            const createdVersion = { id: "quotation-v2", ...args.data, status: "DRAFT" };
            stored.push(createdVersion);
            return { ...result, ...createdVersion };
          }),
        },
        release() { releaseLock?.(); },
      };
    };
    const prisma = {
      $transaction: vi.fn(async (callback: (tx: ReturnType<typeof makeTransaction>) => Promise<CreatedQuotation | null>) => {
        const transaction = makeTransaction();
        try {
          return await callback(transaction);
        } finally {
          transaction.release();
        }
      }),
    } as unknown as PrismaClient;
    const repository = createQuotationRepository(prisma);

    const attempts = await Promise.allSettled([
      repository.createDraftQuotation("project-a", "user-a", input),
      repository.createDraftQuotation("project-a", "user-a", input),
    ]);

    expect(attempts.filter((attempt) => attempt.status === "fulfilled")).toHaveLength(1);
    const rejection = attempts.find((attempt) => attempt.status === "rejected");
    expect(rejection?.status).toBe("rejected");
    if (rejection?.status === "rejected") expect(rejection.reason).toBeInstanceOf(DraftQuotationAlreadyExistsError);
    expect(stored).toHaveLength(2);
    expect(stored.map(({ version }) => version)).toEqual([1, 2]);
    expect(stored.map(({ quotationNumber }) => quotationNumber)).toEqual(["QT-000001", "QT-000002"]);
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

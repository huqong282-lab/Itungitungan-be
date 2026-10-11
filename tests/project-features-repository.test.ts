import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "../src/generated/prisma/client.js";
import { createProjectFeatureRepository } from "../src/modules/project-features/repository.js";

describe("project feature repository ownership and transactions", () => {
  it("scopes update and delete to the project, project owner, and feature owner", async () => {
    const updateMany = vi.fn(async () => ({ count: 1 }));
    const findFirst = vi.fn(async () => ({ id: "pf-a" }));
    const deleteMany = vi.fn(async () => ({ count: 1 }));
    const repository = createProjectFeatureRepository({ projectFeature: { updateMany, findFirst, deleteMany } } as unknown as PrismaClient);
    await repository.updateOwned("p-a", "pf-a", "u-a", { overrideHours: 5 });
    await repository.deleteOwned("p-a", "pf-a", "u-a");
    const where = { id: "pf-a", projectId: "p-a", project: { is: { userId: "u-a" } }, feature: { is: { userId: "u-a" } } };
    expect(updateMany).toHaveBeenCalledWith({ where, data: { overrideHours: 5 } });
    expect(deleteMany).toHaveBeenCalledWith({ where });
  });

  it("validates lookup ownership and replaces selections inside one Prisma transaction", async () => {
    const findFirst = vi.fn(async () => ({ id: "pf-a", feature: { options: [{ id: "o-a", selectionType: "SINGLE", values: [{ id: "v-a", isActive: true }] }] } }));
    const pfFindFirst = vi.fn(async () => ({ id: "pf-a" }));
    const deleteMany = vi.fn(async () => ({ count: 0 }));
    const createMany = vi.fn(async () => ({ count: 1 }));
    const selectionFindMany = vi.fn(async () => [{ id: "s-a", projectFeatureId: "pf-a", featureOptionId: "o-a", featureOptionValueId: "v-a", createdAt: new Date(), updatedAt: new Date() }]);
    const transactionClient = { projectFeature: { findFirst: pfFindFirst }, projectFeatureSelection: { deleteMany, createMany, findMany: selectionFindMany } };
    const transaction = vi.fn(async (callback: (tx: typeof transactionClient) => Promise<unknown>) => callback(transactionClient));
    const repository = createProjectFeatureRepository({ projectFeature: { findFirst }, $transaction: transaction } as unknown as PrismaClient);

    const context = await repository.findSelectionContext("u-a", "p-a", "pf-a");
    expect(context?.options).toHaveLength(1);
    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "pf-a", projectId: "p-a", project: { is: { userId: "u-a" } }, feature: { is: { userId: "u-a" } } } }));
    const result = await repository.replaceSelections("u-a", "p-a", "pf-a", [{ featureOptionId: "o-a", featureOptionValueId: "v-a" }]);
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(pfFindFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "pf-a", projectId: "p-a", project: { is: { userId: "u-a" } }, feature: { is: { userId: "u-a" } } } }));
    expect(deleteMany).toHaveBeenCalledWith({ where: { projectFeatureId: "pf-a" } });
    expect(createMany).toHaveBeenCalledWith({ data: [{ projectFeatureId: "pf-a", featureOptionId: "o-a", featureOptionValueId: "v-a" }] });
    expect(result).toHaveLength(1);
  });

  it("propagates transactional failure so Prisma rolls back the replacement", async () => {
    const failure = new Error("insert failed");
    const transactionClient = {
      projectFeature: { findFirst: vi.fn(async () => ({ id: "pf-a" })) },
      projectFeatureSelection: { deleteMany: vi.fn(async () => ({ count: 1 })), createMany: vi.fn(async () => { throw failure; }), findMany: vi.fn() },
    };
    const transaction = vi.fn(async (callback: (tx: typeof transactionClient) => Promise<unknown>) => callback(transactionClient));
    const repository = createProjectFeatureRepository({ $transaction: transaction } as unknown as PrismaClient);
    await expect(repository.replaceSelections("u-a", "p-a", "pf-a", [{ featureOptionId: "o-a", featureOptionValueId: "v-a" }])).rejects.toBe(failure);
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(transactionClient.projectFeatureSelection.deleteMany).toHaveBeenCalledTimes(1);
    expect(transactionClient.projectFeatureSelection.createMany).toHaveBeenCalledTimes(1);
  });
});

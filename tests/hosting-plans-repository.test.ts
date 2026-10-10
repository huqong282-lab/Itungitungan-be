import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "../src/generated/prisma/client.js";
import { createHostingPlanRepository } from "../src/modules/hosting-plans/repository.js";

describe("hosting plan repository ownership", () => {
  it("filters list and count by session owner and list options", async () => {
    const findMany = vi.fn(async () => []);
    const count = vi.fn(async () => 0);
    const repository = createHostingPlanRepository({ hostingPlan: { findMany, count } } as unknown as PrismaClient);
    await repository.listByUserId("user-a", { page: 2, pageSize: 5, search: "railway", isActive: false });
    const where = { userId: "user-a", isActive: false, OR: [
      { provider: { contains: "railway", mode: "insensitive" } },
      { name: { contains: "railway", mode: "insensitive" } },
    ] };
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where, skip: 5, take: 5 }));
    expect(count).toHaveBeenCalledWith({ where });
  });
  it("scopes get, create, update, and status changes by user", async () => {
    const findFirst = vi.fn(async () => null);
    const create = vi.fn(async () => ({}));
    const updateMany = vi.fn(async () => ({ count: 0 }));
    const repository = createHostingPlanRepository({ hostingPlan: { findFirst, create, updateMany } } as unknown as PrismaClient);
    await repository.findByIdAndUserId("hosting-a", "user-a");
    await repository.createForUser("user-a", { provider: "Railway", name: "Hobby", internalCost: 1, clientPrice: 2, billingPeriod: "MONTHLY" });
    await repository.updateOwned("hosting-a", "user-a", { name: "Updated" });
    await repository.updateStatusOwned("hosting-a", "user-a", { isActive: false });
    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "hosting-a", userId: "user-a" } }));
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: { provider: "Railway", name: "Hobby", internalCost: 1, clientPrice: 2, billingPeriod: "MONTHLY", userId: "user-a" } }));
    expect(updateMany).toHaveBeenNthCalledWith(1, { where: { id: "hosting-a", userId: "user-a" }, data: { name: "Updated" } });
    expect(updateMany).toHaveBeenNthCalledWith(2, { where: { id: "hosting-a", userId: "user-a" }, data: { isActive: false } });
  });
});

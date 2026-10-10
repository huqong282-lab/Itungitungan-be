import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "../src/generated/prisma/client.js";
import { createDesignRepository } from "../src/modules/designs/repository.js";

describe("design repository ownership", () => {
  it("limits list and count to the owner and requested filters", async () => {
    const findMany = vi.fn(async () => []);
    const count = vi.fn(async () => 0);
    const repository = createDesignRepository({ design: { findMany, count } } as unknown as PrismaClient);
    await repository.listByUserId("user-a", { page: 1, pageSize: 10, search: "premium", isActive: true });
    const where = { userId: "user-a", isActive: true, OR: [
      { name: { contains: "premium", mode: "insensitive" } },
      { description: { contains: "premium", mode: "insensitive" } },
    ] };
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where, skip: 0, take: 10 }));
    expect(count).toHaveBeenCalledWith({ where });
  });

  it("scopes read, create, update, and deactivate operations by owner", async () => {
    const findFirst = vi.fn(async () => null);
    const create = vi.fn(async () => ({}));
    const updateMany = vi.fn(async () => ({ count: 0 }));
    const repository = createDesignRepository({ design: { findFirst, create, updateMany } } as unknown as PrismaClient);
    await repository.findByIdAndUserId("design-a", "user-a");
    await repository.createForUser("user-a", { name: "Premium UI", price: 10 });
    await repository.updateOwned("design-a", "user-a", { name: "Updated" });
    await repository.updateStatusOwned("design-a", "user-a", { isActive: false });
    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "design-a", userId: "user-a" } }));
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: { name: "Premium UI", price: 10, userId: "user-a" } }));
    expect(updateMany).toHaveBeenNthCalledWith(1, { where: { id: "design-a", userId: "user-a" }, data: { name: "Updated" } });
    expect(updateMany).toHaveBeenNthCalledWith(2, { where: { id: "design-a", userId: "user-a" }, data: { isActive: false } });
  });
});

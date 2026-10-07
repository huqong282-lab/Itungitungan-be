import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "../src/generated/prisma/client.js";
import { createFeatureRepository } from "../src/modules/features/repository.js";

describe("feature repository ownership", () => {
  it("filters list and count by the session user", async () => {
    const findMany = vi.fn(async () => []);
    const count = vi.fn(async () => 0);
    const repository = createFeatureRepository({ feature: { findMany, count } } as unknown as PrismaClient);

    await repository.listByUserId("user-a", { page: 1, pageSize: 20, isActive: true });

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: "user-a", isActive: true } }));
    expect(count).toHaveBeenCalledWith({ where: { userId: "user-a", isActive: true } });
  });

  it("scopes detail lookup to both feature ID and owner ID", async () => {
    const findFirst = vi.fn(async () => null);
    const repository = createFeatureRepository({ feature: { findFirst } } as unknown as PrismaClient);

    await repository.findByIdAndUserId("feature-b", "user-a");

    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "feature-b", userId: "user-a" } }));
  });

  it("sets ownership on create from the session user", async () => {
    const create = vi.fn(async () => ({}));
    const repository = createFeatureRepository({ feature: { create } } as unknown as PrismaClient);

    await repository.createForUser("user-a", { name: "Payment Gateway" });

    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: { name: "Payment Gateway", userId: "user-a" } }));
  });

  it("scopes both update operations to the owner", async () => {
    const updateMany = vi.fn(async () => ({ count: 0 }));
    const repository = createFeatureRepository({ feature: { updateMany } } as unknown as PrismaClient);

    await repository.updateOwned("feature-b", "user-a", { name: "Changed" });
    await repository.updateStatusOwned("feature-b", "user-a", { isActive: false });

    expect(updateMany).toHaveBeenNthCalledWith(1, { where: { id: "feature-b", userId: "user-a" }, data: { name: "Changed" } });
    expect(updateMany).toHaveBeenNthCalledWith(2, { where: { id: "feature-b", userId: "user-a" }, data: { isActive: false } });
  });
});

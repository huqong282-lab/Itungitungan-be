import { describe, expect, it, vi } from "vitest";
import type { FeatureRepository } from "../src/modules/features/repository.js";
import { createFeatureService } from "../src/modules/features/service.js";
import { FeatureNotFoundError, FeatureOptionNotFoundError } from "../src/modules/features/types.js";

const feature = {
  id: "feature-a",
  name: "Payment Gateway",
  description: "Payment integration",
  category: "Payment",
  baseEstimatedHours: 0,
  isActive: true,
};

describe("feature service ownership", () => {
  it("lists only through the current user's repository scope", async () => {
    const repository = {
      listByUserId: vi.fn(async () => ({ data: [feature], total: 1 })),
    } as unknown as FeatureRepository;
    const service = createFeatureService(repository);

    const result = await service.listFeatures("user-a", { page: 1, pageSize: 20 });

    expect(repository.listByUserId).toHaveBeenCalledWith("user-a", { page: 1, pageSize: 20 });
    expect(result.data).toEqual([feature]);
    expect(result.meta).toEqual({ page: 1, pageSize: 20, total: 1, totalPages: 1 });
  });

  it("returns 404 behavior when an ID is not owned by the current user", async () => {
    const repository = {
      findByIdAndUserId: vi.fn(async () => null),
    } as unknown as FeatureRepository;
    const service = createFeatureService(repository);

    await expect(service.getFeature("user-a", "feature-b")).rejects.toBeInstanceOf(FeatureNotFoundError);
    expect(repository.findByIdAndUserId).toHaveBeenCalledWith("feature-b", "user-a");
  });

  it("uses the session user as the new feature owner", async () => {
    const repository = {
      createForUser: vi.fn(async () => feature),
    } as unknown as FeatureRepository;
    const service = createFeatureService(repository);

    await service.createFeature("user-a", { name: "Payment Gateway" });

    expect(repository.createForUser).toHaveBeenCalledWith("user-a", { name: "Payment Gateway" });
  });

  it("scopes regular and status updates to the current user's feature", async () => {
    const repository = {
      updateOwned: vi.fn(async () => null),
      updateStatusOwned: vi.fn(async () => null),
    } as unknown as FeatureRepository;
    const service = createFeatureService(repository);

    await expect(service.updateFeature("user-a", "feature-b", { name: "Changed" })).rejects.toBeInstanceOf(FeatureNotFoundError);
    await expect(service.updateFeatureStatus("user-a", "feature-b", { isActive: false })).rejects.toBeInstanceOf(FeatureNotFoundError);
    expect(repository.updateOwned).toHaveBeenCalledWith("feature-b", "user-a", { name: "Changed" });
    expect(repository.updateStatusOwned).toHaveBeenCalledWith("feature-b", "user-a", { isActive: false });
  });

  it("rejects an option when its feature is not owned by the current user", async () => {
    const repository = {
      createOptionForOwnedFeature: vi.fn(async () => null),
      updateOptionOwnedByFeature: vi.fn(async () => null),
    } as unknown as FeatureRepository;
    const service = createFeatureService(repository);

    await expect(service.createFeatureOption("user-a", "feature-b", { name: "OAuth", selectionType: "SINGLE" })).rejects.toBeInstanceOf(FeatureNotFoundError);
    await expect(service.updateFeatureOption("user-a", "feature-a", "option-b", { name: "OAuth" })).rejects.toBeInstanceOf(FeatureOptionNotFoundError);
  });
});
